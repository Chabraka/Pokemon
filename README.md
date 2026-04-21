# Projet React + Vite - Pokemon

Ce projet a été créé avec **Vite** et **React**.

## Installation du projet

- **Prérequis**: Node.js et npm installés sur ta machine.
- **Étapes exécutées**:
  - `npm create vite@latest . -- --template react`
  - `npm install`

Ces commandes créent la structure du projet et installent toutes les dépendances nécessaires.

## Lancer l'application en mode développement

Dans le dossier du projet (`Pokemon`), exécute:

- `npm run dev`

Puis ouvre l'URL affichée dans le terminal (souvent `http://localhost:5173`) dans ton navigateur.

**Note importante**: N'utilise pas "Go Live" ou un simple serveur de fichiers statiques. React avec Vite nécessite son propre serveur de développement pour compiler le JSX.

## Langue (FR / EN)

- En **haut à droite**, boutons **FR** et **EN** : basculent l’interface (titres, aide, erreurs).
- **FR** : noms Pokémon affichés en **français** (champ `names` de la PokéAPI, `pokemon-species/{id}`), par lots pour limiter la charge réseau.
- **EN** : noms affichés en **anglais** à partir du slug (ex. `charmander` → Charmander).
- Le choix est mémorisé dans **`localStorage`** (`pokemon-app-locale`).
- Fichiers : `src/i18n/LanguageContext.jsx`, `src/i18n/messages.js`, `src/components/LanguageSwitcher.jsx`.

## Page Pokédex

