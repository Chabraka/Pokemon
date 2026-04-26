import { useEffect, useState } from 'react'
import { fetchPokemonCards } from '../services/pokemonAPI.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const OWNED_CARDS_STORAGE_KEY = 'pokemon-owned-cards-v1'
const WANTED_CARDS_STORAGE_KEY = 'pokemon-wanted-cards-v1'
const OWNED_CARD_COUNTS_STORAGE_KEY = 'pokemon-owned-card-counts-v1'

export default function PokemonCardsPage({ pokemonId, onBack }) {
  const { locale, t } = useLanguage()
  const [cards, setCards] = useState([])
  const [pokemonName, setPokemonName] = useState('')
  const [loading, setLoading] = useState(true)
  const [ownedCardIds, setOwnedCardIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(OWNED_CARDS_STORAGE_KEY)
      const ids = JSON.parse(raw ?? '[]')
      return new Set(Array.isArray(ids) ? ids : [])
    } catch {
      return new Set()
    }
  })
  const [wantedCardIds, setWantedCardIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(WANTED_CARDS_STORAGE_KEY)
      const ids = JSON.parse(raw ?? '[]')
      return new Set(Array.isArray(ids) ? ids : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPokemonCards(pokemonId).then((cardList) => {
      if (cancelled) return
      setCards(cardList)
      setPokemonName(cardList[0]?.name ?? `#${pokemonId}`)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [pokemonId, locale])

  useEffect(() => {
    try {
      window.localStorage.setItem(OWNED_CARDS_STORAGE_KEY, JSON.stringify(Array.from(ownedCardIds)))
    } catch {
      // Ignore storage write issues.
    }
  }, [ownedCardIds])

  useEffect(() => {
    try {
      const ownedCountForPokemon = cards.filter((c) => ownedCardIds.has(c.id)).length
      const raw = window.localStorage.getItem(OWNED_CARD_COUNTS_STORAGE_KEY)
      const parsed = JSON.parse(raw ?? '{}')
      const next = parsed && typeof parsed === 'object' ? { ...parsed } : {}
      next[pokemonId] = ownedCountForPokemon
      window.localStorage.setItem(OWNED_CARD_COUNTS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore storage write issues.
    }
  }, [cards, ownedCardIds, pokemonId])

  useEffect(() => {
    try {
      window.localStorage.setItem(WANTED_CARDS_STORAGE_KEY, JSON.stringify(Array.from(wantedCardIds)))
    } catch {
      // Ignore storage write issues.
    }
  }, [wantedCardIds])

  function toggleOwnedCard(cardId) {
    setOwnedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  function toggleWantedCard(cardId) {
    setWantedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="loader-wrap" role="status" aria-live="polite">
        <div className="pokeball-loader" aria-hidden="true" />
        <p className="gen-status">{t('pokedex.loadingCards')}</p>
      </div>
    )
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
      <section className="pokemon-details-card">
        <h3>{t('pokedex.cardsTitle', { name: pokemonName })}</h3>
        <p className="tcg-owned-count">
          {t('pokedex.cardsOwnedCount', {
            owned: cards.filter((c) => ownedCardIds.has(c.id)).length,
            total: cards.length,
          })}
        </p>
        {cards.length === 0 ? (
          <p>{t('pokedex.noCardsFound')}</p>
        ) : (
          <div className="tcg-grid">
            {cards.map((card) => (
              <article key={card.id} className="tcg-card">
                {card.imageSmall ? <img src={card.imageSmall} alt={card.name} loading="lazy" /> : null}
                <p>{card.name}</p>
                <p>{card.setName}</p>
                <label className="tcg-owned-toggle">
                  <input
                    type="checkbox"
                    checked={ownedCardIds.has(card.id)}
                    onChange={() => toggleOwnedCard(card.id)}
                  />
                  <span>{t('pokedex.cardOwned')}</span>
                </label>
                <label className="tcg-owned-toggle tcg-owned-toggle--wanted">
                  <input
                    type="checkbox"
                    checked={wantedCardIds.has(card.id)}
                    onChange={() => toggleWantedCard(card.id)}
                  />
                  <span>{t('pokedex.cardWanted')}</span>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
