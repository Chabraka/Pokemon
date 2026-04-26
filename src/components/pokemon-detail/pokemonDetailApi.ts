import type { Locale, PokemonDetail, PokemonEvolutionNode, PokemonTypeEffectiveness, PokemonTypeRef } from './types'

const API = 'https://pokeapi.co/api/v2'

const typeLabels: Record<Locale, Record<string, string>> = {
  fr: {
    normal: 'Normal',
    fire: 'Feu',
    water: 'Eau',
    electric: 'Electrik',
    grass: 'Plante',
    ice: 'Glace',
    fighting: 'Combat',
    poison: 'Poison',
    ground: 'Sol',
    flying: 'Vol',
    psychic: 'Psy',
    bug: 'Insecte',
    rock: 'Roche',
    ghost: 'Spectre',
    dragon: 'Dragon',
    dark: 'Tenebres',
    steel: 'Acier',
    fairy: 'Fee',
  },
  en: {},
}

const statLabels: Record<Locale, Record<string, string>> = {
  fr: {
    hp: 'PV',
    attack: 'Attaque',
    defense: 'Defense',
    'special-attack': 'Attaque Spe.',
    'special-defense': 'Defense Spe.',
    speed: 'Vitesse',
  },
  en: {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed',
  },
}

const typeCache = new Map<string, unknown>()
const speciesCache = new Map<number, unknown>()
const localizedNameCache = new Map<string, string>()

function toTitle(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function idFromUrl(url: string): number {
  const last = url.split('/').filter(Boolean).at(-1)
  const id = Number(last)
  return Number.isFinite(id) ? id : 0
}

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(`${API}/${path}`)
  if (!res.ok) throw new Error(`PokeAPI error on ${path}`)
  return res.json()
}

async function fetchLocalizedNameByUrl(url: string | undefined, locale: Locale, fallback: string): Promise<string> {
  if (!url || locale !== 'fr') return fallback
  const cacheKey = `${url}|${locale}`
  if (localizedNameCache.has(cacheKey)) return localizedNameCache.get(cacheKey) as string
  try {
    const res = await fetch(url)
    if (!res.ok) {
      localizedNameCache.set(cacheKey, fallback)
      return fallback
    }
    const data = await res.json()
    const localized =
      data.names?.find((x: any) => x.language?.name === locale)?.name ??
      data.names?.find((x: any) => x.language?.name === 'en')?.name ??
      fallback
    localizedNameCache.set(cacheKey, localized)
    return localized
  } catch {
    localizedNameCache.set(cacheKey, fallback)
    return fallback
  }
}

function localizeType(typeName: string, locale: Locale): PokemonTypeRef {
  return { key: typeName, label: typeLabels[locale][typeName] ?? toTitle(typeName) }
}

async function fetchTypeEffectiveness(types: string[], locale: Locale): Promise<PokemonTypeEffectiveness> {
  const multipliers = new Map<string, number>()
  const applyFactor = (typeName: string, factor: number) => {
    const previous = multipliers.get(typeName) ?? 1
    multipliers.set(typeName, previous * factor)
  }

  const payloads = await Promise.all(
    types.map(async (typeName) => {
      if (typeCache.has(typeName)) return typeCache.get(typeName) as any
      const data = await fetchJson(`type/${typeName}`)
      typeCache.set(typeName, data)
      return data
    })
  )

  payloads.forEach((data) => {
    ;(data.damage_relations?.double_damage_from ?? []).forEach((entry: any) => applyFactor(entry.name, 2))
    ;(data.damage_relations?.half_damage_from ?? []).forEach((entry: any) => applyFactor(entry.name, 0.5))
    ;(data.damage_relations?.no_damage_from ?? []).forEach((entry: any) => applyFactor(entry.name, 0))
  })

  const weaknesses: PokemonTypeRef[] = []
  const resistances: PokemonTypeRef[] = []
  const immunities: PokemonTypeRef[] = []
  multipliers.forEach((value, typeName) => {
    if (value === 0) immunities.push(localizeType(typeName, locale))
    else if (value > 1) weaknesses.push(localizeType(typeName, locale))
    else if (value < 1) resistances.push(localizeType(typeName, locale))
  })
  weaknesses.sort((a, b) => a.label.localeCompare(b.label))
  resistances.sort((a, b) => a.label.localeCompare(b.label))
  immunities.sort((a, b) => a.label.localeCompare(b.label))

  return { weaknesses, resistances, immunities }
}

async function fetchSpecies(id: number): Promise<any> {
  if (speciesCache.has(id)) return speciesCache.get(id)
  const data = await fetchJson(`pokemon-species/${id}`)
  speciesCache.set(id, data)
  return data
}

function getGenderRatioLabel(genderRate: number, locale: Locale): string {
  if (genderRate === -1) return locale === 'fr' ? 'Asexue' : 'Genderless'
  const femalePercent = Number(((genderRate / 8) * 100).toFixed(1))
  const malePercent = Number((100 - femalePercent).toFixed(1))
  return `${malePercent}% ♂ / ${femalePercent}% ♀`
}