La page affiche **tous les Pokémon de la génération choisie**, chargés depuis la [PokéAPI](https://pokeapi.co/) (`GET /v2/generation/{n}`), triés par **numéro du Pokédex national**.

- **Boutons Gen 1 … Gen 9** : changent la génération affichée.
- **Imprimante** : imprime uniquement les **sprites** (7 × 96 px, A4). Masquage du reste avec `display: none` pour éviter les **pages blanches**. Désactive **En-têtes et pieds de page** dans la fenêtre d’impression (Chrome / Edge) si tu veux retirer date / URL.

### Fichiers utiles

- `src/App.jsx` — en-tête avec sélecteur de langue
- `src/components/Pokedex.jsx` — onglets génération + grille + impression
- `src/services/pokemonAPI.js` — génération, noms FR/EN (`attachDisplayNames`)

## Page blanche ou site invisible

- Lance bien **`npm run dev`** et l’URL locale (pas seulement `index.html` / Go Live).
- **`ErrorBoundary`** (`src/ErrorBoundary.jsx`) peut afficher un message si le rendu plante.
- Après une **impression**, rafraîchis (F5) si besoin ; vérifie que le mode **Média : impression** des outils dev n’est pas resté activé.

## Publier le projet sur Git (GitHub, GitLab, etc.)

### 1. Créer un dépôt vide sur le site

- Sur **GitHub** : *New repository* → donne un nom (ex. `Pokemon`) → **sans** README / .gitignore (tu les as déjà localement) → *Create repository*.
- Copie l’URL du dépôt : `https://github.com/TON_USER/Pokemon.git` (HTTPS) ou la forme SSH.

### 2. Dans le dossier du projet (`d:\Projets\WEB\Pokemon`)

Ouvre un terminal (**CMD** ou PowerShell avec `git` installé) :

```bat
cd D:\Projets\WEB\Pokemon
git init
git add .
git commit -m "Premier commit : Pokédex React + Vite"
git branch -M main
git remote add origin https://github.com/TON_USER/Pokemon.git
git push -u origin main
```

Remplace l’URL par la tienne. Si le dépôt distant s’appelle `master` au lieu de `main`, adapte ou utilise `git push -u origin master`.

### 3. Si le dépôt distant existe déjà avec un README

```bat
git pull origin main --allow-unrelated-histories
```

Résous les conflits éventuels, puis :

```bat
git push -u origin main
```

### 4. Connexion GitHub

- En **HTTPS** : au premier `push`, une fenêtre ou un token personnel (PAT) peut être demandé à la place du mot de passe.
- En **SSH** : configure une clé SSH sur GitHub, puis utilise une remote du type `git@github.com:TON_USER/Pokemon.git`.

Le `.gitignore` du projet ignore déjà `node_modules`, `dist`, etc. — ne les commit pas.

## GitHub Pages (site public)

URL attendue pour ce dépôt : **`https://chabraka.github.io/Pokemon/`** (forme `https://<user>.github.io/<repo>/`).

### Ce que le projet contient déjà

- **`vite.config.js`** : en **`mode` production** (`npm run build` ou `vite preview --mode production`), `base` est **`/Pokemon/`** pour que les assets se chargent sous le sous-chemin GitHub Pages. En dev (`npm run dev`), `base` reste **`/`**.
- **`public/.nojekyll`** : évite que GitHub Pages (Jekyll) ignore certains fichiers.
- **`.github/workflows/deploy-pages.yml`** : à chaque push sur **`main`**, build Vite puis met à jour la branche **`gh-pages`** avec le contenu de **`dist`** (action `peaceiris/actions-gh-pages`).
- **`npm run deploy`** : même chose **depuis ton PC** (build + push sur **`gh-pages`** avec le paquet `gh-pages`) si tu ne veux pas attendre le workflow.

### Réglages GitHub (obligatoire — sinon page blanche)

1. **Settings** → **Actions** → **General** → **Workflow permissions** : coche **Read and write permissions** (sinon le workflow ne peut pas pousser sur `gh-pages`).
2. **Settings** → **Pages** → **Build and deployment** → **Source** : **Deploy from a branch** → branche **`gh-pages`**, dossier **`/ (root)`** — **pas** la branche **`main`** (la racine de `main` contient l’`index.html` de **développement** Vite avec `/src/main.jsx`, ce qui ne fonctionne pas sur Pages).

### Déclencher le site

- Pousse ce dépôt sur **`main`** : le workflow **Deploy to GitHub Pages** crée ou met à jour **`gh-pages`**. Attends le job vert, puis ouvre **`https://chabraka.github.io/Pokemon/`** (parfois 1–2 minutes de retard).
- Ou en local : **`npm run deploy`** (Git + remote `origin` configurés), avec la même source Pages **`gh-pages`** / root.

### Si tu renommes le dépôt GitHub

Adapte **`repoBase`** dans `vite.config.js` pour qu’il corresponde exactement à `/<nom-du-repo>/`.

### Tester le build “comme en prod” en local

```bash
npm run build
npm run preview
```

Ouvre **`http://localhost:4173/Pokemon/`** (avec le segment **`/Pokemon/`**), pas seulement la racine du port, sinon les JS/CSS ne se chargent pas.

### Page blanche alors que le titre « Pokédex » apparaît

Ouvre le **code source** de la page (clic droit → *Afficher le code source de la page*). Si tu vois :

`<script type="module" src="/src/main.jsx"></script>`

alors **GitHub Pages sert l’`index.html` à la racine du dépôt** (fichier Vite de dev), **pas** le dossier **`dist`** construit par le workflow. Dans ce cas l’app ne peut pas démarrer en production.

**Correction** : *Settings* → *Pages* → **Deploy from a branch** → **`gh-pages`** / **(root)**. Vérifie aussi *Settings* → *Actions* → *General* → permissions workflow en **lecture/écriture**. Le code source de la page doit montrer `<script … src="/Pokemon/assets/…">`, pas `/src/main.jsx`.

### Si le site GitHub reste vide ou 404

- **Source Pages** : **branche `gh-pages`**, jamais **`/ (root)` sur `main`**.
- **URL** : **`https://chabraka.github.io/Pokemon/`** (casse du nom de repo dans l’URL).
- **Workflow en échec** : *Actions* → *Deploy to GitHub Pages* → logs (souvent `npm ci` si **`package-lock.json`** n’est pas sur le dépôt, ou refus d’écriture si les permissions workflow sont en lecture seule).

## Modifier l'app

- Pour changer le nombre de générations : `GENERATION_COUNT` dans `pokemonAPI.js`.
- Thème visuel :
  - l’interface reprend une esthétique **Pokédex console** : coque rouge marquée, panneau central clair, blocs rétro.
  - le titre **POKÉDEX** est positionné au-dessus de l’interface, en rouge avec contour blanc (style logo).
  - la colonne de droite reprend un style “console dex” avec un bloc de statut en haut.
  - la recherche garde la palette rouge/vert et une police pixelisée type jeu vidéo/DS.
  - les cartes Pokémon affichent le numéro en haut à gauche avec une pastille liée à la couleur du type principal.
  - un bouton Pokéball (contour / rempli) permet de sélectionner puis désélectionner chaque Pokémon.
  - les types sont affichés en badges et localisés selon la langue active (FR/EN).
  - les filtres par type sont multi-sélectionnables (combinaison de plusieurs types).
  - le bloc de statut est renommé **POKEDEX**, affiche le total de la génération et le nombre attrapé (sélectionné).
  - la barre de recherche est plus large, sans texte par défaut, avec un aperçu sprite plus visible.
  - les couleurs de types sont accentuées pour les cartes et les badges de type.
  - le texte des types est centré (badges de cartes et filtres de type).
  - l’alignement vertical des badges de type est ajusté pour garder le texte parfaitement centré.
  - chaque carte Pokémon utilise une couleur de fond selon le **type principal** (`data-type` dans `src/components/Pokedex.jsx`).
  - les cartes Pokémon ont une taille uniforme pour une grille plus régulière.
  - les types ne sont pas affichés dans la grille (la couleur de fond reste basée sur le type principal).
  - le texte d’aide en haut de la zone principale et la ligne de compteur au-dessus de la grille sont masqués pour une interface plus épurée.
- Recherche :
  - un champ de recherche (avec icône loupe) est placé dans le panneau de droite et filtre les Pokémon par nom FR ou EN.
  - l’exemple du placeholder de recherche a été remplacé par **Bulbizarre / Bulbasaur**.
  - la recherche est tolérante : accents ignorés (ex. `salamèche`/`salameche`) et petites fautes (`distance de Levenshtein`).
  - la recherche est **globale** : quand un texte est saisi, elle ignore les filtres de génération et de type pour retrouver un Pokémon sur l’ensemble du Pokédex.
  - la barre de recherche a été compactée (moins de padding/hauteur) pour éviter un bloc sombre trop grand autour du champ.
  - l’aperçu sprite du Pokémon dans la barre de recherche a été agrandi.
  - l’aperçu sprite est positionné en absolu pour pouvoir grandir sans augmenter la hauteur de la barre de recherche.
  - la barre de recherche a été légèrement ré-agrandie (padding + texte) pour un meilleur confort de lecture.
  - la barre de recherche est visuellement élargie dans la sidebar, et le sprite d’aperçu est aligné au maximum vers la droite.
- Filtres par type :
  - les filtres génération/type utilisent des listes déroulantes compactes (style sélecteur) pour alléger la longueur de la sidebar.
  - le filtre de type est **multi-sélection** (combinaison de plusieurs types, logique ET).
  - le sélecteur de type affiche des pastilles colorées (même palette que les badges des cartes) pour mieux se repérer.
  - la zone de sélection des types a été agrandie (pastilles plus grosses + contraste renforcé) pour une meilleure lisibilité.
  - le texte des types a été augmenté (taille + graisse) pour une lecture immédiate.
  - les pastilles de type du filtre ont une taille augmentée (espacement, hauteur et padding) pour améliorer la lecture sur toute la grille.
  - les pastilles ont aussi une largeur minimale plus grande pour rester lisibles et uniformes visuellement.
  - la taille du texte des pastilles de filtre a encore été augmentée pour correspondre visuellement aux badges de type sous les cartes Pokémon.
  - le texte des pastilles du filtre est maintenant fortement agrandi (priorité lisibilité), tout en conservant des largeurs de pastilles naturelles selon le contenu.
  - correction CSS appliquée : la règle de taille des pastilles de filtre est prioritaire sur le style générique des badges pour garantir l’agrandissement visible.
  - ajustement fin appliqué ensuite : taille des pastilles de filtre légèrement réduite pour un meilleur équilibre visuel.
  - ajustement supplémentaire : pastilles de filtre réduites à nouveau pour un rendu plus compact.
- Filtres génération :
  - un mode **Toutes les générations** est disponible.
  - la liste est paginée en tranches de **50 Pokémon par page** avec pagination en bas de la grille (numéros + ellipses).
- Recherche :
  - l’aperçu sprite dans la barre de recherche est plus grand pour une identification visuelle plus rapide.
- Chargement :
  - pendant le fetch, une Pokéball animée s’affiche (rotation).
  - à la fin du chargement d’une génération, la grille apparaît avec un effet de zoom léger.
