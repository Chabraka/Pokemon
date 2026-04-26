export type Locale = 'fr' | 'en'

export interface PokemonTypeRef {
  key: string
  label: string
}

export interface PokemonAbility {
  name: string
  isHidden: boolean
}

export interface PokemonStat {
  key: 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'
  label: string
  value: number
}

export interface PokemonTypeEffectiveness {
  weaknesses: PokemonTypeRef[]
  resistances: PokemonTypeRef[]
  immunities: PokemonTypeRef[]
}

export interface PokemonEvolutionNode {
  id: number
  slug: string
  name: string
  image: string
}

export interface PokemonDetail {
  id: number
  slug: string
  name: string
  category: string
  description: string
  types: PokemonTypeRef[]
  image: string
  shinyImage: string | null
  cryAudio: string | null
  heightM: number
  weightKg: number
  habitat: string
  eggGroups: string[]
  baseExperience: number
  baseHappiness: number
  captureRate: number
  growth: string
  color: string
  shape: string
  genderRatioLabel: string
  abilities: PokemonAbility[]
  stats: PokemonStat[]
  typeEffectiveness: PokemonTypeEffectiveness
  evolutions: PokemonEvolutionNode[]
  moves: string[]
  forms: string[]
}
