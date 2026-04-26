interface Props {
  normalImage: string
  shinyImage: string | null
  showShiny: boolean
  onToggle: (showShiny: boolean) => void
}

export default function PokemonVersions({ normalImage, shinyImage, showShiny, onToggle }: Props) {
  return (
    <section className="pd-card">
      <h3>Versions du Pokemon</h3>
      <div className="pd-version-switch">
        <button
          className={`pd-tab-btn${!showShiny ? ' is-active' : ''}`}
          type="button"
          onClick={() => onToggle(false)}
        >
          Normale
        </button>
        <button
          className={`pd-tab-btn${showShiny ? ' is-active' : ''}`}
          type="button"
          onClick={() => onToggle(true)}
          disabled={!shinyImage}
        >
          Shiny
        </button>
      </div>
      <div className="pd-version-grid">
        <img src={normalImage} alt="Version normale" />
        {shinyImage ? <img src={shinyImage} alt="Version shiny" /> : <div className="pd-version-empty">Aucune</div>}
      </div>
    </section>
  )
}
