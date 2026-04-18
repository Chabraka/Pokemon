const POKEAPI = 'https://pokeapi.co/api/v2'
const SPECIES_BATCH = 10

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
  const res = await fetch(`${POKEAPI}/pokemon-species/${speciesId}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.names?.find((n) => n.language?.name === 'fr')?.name ?? null
}

/**
 * Ajoute `displayName` à chaque entrée : noms FR (PokéAPI) si locale `fr`,
 * sinon noms anglais formatés depuis le slug.
 */
export async function attachDisplayNames(list, locale) {
  if (!list.length) return list
  if (locale !== 'fr') {
    return list.map((p) => ({
      ...p,
      displayName: prettifySpeciesName(p.name),
    }))
  }

  const out = []
  for (let i = 0; i < list.length; i += SPECIES_BATCH) {
    const chunk = list.slice(i, i + SPECIES_BATCH)
    const resolved = await Promise.all(
      chunk.map(async (p) => {
        const fr = await fetchFrenchNameForSpeciesId(p.id)
        return {
          ...p,
          displayName: fr ?? prettifySpeciesName(p.name),
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

/** Nombre de générations disponibles côté UI (PokéAPI : 1–9). */
export const GENERATION_COUNT = 9
