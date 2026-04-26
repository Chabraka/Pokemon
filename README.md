# Pokemon - Pokedex React

Application web Pokédex construite avec React + Vite.

## Voir le site

- En local (développement) :
  - `npm install`
  - `npm run dev`
  - Ouvrir l'URL affichée (souvent `http://localhost:5173`)
- Version publique (GitHub Pages) :
  - [https://chabraka.github.io/Pokemon/](https://chabraka.github.io/Pokemon/)

## Ce que fait l'application

- Affiche les Pokémon par génération, avec mode par défaut sur **Toutes les générations**
- Recherche plus stricte (accents ignorés, tolérance aux fautes réduite) avec message si aucun Pokémon n est trouvé
- Filtres par type (multi-sélection)
- Pagination (50 Pokémon par page)
- Page de détails complète au clic sur un Pokémon (types, stats, sexe, capture, bonheur, groupes d oeufs, faiblesses/resistances, évolutions, formes, moves, media)
- Hero de la page détail dynamique selon le type principal (couleurs et particules flottantes adaptées : feuilles, flammes, gouttes, etc.)
- Nouvelle mise en page détaillée inspirée d une fiche Pokédex moderne (hero complet, panneaux infos/stats/évolutions/capacités)
- Clic sur l image principale : bascule Normal/Shiny (si disponible), petite animation, et lecture du cri du Pokémon
- Correctif React : ordre des hooks stabilise dans la page détail pour éviter l erreur "Rendered more hooks than during the previous render"
- Ajustement visuel supplémentaire de la page détail pour se rapprocher au maximum de la maquette (typos, proportions, cartes, espacements, encarts taille/poids)
- Nouvelle implémentation modulaire en React + TypeScript pour la page détail (`PokemonDetailPage`, `PokemonHero`, `PokemonInfoCard`, `PokemonStats`, `PokemonTypeBadges`, `PokemonEvolutionChain`, `PokemonMoves`, `PokemonVersions`)
- Ajustements de la page détail TypeScript : suppression du bloc "Versions du Pokemon", section médias basée sur 3 cartes TCG + bouton "Voir plus de cartes", et meilleure localisation FR des données PokéAPI
- Correctifs supplémentaires page détail : nom des cartes médias adapté à la langue FR, cartes d évolution agrandies pour une meilleure lisibilité, et source audio cachée pour garantir le bon fonctionnement du bouton cri
- Ajustements UX : suppression du bouton FR/EN dans le hero détail, remplacement de l étoile par un indicateur Pokeball "Je l ai / Je ne l ai pas", et ajout d un second toggle "Je le veux" sur chaque carte TCG
- Ajustements UI supplémentaires : cartes Pokémon de la liste agrandies (images/textes), types plus compacts, bouton carte rectangulaire avec compteur de cartes possédées (>2), et mise à jour visuelle Pokeball dans le détail
- Clarification UX : le compteur de cartes représente uniquement les cartes "Je l ai" (possédées), pas les cartes "Je le veux"
- Bouton carte sur chaque Pokémon pour ouvrir une page dédiée avec ses cartes TCG
- Page cartes avec chargement Pokéball et récupération optimisée
- Les cartes TCG sont triées par date de sortie (de la plus ancienne à la plus récente)
- Le bouton Pokéball "capturé" reste utilisable sur chaque carte sans ouvrir la page détail
- La capture (Pokéball) et les cartes cochées sont enregistrées localement (sans création de compte)
- Interface FR / EN
- Sélection de Pokémon "attrapés"
- Impression des sprites en PDF/papier

## Commandes utiles

- `npm run dev` : lancer en local
- `npm run build` : construire la version production
- `npm run preview` : prévisualiser la version buildée
