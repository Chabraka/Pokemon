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

- **`vite.config.js`** : en production (`npm run build`), `base` est **`/Pokemon/`** pour que les assets se chargent sous le sous-chemin GitHub Pages. En dev (`npm run dev`), `base` reste **`/`**.
- **`public/.nojekyll`** : évite que GitHub Pages (Jekyll) ignore certains fichiers.
- **`.github/workflows/deploy-pages.yml`** : à chaque push sur **`main`**, build Vite puis déploie le dossier **`dist`** sur GitHub Pages.

### À activer une fois sur GitHub

1. Repo **Pokemon** → **Settings** → **Pages**
2. **Build and deployment** → **Source** : **GitHub Actions** (pas “Deploy from a branch”).

### Déclencher / vérifier le déploiement

- Push sur **`main`** (le workflow se lance tout seul), ou onglet **Actions** → workflow **Deploy to GitHub Pages** → **Run workflow**.
- Quand c’est vert, ouvre **`https://chabraka.github.io/Pokemon/`** (le premier déploiement peut prendre 1–2 minutes).

### Si tu renommes le dépôt GitHub

Adapte **`repoBase`** dans `vite.config.js` pour qu’il corresponde exactement à `/<nom-du-repo>/`.

### Tester le build “comme en prod” en local

```bash
npm run build
npm run preview:pages
```

Puis ouvre l’URL affichée (souvent `http://localhost:4173/Pokemon/`).

## Modifier l'app

- Pour changer le nombre de générations : `GENERATION_COUNT` dans `pokemonAPI.js`.
