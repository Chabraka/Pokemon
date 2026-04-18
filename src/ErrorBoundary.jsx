import { Component } from 'react'

/** Affiche l’erreur au lieu d’un écran blanc si le rendu plante. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#2a1515',
            color: '#fec',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ marginTop: 0 }}>Une erreur a bloqué l’affichage</h1>
          <p>Rafraîchis la page. Si ça continue, ouvre la console (F12) pour le détail.</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#1a0a0a',
              padding: '1rem',
              borderRadius: 8,
            }}
          >
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
