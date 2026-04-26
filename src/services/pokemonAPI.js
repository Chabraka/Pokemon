const POKEAPI = 'https://pokeapi.co/api/v2'
const SPECIES_BATCH = 10
const TYPE_BATCH = 12
const pokemonTypeCache = new Map()
const frenchNameCache = new Map()
const pokemonDetailsCache = new Map()
const abilityNameCache = new Map()
const typeEffectCache = new Map()
const pokemonCardsCache = new Map()

/** Extrait l’ID numérique depuis une URL PokéAPI (…/pokemon-species/12/) */
function idFromSpeciesUrl(url) {
  const parts = url.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  const n = Number(last)
  return Number.isFinite(n) ? n : 0
}

/** Nom affiché à partir du slug API (ex. `charmander` → Charmander). */
export function prettifySpeciesName(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function fetchFrenchNameForSpeciesId(speciesId) {
  if (frenchNameCache.has(speciesId)) {
    return frenchNameCache.get(speciesId)
  }
  const res = await fetch(`${POKEAPI}/pokemon-species/${speciesId}`)
  if (!res.ok) {
    frenchNameCache.set(speciesId, null)
    return null
  }
  const data = await res.json()
  const frName = data.names?.find((n) => n.language?.name === 'fr')?.name ?? null
  frenchNameCache.set(speciesId, frName)
  return frName
}

/**
 * Ajoute `displayName` à chaque entrée : noms FR (PokéAPI) si locale `fr`,
 * sinon noms anglais formatés depuis le slug.
 */
export async function attachDisplayNames(list, locale) {
  if (!list.length) return list
  const out = []
  for (let i = 0; i < list.length; i += SPECIES_BATCH) {
    const chunk = list.slice(i, i + SPECIES_BATCH)
    const resolved = await Promise.all(
      chunk.map(async (p) => {
        const fr = await fetchFrenchNameForSpeciesId(p.id)
        const englishName = prettifySpeciesName(p.name)
        return {
          ...p,
          frenchName: fr ?? englishName,
          englishName,
          displayName: locale === 'fr' ? (fr ?? englishName) : englishName,
        }
      })
    )
    out.push(...resolved)
  }
  return out
}

async function fetchPokemonTypesById(pokemonId) {
  if (pokemonTypeCache.has(pokemonId)) {
    return pokemonTypeCache.get(pokemonId)
  }
  const res = await fetch(`${POKEAPI}/pokemon/${pokemonId}`)
  if (!res.ok) throw new Error(`Pokemon ${pokemonId} introuvable`)
  const data = await res.json()
  const types = (data.types ?? [])
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type?.name)
    .filter(Boolean)
  pokemonTypeCache.set(pokemonId, types)
  return types
}

export async function attachPokemonTypes(list) {
  if (!list.length) return list
  const out = []
  for (let i = 0; i < list.length; i += TYPE_BATCH) {
    const chunk = list.slice(i, i + TYPE_BATCH)
    const resolved = await Promise.all(
      chunk.map(async (p) => {
        try {
          const types = await fetchPokemonTypesById(p.id)
          return { ...p, types }
        } catch (err) {
          console.error('attachPokemonTypes:', err)
          return { ...p, types: [] }
        }
      })
    )
    out.push(...resolved)
  }
  return out
}

/**
 * Tous les Pokémon d’une génération (ordre du Pokédex national).
 * @param {number} generation — 1 à 9
 */
export async function fetchPokemonByGeneration(generation) {
  try {
    const response = await fetch(`${POKEAPI}/generation/${generation}`)
    if (!response.ok) throw new Error(`Génération ${generation} introuvable`)
    const data = await response.json()
    const species = data.pokemon_species
    if (!Array.isArray(species)) return []

    const list = species.map((s) => {
      const id = idFromSpeciesUrl(s.url)
      return {
        name: s.name,
        id,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      }
    })

    list.sort((a, b) => a.id - b.id)
    return list
  } catch (err) {
    console.error('fetchPokemonByGeneration:', err)
    return []
  }
}

/**
 * Tous les Pokémon disponibles (toutes générations), triés par ID national.
 */
export async function fetchAllPokemon() {
  try {
    const response = await fetch(`${POKEAPI}/pokemon-species?limit=2000`)
    if (!response.ok) throw new Error('Liste globale des Pokemon introuvable')
    const data = await response.json()
    const species = data.results
    if (!Array.isArray(species)) return []

    const list = species
      .map((s) => {
        const id = idFromSpeciesUrl(s.url)
        return {
          name: s.name,
          id,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        }
      })
      .filter((p) => p.id > 0)

    list.sort((a, b) => a.id - b.id)
    return list
  } catch (err) {
    console.error('fetchAllPokemon:', err)
    return []
  }
}

