const POKEAPI = 'https://pokeapi.co/api/v2'
const SPECIES_BATCH = 10
const TYPE_BATCH = 12
const pokemonTypeCache = new Map()
const frenchNameCache = new Map()

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

/** Nombre de générations disponibles côté UI (PokéAPI : 1–9). */
export const GENERATION_COUNT = 9