async function fetchEvolutionChain(chainUrl: string | undefined, locale: Locale): Promise<PokemonEvolutionNode[]> {
  if (!chainUrl) return []
  const res = await fetch(chainUrl)
  if (!res.ok) return []
  const payload = await res.json()
  const out: PokemonEvolutionNode[] = []

  async function walk(node: any): Promise<void> {
    if (!node?.species?.url) return
    const id = idFromUrl(node.species.url)
    const species = await fetchSpecies(id)
    const name =
      species.names?.find((n: any) => n.language?.name === locale)?.name ??
      species.names?.find((n: any) => n.language?.name === 'en')?.name ??
      toTitle(node.species.name)
    out.push({
      id,
      slug: node.species.name,
      name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    })
    for (const next of node.evolves_to ?? []) await walk(next)
  }

  await walk(payload.chain)
  return out
}

export async function fetchPokemonDetail(identifier: string, locale: Locale): Promise<PokemonDetail> {
  const pokemon = await fetchJson(`pokemon/${encodeURIComponent(identifier)}`)
  const species = await fetchSpecies(pokemon.id)

  const localizedName =
    species.names?.find((n: any) => n.language?.name === locale)?.name ??
    species.names?.find((n: any) => n.language?.name === 'en')?.name ??
    toTitle(pokemon.name)
  const category =
    species.genera?.find((g: any) => g.language?.name === locale)?.genus ??
    species.genera?.find((g: any) => g.language?.name === 'en')?.genus ??
    '-'
  const description = String(
    species.flavor_text_entries?.find((x: any) => x.language?.name === locale)?.flavor_text ??
      species.flavor_text_entries?.find((x: any) => x.language?.name === 'en')?.flavor_text ??
      ''
  )
    .replace(/\s+/g, ' ')
    .trim()

  const types = (pokemon.types ?? [])
    .sort((a: any, b: any) => a.slot - b.slot)
    .map((entry: any) => localizeType(entry.type.name, locale))

  const abilities = await Promise.all(
    (pokemon.abilities ?? [])
      .sort((a: any, b: any) => Number(a.is_hidden) - Number(b.is_hidden))
      .map(async (entry: any) => ({
        name: await fetchLocalizedNameByUrl(entry.ability?.url, locale, toTitle(entry.ability?.name ?? '')),
        isHidden: Boolean(entry.is_hidden),
      }))
  )

  const stats = (pokemon.stats ?? []).map((entry: any) => ({
    key: entry.stat?.name,
    label: statLabels[locale][entry.stat?.name] ?? toTitle(entry.stat?.name ?? ''),
    value: entry.base_stat ?? 0,
  }))

  const rawTypeNames = (pokemon.types ?? [])
    .sort((a: any, b: any) => a.slot - b.slot)
    .map((entry: any) => entry.type?.name)
    .filter(Boolean)
  const typeEffectiveness = await fetchTypeEffectiveness(rawTypeNames, locale)
  const evolutions = await fetchEvolutionChain(species.evolution_chain?.url, locale)

  const localizedHabitat = await fetchLocalizedNameByUrl(
    species.habitat?.url,
    locale,
    toTitle(species.habitat?.name ?? '-')
  )
  const localizedEggGroups = await Promise.all(
    (species.egg_groups ?? []).map((group: any) =>
      fetchLocalizedNameByUrl(group.url, locale, toTitle(group.name))
    )
  )
  const localizedGrowth = await fetchLocalizedNameByUrl(
    species.growth_rate?.url,
    locale,
    toTitle(species.growth_rate?.name ?? '-')
  )
  const localizedColor = await fetchLocalizedNameByUrl(
    species.color?.url,
    locale,
    toTitle(species.color?.name ?? '-')
  )
  const localizedShape = await fetchLocalizedNameByUrl(
    species.shape?.url,
    locale,
    toTitle(species.shape?.name ?? '-')
  )
  const localizedMoves = await Promise.all(
    (pokemon.moves ?? []).map((entry: any) =>
      fetchLocalizedNameByUrl(entry.move?.url, locale, toTitle(entry.move?.name ?? ''))
    )
  )

  return {
    id: pokemon.id,
    slug: pokemon.name,
    name: localizedName,
    category,
    description,
    types,
    image:
      pokemon.sprites?.other?.['official-artwork']?.front_default ??
      pokemon.sprites?.front_default ??
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
    shinyImage: pokemon.sprites?.other?.['official-artwork']?.front_shiny ?? pokemon.sprites?.front_shiny ?? null,
    cryAudio: pokemon.cries?.latest ?? null,
    heightM: (pokemon.height ?? 0) / 10,
    weightKg: (pokemon.weight ?? 0) / 10,
    habitat: localizedHabitat,
    eggGroups: localizedEggGroups.filter(Boolean),
    baseExperience: pokemon.base_experience ?? 0,
    baseHappiness: species.base_happiness ?? 0,
    captureRate: species.capture_rate ?? 0,
    growth: localizedGrowth,
    color: localizedColor,
    shape: localizedShape,
    genderRatioLabel: getGenderRatioLabel(species.gender_rate, locale),
    abilities,
    stats,
    typeEffectiveness,
    evolutions,
    moves: localizedMoves.filter(Boolean).sort((a: string, b: string) => a.localeCompare(b)),
    forms: (species.varieties ?? []).map((x: any) => toTitle(x.pokemon?.name ?? '')).filter(Boolean),
  }
}