function extractEvolutionChain(node, out = []) {
  if (!node?.species?.name) return out
  out.push({
    name: node.species.name,
    id: idFromSpeciesUrl(node.species.url),
  })
  ;(node.evolves_to ?? []).forEach((child) => extractEvolutionChain(child, out))
  return out
}

async function fetchLocalizedAbilityName(abilityName, locale) {
  const cacheKey = `${abilityName}-${locale}`
  if (abilityNameCache.has(cacheKey)) return abilityNameCache.get(cacheKey)
  try {
    if (locale !== 'fr') {
      const fallback = prettifySpeciesName(abilityName)
      abilityNameCache.set(cacheKey, fallback)
      return fallback
    }
    const res = await fetch(`${POKEAPI}/ability/${abilityName}`)
    if (!res.ok) throw new Error('Ability not found')
    const data = await res.json()
    const localized =
      data.names?.find((n) => n.language?.name === 'fr')?.name ?? prettifySpeciesName(abilityName)
    abilityNameCache.set(cacheKey, localized)
    return localized
  } catch {
    const fallback = prettifySpeciesName(abilityName)
    abilityNameCache.set(cacheKey, fallback)
    return fallback
  }
}

async function fetchTypeEffectiveness(typeNames) {
  const cacheKey = [...typeNames].sort().join('|')
  if (typeEffectCache.has(cacheKey)) return typeEffectCache.get(cacheKey)

  const multipliers = new Map()
  const setMultiplier = (targetType, factor) => {
    const prev = multipliers.get(targetType) ?? 1
    multipliers.set(targetType, prev * factor)
  }

  const typePayloads = await Promise.all(
    (typeNames ?? []).map(async (typeName) => {
      try {
        const res = await fetch(`${POKEAPI}/type/${typeName}`)
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    })
  )

  typePayloads.filter(Boolean).forEach((typeData) => {
    ;(typeData.damage_relations?.double_damage_from ?? []).forEach((entry) => setMultiplier(entry.name, 2))
    ;(typeData.damage_relations?.half_damage_from ?? []).forEach((entry) => setMultiplier(entry.name, 0.5))
    ;(typeData.damage_relations?.no_damage_from ?? []).forEach((entry) => setMultiplier(entry.name, 0))
  })

  const result = {
    weaknesses: [],
    resistances: [],
    immunities: [],
  }
  for (const [typeName, value] of multipliers.entries()) {
    if (value === 0) result.immunities.push(typeName)
    else if (value > 1) result.weaknesses.push(typeName)
    else if (value < 1) result.resistances.push(typeName)
  }
  result.weaknesses.sort()
  result.resistances.sort()
  result.immunities.sort()
  typeEffectCache.set(cacheKey, result)
  return result
}

export async function fetchPokemonDetails(pokemonId, locale = 'fr') {
  const cacheKey = `${pokemonId}-${locale}`
  if (pokemonDetailsCache.has(cacheKey)) return pokemonDetailsCache.get(cacheKey)

  try {
    const [pokemonRes, speciesRes] = await Promise.all([
      fetch(`${POKEAPI}/pokemon/${pokemonId}`),
      fetch(`${POKEAPI}/pokemon-species/${pokemonId}`),
    ])
    if (!pokemonRes.ok || !speciesRes.ok) throw new Error(`Details Pokemon ${pokemonId} introuvables`)

    const [pokemonData, speciesData] = await Promise.all([pokemonRes.json(), speciesRes.json()])

    const evolutionChainUrl = speciesData.evolution_chain?.url
    const evolutionData = evolutionChainUrl
      ? await fetch(evolutionChainUrl).then((r) => (r.ok ? r.json() : null))
      : null

    const chain = evolutionData?.chain ? extractEvolutionChain(evolutionData.chain) : []
    const evolutions = chain.map(({ name, id: evolutionId }) => {
      return {
        name: prettifySpeciesName(name),
        id: Number.isFinite(evolutionId) && evolutionId > 0 ? evolutionId : null,
        image:
          Number.isFinite(evolutionId) && evolutionId > 0
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolutionId}.png`
            : null,
      }
    })

    const englishName = prettifySpeciesName(pokemonData.name)
    const frName = speciesData.names?.find((n) => n.language?.name === 'fr')?.name ?? englishName
    const localizedName = locale === 'fr' ? frName : englishName
    const genus =
      speciesData.genera?.find((g) => g.language?.name === (locale === 'fr' ? 'fr' : 'en'))?.genus ??
      speciesData.genera?.find((g) => g.language?.name === 'en')?.genus ??
      ''
    const flavor =
      speciesData.flavor_text_entries?.find((e) => e.language?.name === (locale === 'fr' ? 'fr' : 'en'))
        ?.flavor_text ??
      speciesData.flavor_text_entries?.find((e) => e.language?.name === 'en')?.flavor_text ??
      ''

    const abilities = await Promise.all(
      (pokemonData.abilities ?? [])
        .sort((a, b) => Number(a.is_hidden) - Number(b.is_hidden))
        .map(async (entry) => ({
          name: await fetchLocalizedAbilityName(entry.ability?.name ?? '', locale),
          isHidden: Boolean(entry.is_hidden),
        }))
    )

    const typeEffectiveness = await fetchTypeEffectiveness(
      (pokemonData.types ?? [])
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type?.name)
        .filter(Boolean)
    )

    const genderRate = speciesData.gender_rate
    let genderLabel = 'Unknown'
    if (genderRate === -1) genderLabel = locale === 'fr' ? 'Asexue' : 'Genderless'
    else if (genderRate === 0) genderLabel = locale === 'fr' ? 'Male' : 'Male'
    else if (genderRate === 8) genderLabel = locale === 'fr' ? 'Femelle' : 'Female'
    else genderLabel = locale === 'fr' ? 'Male / Femelle' : 'Male / Female'

    const details = {
      id: pokemonData.id,
      name: pokemonData.name,
      displayName: localizedName,
      englishName,
      frenchName: frName,
      image:
        pokemonData.sprites?.other?.['official-artwork']?.front_default ??
        pokemonData.sprites?.front_default ??
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonData.id}.png`,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonData.id}.png`,
      shinyImage:
        pokemonData.sprites?.other?.['official-artwork']?.front_shiny ?? pokemonData.sprites?.front_shiny ?? null,
      cryAudio: pokemonData.cries?.latest ?? null,
      types: (pokemonData.types ?? [])
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type?.name)
        .filter(Boolean),
      genus: String(genus).replace(/\s+/g, ' ').trim(),
      gender: genderLabel,
      heightM: (pokemonData.height ?? 0) / 10,
      weightKg: (pokemonData.weight ?? 0) / 10,
      baseExperience: pokemonData.base_experience ?? 0,
      captureRate: speciesData.capture_rate ?? 0,
      baseHappiness: speciesData.base_happiness ?? 0,
      growthRate: prettifySpeciesName(speciesData.growth_rate?.name ?? ''),
      eggGroups: (speciesData.egg_groups ?? []).map((g) => prettifySpeciesName(g.name)).filter(Boolean),
      habitat: prettifySpeciesName(speciesData.habitat?.name ?? ''),
      color: prettifySpeciesName(speciesData.color?.name ?? ''),
      shape: prettifySpeciesName(speciesData.shape?.name ?? ''),
      abilities: abilities.filter((a) => a.name),
      stats: (pokemonData.stats ?? []).map((entry) => ({
        name: entry.stat?.name ?? '',
        value: entry.base_stat ?? 0,
      })),
      moves: (pokemonData.moves ?? [])
        .map((entry) => entry.move?.name)
        .filter(Boolean)
        .map((name) => prettifySpeciesName(name))
        .sort()
        .slice(0, 30),
      flavorText: String(flavor).replace(/\s+/g, ' ').trim(),
      evolutions,
      varieties: (speciesData.varieties ?? [])
        .map((v) => prettifySpeciesName(v.pokemon?.name ?? ''))
        .filter(Boolean),
      typeEffectiveness,
    }

    pokemonDetailsCache.set(cacheKey, details)
    return details
  } catch (err) {
    console.error('fetchPokemonDetails:', err)
    return null
  }
}

export async function fetchPokemonCards(pokemonId) {
  if (pokemonCardsCache.has(pokemonId)) return pokemonCardsCache.get(pokemonId)
  try {
    const url =
      `https://api.pokemontcg.io/v2/cards?` +
      `q=nationalPokedexNumbers:${pokemonId}` +
      `&pageSize=250` +
      `&select=id,name,images,set,number,rarity,artist,types`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Cards not found')
    const data = await res.json()
    const cards = (data.data ?? []).map((card) => ({
      id: card.id,
      name: card.name,
      setName: card.set?.name ?? '',
      releaseDate: card.set?.releaseDate ?? '',
      number: card.number ?? '',
      imageSmall: card.images?.small ?? '',
      imageLarge: card.images?.large ?? '',
      rarity: card.rarity ?? '',
      artist: card.artist ?? '',
      types: card.types ?? [],
    }))
    cards.sort((a, b) => {
      const aTime = a.releaseDate ? Date.parse(a.releaseDate) : 0
      const bTime = b.releaseDate ? Date.parse(b.releaseDate) : 0
      return aTime - bTime
    })
    pokemonCardsCache.set(pokemonId, cards)
    return cards
  } catch (err) {
    console.error('fetchPokemonCards:', err)
    return []
  }
}

/** Nombre de générations disponibles côté UI (PokéAPI : 1–9). */
export const GENERATION_COUNT = 9
