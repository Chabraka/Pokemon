import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import PokemonEvolutionChain from './PokemonEvolutionChain'
import PokemonHero from './PokemonHero'
import PokemonInfoCard from './PokemonInfoCard'
import PokemonMoves from './PokemonMoves'
import PokemonStats from './PokemonStats'
import PokemonTypeBadges from './PokemonTypeBadges'
import { fetchPokemonDetail } from './pokemonDetailApi'
import { fetchPokemonCards } from '../../services/pokemonAPI.js'
import type { PokemonDetail } from './types'
import './pokemon-detail.css'

const FAVORITES_KEY = 'pokemon-favorites-v1'

interface Props {
  pokemonId?: number | string | null
  pokemonName?: string | null
  onBack?: () => void
}

function resolveIdentifier(pokemonId?: number | string | null, pokemonName?: string | null): string {
  if (pokemonId !== undefined && pokemonId !== null && `${pokemonId}`.trim()) return String(pokemonId)
  if (pokemonName && pokemonName.trim()) return pokemonName.trim().toLowerCase()
  const hashMatch = window.location.hash.match(/^#\/pokemon\/([^/]+)/)
  if (hashMatch) return decodeURIComponent(hashMatch[1]).toLowerCase()
  const pathMatch = window.location.pathname.match(/\/pokemon\/([^/]+)/)
  if (pathMatch) return decodeURIComponent(pathMatch[1]).toLowerCase()
  return '1'
}

export default function PokemonDetailPage({ pokemonId, pokemonName, onBack }: Props) {
  const { locale } = useLanguage()
  const [detail, setDetail] = useState<PokemonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShiny, setShowShiny] = useState(false)
  const [cards, setCards] = useState<any[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      const parsed = JSON.parse(raw ?? '[]')
      return new Set(Array.isArray(parsed) ? parsed : [])
    } catch {
      return new Set<number>()
    }
  })
  const cryRef = useRef<HTMLAudioElement | null>(null)
  const identifier = resolveIdentifier(pokemonId, pokemonName)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPokemonDetail(identifier, locale)
      .then((data) => {
        if (cancelled) return
        setDetail(data)
        setShowShiny(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Pokemon introuvable.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [identifier, locale])

  useEffect(() => {
    if (!detail?.id) return
    let cancelled = false
    setCardsLoading(true)
    fetchPokemonCards(detail.id)
      .then((data) => {
        if (!cancelled) setCards(Array.isArray(data) ? data.slice(0, 3) : [])
      })
      .catch(() => {
        if (!cancelled) setCards([])
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detail?.id])

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)))
    } catch {
      // ignore
    }
  }, [favorites])

  const isFavorite = useMemo(() => {
    if (!detail) return false
    return favorites.has(detail.id)
  }, [favorites, detail])

  function localizeCardName(cardName: string): string {
    if (locale !== 'fr' || !detail) return cardName
    const pokemonNameEn = detail.slug.replace(/-/g, ' ')
    const escaped = pokemonNameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matcher = new RegExp(escaped, 'ig')
    return cardName.replace(matcher, detail.name)
  }

  function toggleFavorite() {
    if (!detail) return
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(detail.id)) next.delete(detail.id)
      else next.add(detail.id)
      return next
    })
  }

  function playCry() {
    if (!cryRef.current) return
    cryRef.current.currentTime = 0
    cryRef.current.play().catch(() => {})
  }

  if (loading) return <p className="pd-state">Chargement du Pokemon...</p>
  if (error || !detail) return <p className="pd-state pd-state--error">{error ?? 'Erreur'}</p>

  return (
    <div className="pd-page">
      <audio ref={cryRef} src={detail.cryAudio ?? undefined} preload="none" className="pd-audio-hidden" />
      <PokemonHero
        detail={detail}
        showShiny={showShiny}
        onToggleShiny={setShowShiny}
        onPlayCry={playCry}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onBack={() => (onBack ? onBack() : window.history.back())}
      />

      <div className="pd-grid pd-grid--2">
        <PokemonInfoCard title="Informations generales">
          <ul className="pd-kv-list">
            <li><span>Talents</span><strong>{detail.abilities.map((a) => (a.isHidden ? `${a.name} (cache)` : a.name)).join(', ') || '-'}</strong></li>
            <li><span>Habitat</span><strong>{detail.habitat || '-'}</strong></li>
            <li><span>Groupe d'oeuf</span><strong>{detail.eggGroups.join(', ') || '-'}</strong></li>
            <li><span>EXP de base</span><strong>{detail.baseExperience}</strong></li>
            <li><span>Bonheur de base</span><strong>{detail.baseHappiness}</strong></li>
            <li><span>Taux de capture</span><strong>{detail.captureRate}</strong></li>
            <li><span>Croissance</span><strong>{detail.growth}</strong></li>
            <li><span>Couleur</span><strong>{detail.color}</strong></li>
            <li><span>Forme corporelle</span><strong>{detail.shape}</strong></li>
          </ul>
        </PokemonInfoCard>
        <PokemonInfoCard title="Stats de combat">
          <PokemonStats stats={detail.stats} />
        </PokemonInfoCard>
      </div>

      <PokemonInfoCard title="Faiblesses et resistances">
        <div className="pd-effect-grid">
          <p><strong>Faiblesses</strong><PokemonTypeBadges types={detail.typeEffectiveness.weaknesses} /></p>
          <p><strong>Resistances</strong><PokemonTypeBadges types={detail.typeEffectiveness.resistances} /></p>
          <p><strong>Immunites</strong><PokemonTypeBadges types={detail.typeEffectiveness.immunities} /></p>
        </div>
      </PokemonInfoCard>

      <PokemonInfoCard title="Evolution">
        <PokemonEvolutionChain evolutions={detail.evolutions} />
      </PokemonInfoCard>

      <div className="pd-grid pd-grid--2">
        <PokemonInfoCard title="Capacites apprises">
          <PokemonMoves moves={detail.moves} />
        </PokemonInfoCard>
        <PokemonInfoCard title="Medias">
          <div className="pd-media">
            {cardsLoading ? <p>Chargement des cartes...</p> : null}
            {!cardsLoading && cards.length === 0 ? <p>Aucune carte disponible.</p> : null}
            {!cardsLoading && cards.length > 0 ? (
              <>
                {cards.map((card) => (
                  <article className="pd-card-mini" key={card.id}>
                    <img src={card.imageSmall} alt={localizeCardName(card.name)} />
                    <span>{localizeCardName(card.name)}</span>
                  </article>
                ))}
                <button
                  type="button"
                  className="pd-main-btn"
                  onClick={() => {
                    window.location.hash = `#/pokemon/${detail.id}/cards`
                  }}
                >
                  Voir plus de cartes
                </button>
              </>
            ) : null}
          </div>
        </PokemonInfoCard>
      </div>
    </div>
  )
}
