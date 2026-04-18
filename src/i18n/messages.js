/** Clés de traduction : `fr` et `en`. */

export const messages = {
  fr: {
    'lang.group': 'Langue',
    'meta.title': 'Pokédex',

    'pokedex.title': 'Pokédex',
    'pokedex.hint':
      'Choisis une génération (Gen 1, Gen 2, …). Les noms viennent de la PokéAPI (français). Utilise le bouton imprimante pour imprimer ou enregistrer en PDF : uniquement les icônes de cette génération, sur fond blanc.',
    'pokedex.genTabs': 'Filtrer par génération',
    'pokedex.genTab': 'Gen {n}',
    'pokedex.loadingGen': 'Chargement de la génération {n}…',
    'pokedex.genCount': '{count} Pokémon — Génération {gen}',
    'pokedex.printTitle': 'Imprimer les icônes de la génération affichée (PDF ou papier)',
    'pokedex.printAria': 'Imprimer les icônes de la génération affichée',

    'errors.emptyGen': 'Aucun Pokémon pour cette génération.',
  },
  en: {
    'lang.group': 'Language',
    'meta.title': 'Pokédex',

    'pokedex.title': 'Pokédex',
    'pokedex.hint':
      'Pick a generation (Gen 1, Gen 2, …). Names are shown in English (from the API slug). Use the printer button to print or save as PDF: only the icons for that generation, on a white background.',
    'pokedex.genTabs': 'Filter by generation',
    'pokedex.genTab': 'Gen {n}',
    'pokedex.loadingGen': 'Loading generation {n}…',
    'pokedex.genCount': '{count} Pokémon — Generation {gen}',
    'pokedex.printTitle': 'Print icons for the current generation (PDF or paper)',
    'pokedex.printAria': 'Print icons for the current generation',

    'errors.emptyGen': 'No Pokémon for this generation.',
  },
}

export function interpolate(template, vars) {
  const str = template == null ? '' : String(template)
  if (!vars || typeof vars !== 'object') return str
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''
  )
}
