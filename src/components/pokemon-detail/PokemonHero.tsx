import type { PokemonDetail } from './types'
import PokemonTypeBadges from './PokemonTypeBadges'

interface Props {
  detail: PokemonDetail
  showShiny: boolean
  onToggleShiny: (show: boolean) => void
  onPlayCry: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onBack: () => void
}

export default function PokemonHero({
  detail,
  showShiny,
  onToggleShiny,
  onPlayCry,
  isFavorite,
  onToggleFavorite,
  onBack,
}: Props) {
  return (
    <section className="pd-hero" data-type={detail.types[0]?.key ?? 'normal'}>
      <div className="pd-hero-topbar">
        <button type="button" className="pd-pill-btn" onClick={onBack}>
          ← Retour
        </button>
        <div className="pd-hero-actions">
          <button type="button" className={`pd-pill-btn pd-pill-btn--ball${isFavorite ? ' is-fav' : ''}`} onClick={onToggleFavorite}>
            <span aria-hidden="true">Pokeball</span> {isFavorite ? "Je l ai" : "Je ne l ai pas"}
          </button>
        </div>
      </div>

      <div className="pd-hero-grid">
        <div className="pd-hero-art">
          <img src={showShiny && detail.shinyImage ? detail.shinyImage : detail.image} alt={detail.name} />
          <div className="pd-quick-grid">
            <div><span>Taille</span><strong>{detail.heightM.toFixed(1)} m</strong></div>
            <div><span>Poids</span><strong>{detail.weightKg.toFixed(1)} kg</strong></div>
          </div>
        </div>
        <div className="pd-hero-main">
          <p className="pd-id">#{String(detail.id).padStart(4, '0')}</p>
          <h2>{detail.name}</h2>
          <p className="pd-category">{detail.category}</p>
          <PokemonTypeBadges types={detail.types} />
          <p className="pd-description">{detail.description}</p>
        </div>
        <aside className="pd-hero-side">
          <div className="pd-version-switch">
            <button className={`pd-tab-btn${!showShiny ? ' is-active' : ''}`} type="button" onClick={() => onToggleShiny(false)}>
              Normale
            </button>
            <button
              className={`pd-tab-btn${showShiny ? ' is-active' : ''}`}
              type="button"
              onClick={() => onToggleShiny(true)}
              disabled={!detail.shinyImage}
            >
              Shiny
            </button>
          </div>
          <button className="pd-main-btn" type="button" onClick={onPlayCry} disabled={!detail.cryAudio}>
            Ecouter le cri
          </button>
          <div className="pd-meta">
            <p><span>Numero National</span><strong>{String(detail.id).padStart(4, '0')}</strong></p>
            <p><span>Type</span><strong>{detail.types.map((x) => x.label).join(' / ') || '-'}</strong></p>
            <p><span>Espece</span><strong>{detail.category}</strong></p>
            <p><span>Genre</span><strong>{detail.genderRatioLabel}</strong></p>
          </div>
        </aside>
      </div>
    </section>
  )
}
