import { useEffect, useState } from 'react'
import Pokedex from './components/Pokedex.jsx'
import PokemonDetailPage from './components/pokemon-detail/PokemonDetailPage.tsx'
import PokemonCardsPage from './components/PokemonCardsPage.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'

function parseRouteFromHash() {
  const cardsMatch = window.location.hash.match(/^#\/pokemon\/(\d+)\/cards$/)
  if (cardsMatch) return { view: 'cards', id: Number(cardsMatch[1]) }
  const detailsMatch = window.location.hash.match(/^#\/pokemon\/([^/]+)$/)
  if (detailsMatch) return { view: 'details', id: decodeURIComponent(detailsMatch[1]) }
  return { view: 'list', id: null }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRouteFromHash())

  useEffect(() => {
    const onHashChange = () => setRoute(parseRouteFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function openPokemonDetails(pokemonId) {
    window.location.hash = `#/pokemon/${pokemonId}`
  }

  function closePokemonDetails() {
    window.location.hash = '#/'
  }

  function openPokemonCards(pokemonId) {
    window.location.hash = `#/pokemon/${pokemonId}/cards`
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <LanguageSwitcher />
      </header>
      <main className="app-main">
        {route.view === 'details' ? (
          <PokemonDetailPage pokemonId={route.id} onBack={closePokemonDetails} />
        ) : route.view === 'cards' ? (
          <PokemonCardsPage pokemonId={route.id} onBack={closePokemonDetails} />
        ) : (
          <Pokedex onOpenPokemonDetails={openPokemonDetails} onOpenPokemonCards={openPokemonCards} />
        )}
      </main>
    </div>
  )
}
