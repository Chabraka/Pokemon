import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages (dépôt projet) : https://<user>.github.io/<repo>/
// Si tu renommes le dépôt GitHub, adapte ce chemin (doit finir par /).
const repoBase = '/Pokemon/'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? repoBase : '/',
}))
