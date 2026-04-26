import { useEffect, useRef, useState } from 'react'
import { fetchPokemonDetails } from '../services/pokemonAPI.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const typeLabels = {
  fr: {
    normal: 'Normal',
    fire: 'Feu',
    water: 'Eau',
    electric: 'Electrik',
    grass: 'Plante',
    ice: 'Glace',
    fighting: 'Combat',
    poison: 'Poison',
    ground: 'Sol',
    flying: 'Vol',
    psychic: 'Psy',
    bug: 'Insecte',
    rock: 'Roche',
    ghost: 'Spectre',
    dragon: 'Dragon',
    dark: 'Tenebres',
    steel: 'Acier',
    fairy: 'Fee',
  },
  en: {},
}

const statLabels = {
  hp: 'PV',
  attack: 'Attaque',
  defense: 'Defense',
  'special-attack': 'Attaque Spe.',
  'special-defense': 'Defense Spe.',
  speed: 'Vitesse',
}

const defaultHeroTheme = {
  bg: '#e2e8f0',
  border: '#94a3b8',
  particleColor: '#64748b',
  particles: ['dot', 'dot', 'ring', 'ring', 'spark', 'dot', 'ring'],
}

const typeHeroThemes = {
  grass: {
    bg: '#bbf7d0',
    border: '#22c55e',
    particleColor: '#16a34a',
    particles: ['leaf', 'leaf', 'seed', 'leaf', 'seed', 'leaf', 'seed'],
  },
  fire: {
    bg: '#fecaca',
    border: '#ef4444',
    particleColor: '#dc2626',
    particles: ['flame', 'spark', 'flame', 'ember', 'spark', 'flame', 'ember'],
  },
  water: {
    bg: '#bfdbfe',
    border: '#3b82f6',
    particleColor: '#2563eb',
    particles: ['drop', 'bubble', 'drop', 'bubble', 'drop', 'bubble', 'drop'],
  },
  electric: {
    bg: '#fef08a',
    border: '#eab308',
    particleColor: '#ca8a04',
    particles: ['bolt', 'spark', 'bolt', 'spark', 'bolt', 'spark', 'bolt'],
  },
  ice: {
    bg: '#a5f3fc',
    border: '#0891b2',
    particleColor: '#0e7490',
    particles: ['flake', 'diamond', 'flake', 'diamond', 'flake', 'diamond', 'flake'],
  },
  rock: {
    bg: '#e7e5e4',
    border: '#78716c',
    particleColor: '#57534e',
    particles: ['rock', 'rock', 'diamond', 'rock', 'diamond', 'rock', 'rock'],
  },
  ground: {
    bg: '#fed7aa',
    border: '#ea580c',
    particleColor: '#c2410c',
    particles: ['dust', 'dust', 'rock', 'dust', 'rock', 'dust', 'dust'],
  },
  flying: {
    bg: '#bae6fd',
    border: '#0284c7',
    particleColor: '#0369a1',
    particles: ['wing', 'cloud', 'wing', 'cloud', 'wing', 'cloud', 'wing'],
  },
  bug: {
    bg: '#d9f99d',
    border: '#65a30d',
    particleColor: '#4d7c0f',
    particles: ['leaf', 'dot', 'seed', 'dot', 'leaf', 'dot', 'seed'],
  },
  poison: {
    bg: '#e9d5ff',
    border: '#a855f7',
    particleColor: '#7e22ce',
    particles: ['toxic', 'bubble', 'toxic', 'bubble', 'toxic', 'bubble', 'toxic'],
  },
  psychic: {
    bg: '#fbcfe8',
    border: '#ec4899',
    particleColor: '#be185d',
    particles: ['star', 'ring', 'star', 'ring', 'star', 'ring', 'star'],
  },
  ghost: {
    bg: '#ddd6fe',
    border: '#7c3aed',
    particleColor: '#5b21b6',
    particles: ['mist', 'ring', 'mist', 'ring', 'mist', 'ring', 'mist'],
  },
  dragon: {
    bg: '#c7d2fe',
    border: '#4f46e5',
    particleColor: '#4338ca',
    particles: ['claw', 'spark', 'claw', 'spark', 'claw', 'spark', 'claw'],
  },
  dark: {
    bg: '#d6d3d1',
    border: '#44403c',
    particleColor: '#1c1917',
    particles: ['shadow', 'mist', 'shadow', 'mist', 'shadow', 'mist', 'shadow'],
  },
  steel: {
    bg: '#cbd5e1',
    border: '#475569',
    particleColor: '#334155',
    particles: ['gear', 'diamond', 'gear', 'diamond', 'gear', 'diamond', 'gear'],
  },
  fairy: {
    bg: '#f5d0fe',
    border: '#c026d3',
    particleColor: '#a21caf',
    particles: ['heart', 'star', 'heart', 'star', 'heart', 'star', 'heart'],
  },
  fighting: {
    bg: '#fdba74',
    border: '#c2410c',
    particleColor: '#9a3412',
    particles: ['fist', 'slash', 'fist', 'slash', 'fist', 'slash', 'fist'],
  },
  normal: defaultHeroTheme,
}

