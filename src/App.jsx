import Pokedex from './components/Pokedex.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <LanguageSwitcher />
      </header>
      <main className="app-main">
        <Pokedex />
      </main>
    </div>
  )
}