function localizeType(typeName, locale) {
  return typeLabels[locale]?.[typeName] ?? typeName
}

function getStatRange(base, level, isHp) {
  if (isHp) {
    const min = Math.floor(((2 * base) * level) / 100) + level + 10
    const max = Math.floor(((2 * base + 31 + 63) * level) / 100) + level + 10
    return [min, max]
  }
  const coreMin = Math.floor(((2 * base) * level) / 100) + 5
  const coreMax = Math.floor(((2 * base + 31 + 63) * level) / 100) + 5
  return [Math.floor(coreMin * 0.9), Math.floor(coreMax * 1.1)]
}

function getStatBarColor(statName) {
  const map = {
    hp: '#22c55e',
    attack: '#f97316',
    defense: '#eab308',
    'special-attack': '#3b82f6',
    'special-defense': '#a855f7',
    speed: '#ec4899',
  }
  return map[statName] ?? '#64748b'
}

function formatDecimal(value, locale) {
  return Number(value ?? 0).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export default function PokemonDetailsPage({ pokemonId, onBack }) {
  const { locale, t } = useLanguage()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShiny, setShowShiny] = useState(false)
  const [isSpriteAnimating, setIsSpriteAnimating] = useState(false)
  const [showAllMoves, setShowAllMoves] = useState(false)
  const cryRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPokemonDetails(pokemonId, locale).then((result) => {
      if (cancelled) return
      if (!result) {
        setError('DETAIL_NOT_FOUND')
        setDetails(null)
      } else {
        setDetails(result)
        setShowShiny(false)
        setShowAllMoves(false)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [pokemonId, locale])

  if (loading) return <p className="detail-panel__status">{t('pokedex.loadingPokemonDetails')}</p>
  if (error || !details) return <p className="detail-panel__error">{t('pokedex.pokemonDetailsError')}</p>

  const primaryType = details.types?.[0] ?? 'normal'
  const heroTheme = typeHeroThemes[primaryType] ?? defaultHeroTheme
  const stats = details.stats ?? []
  const totalStat = stats.reduce((sum, stat) => sum + (stat.value ?? 0), 0)
  const visibleMoves = showAllMoves ? details.moves ?? [] : (details.moves ?? []).slice(0, 12)

  const formattedGender = details.gender.includes('/') ? '87.5% ♂ / 12.5% ♀' : details.gender

  function handleArtworkClick() {
    setShowShiny((prev) => (details.shinyImage ? !prev : prev))
    setIsSpriteAnimating(true)
    window.setTimeout(() => setIsSpriteAnimating(false), 320)
    if (cryRef.current) {
      cryRef.current.currentTime = 0
      cryRef.current.play().catch(() => {})
    }
  }

  return (
    <section className="pokemon-details-page">
      <button
        type="button"
        className="pokemon-details-back"
        onClick={onBack}
        aria-label={t('pokedex.backToList')}
        title={t('pokedex.backToList')}
      >
        <span aria-hidden="true">&larr;</span>
      </button>

      <article className="pokemon-details-hero" data-type={primaryType}>
        <div className="pokemon-details-particles" aria-hidden="true">
          {heroTheme.particles.map((shape, index) => (
            <span key={`${primaryType}-particle-${shape}-${index}`} className={`hero-particle hero-particle--${shape}`} />
          ))}
        </div>
        <div className="pokemon-details-art-col">
          <button
            type="button"
            className={`pokemon-details-artwork${isSpriteAnimating ? ' pokemon-details-artwork--animating' : ''}`}
            onClick={handleArtworkClick}
            title={details.shinyImage ? 'Basculer normal/shiny + cri' : 'Jouer le cri'}
          >
            <img
              src={showShiny && details.shinyImage ? details.shinyImage : details.image}
              alt={showShiny ? `${details.displayName} shiny` : details.displayName}
              className="pokemon-details-image"
            />
            {details.shinyImage ? (
              <span className="pokemon-details-artwork-badge">{showShiny ? 'Shiny' : 'Normal'}</span>
            ) : null}
          </button>
          <div className="pokemon-details-quick-metrics">
            <div className="pokemon-quick-item">
              <span>{t('pokedex.height')}</span>
              <strong>{formatDecimal(details.heightM, locale)} m</strong>
            </div>
            <div className="pokemon-quick-item">
              <span>{t('pokedex.weight')}</span>
              <strong>{formatDecimal(details.weightKg, locale)} kg</strong>
            </div>
          </div>
        </div>
        <div className="pokemon-details-main">
          <p className="pokemon-details-id">#{String(details.id).padStart(4, '0')}</p>
          <h2>{details.displayName}</h2>
          {details.genus ? <p className="pokemon-details-genus">{details.genus}</p> : null}
          <div className="pokemon-type-row">
            {(details.types ?? []).map((typeName) => (
              <span key={`${details.id}-${typeName}`} className="pokemon-type-chip" data-type={typeName}>
                {localizeType(typeName, locale)}
              </span>
            ))}
          </div>
          {details.flavorText ? <p className="pokemon-details-flavor">{details.flavorText}</p> : null}
        </div>
        <aside className="pokemon-details-hero-side">
          <div className="pokemon-meta-row">
            <span>{locale === 'fr' ? 'Numero National' : 'National Number'}</span>
            <strong>{String(details.id).padStart(4, '0')}</strong>
          </div>
          <div className="pokemon-meta-row">
            <span>Type</span>
            <strong>
              {(details.types ?? []).map((typeName) => localizeType(typeName, locale)).join(' / ') || '-'}
            </strong>
          </div>
          <div className="pokemon-meta-row">
            <span>Espece</span>
            <strong>{details.genus || '-'}</strong>
          </div>
          <div className="pokemon-meta-row">
            <span>{t('pokedex.gender')}</span>
            <strong>{formattedGender}</strong>
          </div>
        </aside>
      </article>

      <div className="pokemon-details-grid">
        <section className="pokemon-details-card pokemon-details-card--about">
          <h3>{t('pokedex.aboutPokemon')}</h3>
          <ul className="pokemon-details-list">
            <li><span>Categorie</span><strong>{details.genus || '-'}</strong></li>
            <li>
              <span>{t('pokedex.abilities')}</span>
              <strong>
                {(details.abilities ?? [])
                  .map((a) => (a.isHidden ? `${a.name} (${t('pokedex.hiddenAbility')})` : a.name))
                  .join(', ') || '-'}
              </strong>
            </li>
            <li><span>Habitat</span><strong>{details.habitat || '-'}</strong></li>
            <li><span>{t('pokedex.eggGroups')}</span><strong>{(details.eggGroups ?? []).join(', ') || '-'}</strong></li>
            <li><span>{t('pokedex.baseExperience')}</span><strong>{details.baseExperience}</strong></li>
            <li><span>{t('pokedex.baseHappiness')}</span><strong>{details.baseHappiness}</strong></li>
            <li><span>{t('pokedex.captureRate')}</span><strong>{details.captureRate}</strong></li>
            <li><span>{t('pokedex.growthRate')}</span><strong>{details.growthRate || '-'}</strong></li>
          </ul>
        </section>

        <section className="pokemon-details-card pokemon-details-card--stats">
          <div className="pokemon-stats-header">
            <h3>{t('pokedex.stats')}</h3>
            <span>Niveau 50 / 100</span>
          </div>
          <ul className="pokemon-details-stats-table">
            {stats.map((stat) => {
              const [min50, max50] = getStatRange(stat.value, 50, stat.name === 'hp')
              const [min100, max100] = getStatRange(stat.value, 100, stat.name === 'hp')
              return (
                <li key={`${details.id}-${stat.name}`}>
                  <span className="stat-name">{statLabels[stat.name] ?? stat.name}</span>
                  <div className="stat-bar-track">
                    <span
                      className="stat-bar-fill"
                      style={{ width: `${Math.min(100, (stat.value / 180) * 100)}%`, background: getStatBarColor(stat.name) }}
                    />
                  </div>
                  <strong className="stat-base">{stat.value}</strong>
                  <span className="stat-range">{min50} - {max50}</span>
                  <span className="stat-range">{min100} - {max100}</span>
                </li>
              )
            })}
            <li className="stat-total-row">
              <span className="stat-name">Total</span>
              <div />
              <strong className="stat-base">{totalStat}</strong>
              <span />
              <span />
            </li>
          </ul>
        </section>
      </div>

      <section className="pokemon-details-card">
        <h3>{t('pokedex.typeEffectiveness')}</h3>
        <div className="pokemon-effectiveness-row">
          <strong>{t('pokedex.weaknesses')}</strong>
          <div className="pokemon-type-row pokemon-type-row--left">
            {(details.typeEffectiveness?.weaknesses ?? []).map((typeName) => (
              <span key={`weak-${typeName}`} className="pokemon-type-chip" data-type={typeName}>
                {localizeType(typeName, locale)}
              </span>
            ))}
            {(details.typeEffectiveness?.weaknesses ?? []).length === 0 ? <span>-</span> : null}
          </div>
        </div>
        <div className="pokemon-effectiveness-row">
          <strong>{t('pokedex.resistances')}</strong>
          <div className="pokemon-type-row pokemon-type-row--left">
            {(details.typeEffectiveness?.resistances ?? []).map((typeName) => (
              <span key={`res-${typeName}`} className="pokemon-type-chip" data-type={typeName}>
                {localizeType(typeName, locale)}
              </span>
            ))}
            {(details.typeEffectiveness?.resistances ?? []).length === 0 ? <span>-</span> : null}
          </div>
        </div>
        <div className="pokemon-effectiveness-row">
          <strong>{t('pokedex.immunities')}</strong>
          <div className="pokemon-type-row pokemon-type-row--left">
            {(details.typeEffectiveness?.immunities ?? []).map((typeName) => (
              <span key={`imm-${typeName}`} className="pokemon-type-chip" data-type={typeName}>
                {localizeType(typeName, locale)}
              </span>
            ))}
            {(details.typeEffectiveness?.immunities ?? []).length === 0 ? <span>-</span> : null}
          </div>
        </div>
      </section>

      {(details.evolutions ?? []).length > 0 ? (
        <section className="pokemon-details-card">
          <h3>{t('pokedex.evolutions')}</h3>
          <div className="pokemon-details-evolutions">
            {details.evolutions.map((evo, index) => (
              <div key={`evo-step-${details.id}-${evo.name}-${index}`} className="pokemon-details-evo-step">
                <div className="pokemon-details-evo-item">
                  {evo.image ? <img src={evo.image} alt={evo.name} /> : null}
                  <span>{evo.name}</span>
                </div>
                {index < details.evolutions.length - 1 ? (
                  <span className="pokemon-details-evo-arrow" aria-hidden="true">
                    +
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="pokemon-details-grid">
        <section className="pokemon-details-card">
          <h3>{t('pokedex.moves')}</h3>
          <div className="pokemon-moves-chips">
            {visibleMoves.map((moveName) => (
              <span key={`move-${details.id}-${moveName}`} className="pokemon-move-chip">
                {moveName}
              </span>
            ))}
          </div>
          {(details.moves ?? []).length > 12 ? (
            <button type="button" className="pokemon-show-more-btn" onClick={() => setShowAllMoves((prev) => !prev)}>
              {showAllMoves ? 'Voir moins de capacites' : `Voir toutes les capacites (${details.moves.length})`}
            </button>
          ) : null}
        </section>

        <section className="pokemon-details-card">
          <h3>Informations supplementaires</h3>
          <ul className="pokemon-details-list">
            <li><span>Forme</span><strong>{details.varieties?.[0] || '-'}</strong></li>
            <li><span>{t('pokedex.color')}</span><strong>{details.color || '-'}</strong></li>
            <li><span>{t('pokedex.shape')}</span><strong>{details.shape || '-'}</strong></li>
            <li><span>{t('pokedex.weight')}</span><strong>{formatDecimal(details.weightKg, locale)} kg</strong></li>
            <li><span>{t('pokedex.height')}</span><strong>{formatDecimal(details.heightM, locale)} m</strong></li>
            <li><span>Genre ratio</span><strong>{formattedGender}</strong></li>
          </ul>
        </section>
      </div>

      <section className="pokemon-details-media-hidden">
        <div className="pokemon-details-media">
          {details.cryAudio ? <audio ref={cryRef} src={details.cryAudio} preload="none" /> : null}
        </div>
      </section>
    </section>
  )
}
