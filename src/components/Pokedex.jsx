import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  attachPokemonTypes,
  attachDisplayNames,
  fetchPokemonByGeneration,
  fetchAllPokemon,
  GENERATION_COUNT,
  prettifySpeciesName,
} from '../services/pokemonAPI.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const ALL_GENERATIONS_VALUE = 'all'
const PAGE_SIZE = 50
const CAUGHT_STORAGE_KEY = 'pokemon-caught-ids-v1'
const OWNED_CARD_COUNTS_STORAGE_KEY = 'pokemon-owned-card-counts-v1'

export default function Pokedex({ onOpenPokemonDetails, onOpenPokemonCards }) {
  const { locale, t } = useLanguage()
  const [generation, setGeneration] = useState(ALL_GENERATIONS_VALUE)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState(() => new Set())
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [selectedPokemonIds, setSelectedPokemonIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(CAUGHT_STORAGE_KEY)
      const ids = JSON.parse(raw ?? '[]')
      return new Set(Array.isArray(ids) ? ids.filter((x) => Number.isFinite(x)) : [])
    } catch {
      return new Set()
    }
  })
  const [pokemon, setPokemon] = useState([])
  const [ownedCardCountsByPokemon, setOwnedCardCountsByPokemon] = useState(() => {
    try {
      const raw = window.localStorage.getItem(OWNED_CARD_COUNTS_STORAGE_KEY)
      const parsed = JSON.parse(raw ?? '{}')
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [printJob, setPrintJob] = useState(null)
  const listCacheRef = useRef({})
  const documentTitleBeforePrintRef = useRef('')

  useEffect(() => {
    if (!printJob) return
    documentTitleBeforePrintRef.current = document.title
    document.title = '\u200b'

    const timer = window.setTimeout(() => {
      window.print()
    }, 600)

    return () => {
      window.clearTimeout(timer)
      document.title = documentTitleBeforePrintRef.current
    }
  }, [printJob])

  useEffect(() => {
    const onAfterPrint = () => {
      document.title = documentTitleBeforePrintRef.current
      setPrintJob(null)
    }
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(CAUGHT_STORAGE_KEY, JSON.stringify(Array.from(selectedPokemonIds)))
    } catch {
      // Ignore storage write issues silently.
    }
  }, [selectedPokemonIds])

  useEffect(() => {
    const onFocus = () => {
      try {
        const raw = window.localStorage.getItem(OWNED_CARD_COUNTS_STORAGE_KEY)
        const parsed = JSON.parse(raw ?? '{}')
        if (parsed && typeof parsed === 'object') setOwnedCardCountsByPokemon(parsed)
      } catch {
        // Ignore storage read issues silently.
      }
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('hashchange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('hashchange', onFocus)
    }
  }, [])

  function handlePrintCurrentGeneration() {
    if (loading || !pokemon.length) return
    setPrintJob({ list: pokemon })
  }

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
    en: {
      normal: 'Normal',
      fire: 'Fire',
      water: 'Water',
      electric: 'Electric',
      grass: 'Grass',
      ice: 'Ice',
      fighting: 'Fighting',
      poison: 'Poison',
      ground: 'Ground',
      flying: 'Flying',
      psychic: 'Psychic',
      bug: 'Bug',
      rock: 'Rock',
      ghost: 'Ghost',
      dragon: 'Dragon',
      dark: 'Dark',
      steel: 'Steel',
      fairy: 'Fairy',
    },
  }

  function localizeType(typeName) {
    const map = typeLabels[locale] ?? typeLabels.en
    return map[typeName] ?? typeName
  }

  function toggleSelectedPokemon(id) {
    setSelectedPokemonIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function normalizeSearch(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }

  function levenshteinDistance(a, b) {
    if (a === b) return 0
    if (!a.length) return b.length
    if (!b.length) return a.length
    const prev = new Array(b.length + 1).fill(0)
    const curr = new Array(b.length + 1).fill(0)
    for (let j = 0; j <= b.length; j += 1) prev[j] = j
    for (let i = 1; i <= a.length; i += 1) {
      curr[0] = i
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      }
      for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]
    }
    return prev[b.length]
  }

  function getSearchTyposTolerance(queryLength) {
    if (queryLength < 6) return 0
    if (queryLength < 10) return 1
    return 2
  }

  const normalizedQuery = normalizeSearch(searchQuery)
  const isSearchMode = normalizedQuery.length > 0
  const sourceKey = isSearchMode ? ALL_GENERATIONS_VALUE : generation

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    const loadRaw = () => {
      const cached = listCacheRef.current[sourceKey]
      if (cached?.length) return Promise.resolve(cached)

      if (sourceKey === ALL_GENERATIONS_VALUE) {
        return fetchAllPokemon().then((data) => {
          if (data.length) listCacheRef.current[sourceKey] = data
          return data
        })
      }

      return fetchPokemonByGeneration(sourceKey).then((data) => {
        if (data.length) listCacheRef.current[sourceKey] = data
        return data
      })
    }

    loadRaw().then(async (data) => {
      if (cancelled) return
      if (!data.length) {
        setLoadError('EMPTY_GEN')
        setPokemon([])
        setLoading(false)
        return
      }

      if (sourceKey === ALL_GENERATIONS_VALUE) {
        // Fast first paint for all generations; enrich only visible page afterwards.
        const baseList = data.map((p) => {
          const englishName = prettifySpeciesName(p.name)
          return {
            ...p,
            types: p.types ?? [],
            englishName,
            frenchName: englishName,
            displayName: locale === 'fr' ? englishName : englishName,
            _frResolved: locale !== 'fr',
          }
        })
        setPokemon(baseList)
        setLoading(false)
        return
      }

      const withTypes = await attachPokemonTypes(data)
      const withNames = await attachDisplayNames(withTypes, locale)
      if (cancelled) return
      setPokemon(withNames)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [sourceKey, locale])

  const pokemonAfterTypeFilter =
    isSearchMode || selectedTypes.size === 0
      ? pokemon
      : pokemon.filter((p) => {
          const types = p.types ?? []
          return Array.from(selectedTypes).every((typeName) => types.includes(typeName))
        })

  const filteredPokemon =
    !normalizedQuery.length
      ? pokemonAfterTypeFilter
      : pokemon.filter((p) => {
          const candidates = [
            normalizeSearch(p.displayName),
            normalizeSearch(p.frenchName),
            normalizeSearch(p.englishName),
            normalizeSearch(p.name),
          ].filter(Boolean)
          return candidates.some((candidate) => {
            if (candidate.startsWith(normalizedQuery)) return true
            if (normalizedQuery.length < 6 || candidate.length < 6) return false
            if (Math.abs(candidate.length - normalizedQuery.length) > 2) return false
            const tolerance = getSearchTyposTolerance(normalizedQuery.length)
            return levenshteinDistance(normalizedQuery, candidate) <= tolerance
          })
        })
  const totalPages = Math.max(1, Math.ceil(filteredPokemon.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE
  const pagePokemon = filteredPokemon.slice(pageStart, pageStart + PAGE_SIZE)
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages)

  useEffect(() => {
    if (sourceKey !== ALL_GENERATIONS_VALUE || loading || !pagePokemon.length) return
    let cancelled = false

    const needsEnrichment = pagePokemon.filter((p) => !p.types?.length || (locale === 'fr' && !p._frResolved))
    if (!needsEnrichment.length) return

    const enrichVisiblePage = async () => {
      const withTypes = await attachPokemonTypes(needsEnrichment)
      const withNames = locale === 'fr' ? await attachDisplayNames(withTypes, locale) : withTypes
      if (cancelled) return
      const byId = new Map(
        withNames.map((p) => [
          p.id,
          {
            types: p.types ?? [],
            englishName: p.englishName ?? prettifySpeciesName(p.name),
            frenchName: p.frenchName ?? prettifySpeciesName(p.name),
            displayName:
              locale === 'fr'
                ? (p.frenchName ?? p.displayName ?? prettifySpeciesName(p.name))
                : (p.englishName ?? p.displayName ?? prettifySpeciesName(p.name)),
            _frResolved: locale !== 'fr' || Boolean(p.frenchName),
          },
        ])
      )

      setPokemon((prev) =>
        prev.map((p) => {
          const next = byId.get(p.id)
          return next ? { ...p, ...next } : p
        })
      )
    }

    enrichVisiblePage()
    return () => {
      cancelled = true
    }
  }, [sourceKey, loading, pagePokemon, locale])

  const availableTypes = Array.from(
    new Set(pokemon.flatMap((p) => p.types ?? []).filter(Boolean))
  ).sort((a, b) => localizeType(a).localeCompare(localizeType(b)))

  const selectedCount = pokemon.filter((p) => selectedPokemonIds.has(p.id)).length
  const searchPreview = filteredPokemon[0] ?? null

  const genButtons = Array.from({ length: GENERATION_COUNT }, (_, i) => i + 1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedTypes, generation])

  function toggleTypeFilter(typeName) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(typeName)) next.delete(typeName)
      else next.add(typeName)
      return next
    })
  }

  function buildPaginationItems(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total]
    if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total]
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
  }

  const printPortal =
    printJob &&
    createPortal(
      <div className="print-sheet">
        <div className="print-sheet__grid" aria-hidden="true">
          {printJob.list.map((p) => (
            <div key={`print-${p.name}-${p.id}`} className="print-sheet__cell">
              <img className="print-sheet__img" src={p.image} alt="" />
            </div>
          ))}
        </div>
      </div>,
      document.body
    )

  return (
    <>
      <h1 className="pokedex-logo-title">{t('pokedex.title')}</h1>
      <div className="pokedex-layout">
      <section className="pokedex-panel">
      {loading ? (
        <div className="loader-wrap" role="status" aria-live="polite">
          <div className="pokeball-loader" aria-hidden="true" />
          <p className="gen-status">
            {sourceKey === ALL_GENERATIONS_VALUE
              ? t('pokedex.loadingAll')
              : t('pokedex.loadingGen', { n: generation })}
          </p>
        </div>
      ) : loadError ? (
        <p className="detail-panel__error" role="alert">
          {loadError === 'EMPTY_GEN' ? t('errors.emptyGen') : loadError}
        </p>
      ) : (
        <div key={`gen-${generation}`} className="pokedex-content pokedex-content--ready">
          <div className="pokedex-grid">
            {pagePokemon.length === 0 ? (
              <p className="detail-panel__status">{t('pokedex.noPokemonFound')}</p>
            ) : (
              pagePokemon.map((p) => (
                (() => {
                  const ownedCardsCount = Number(ownedCardCountsByPokemon[p.id] ?? 0)
                  return (
                <div
                  key={`${p.name}-${p.id}`}
                  className="pokemon-tile"
                  data-type={p.types?.[0] ?? 'normal'}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenPokemonDetails?.(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpenPokemonDetails?.(p.id)
                    }
                  }}
                >
                  <div className="pokemon-tile__top">
                    <span className="pokemon-id-badge">
                      <span className="pokemon-id-badge__marker">{ownedCardsCount > 2 ? ownedCardsCount : '🃏'}</span>
                      #{String(p.id).padStart(4, '0')}
                    </span>
                    <div className="pokemon-tile__actions">
                      <button
                        type="button"
                        className="pokemon-card-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenPokemonCards?.(p.id)
                        }}
                        aria-label={t('pokedex.viewCardsAria', { name: p.displayName ?? p.name })}
                        title={t('pokedex.viewCardsTitle')}
                      >
                        <span aria-hidden="true">Cartes</span>
                        {ownedCardsCount > 2 ? <span className="pokemon-card-btn__count">{ownedCardsCount}</span> : null}
                      </button>
                      <button
                        type="button"
                        className={`pokemon-ball-btn${selectedPokemonIds.has(p.id) ? ' pokemon-ball-btn--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelectedPokemon(p.id)
                        }}
                        aria-label={`${selectedPokemonIds.has(p.id) ? 'Deselect' : 'Select'} ${p.displayName ?? p.name}`}
                        title={selectedPokemonIds.has(p.id) ? 'Selected' : 'Select'}
                      >
                        <span className="pokemon-ball-btn__inner" />
                      </button>
                    </div>
                  </div>
                  <img src={p.image} alt="" aria-hidden />
                  <span>{p.displayName ?? p.name}</span>
                  <div className="pokemon-type-row">
                    {(p.types ?? []).map((typeName) => (
                      <span
                        key={`${p.id}-${typeName}`}
                        className="pokemon-type-chip"
                        data-type={typeName}
                      >
                        {localizeType(typeName)}
                      </span>
                    ))}
                  </div>
                </div>
                  )
                })()
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="pokedex-pagination">
              <button
                type="button"
                className="pokedex-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                aria-label={t('pokedex.prevPage')}
              >
                &lsaquo;
              </button>
              {paginationItems.map((item, index) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="pokedex-page-ellipsis" aria-hidden="true">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    type="button"
                    className={`pokedex-page-btn${item === safeCurrentPage ? ' pokedex-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                    aria-label={t('pokedex.pageLabel', { page: item, total: totalPages })}
                    aria-current={item === safeCurrentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                className="pokedex-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                aria-label={t('pokedex.nextPage')}
              >
                &rsaquo;
              </button>
            </div>
          )}
        </div>
      )}
      </section>

      <aside className="pokedex-sidebar">
        <div className="dex-status-card">
          <div className="dex-status-card__title">POKEDEX</div>
          <div className="dex-status-card__main">{pokemon.length}</div>
          <div className="dex-status-list">
            <div className="dex-status-item">
              <span className="dex-status-dot dex-status-dot--selected" />
              <span className="dex-status-label">{t('pokedex.caught')}</span>
              <span className="dex-status-value">{selectedCount}</span>
            </div>
          </div>
        </div>

        <div className="pokedex-sidebar__title">{t('pokedex.searchLabel')}</div>
        <label className="search-box">
          <div className="search-box__shell">
            <span className="search-box__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" focusable="false">
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79L19 20.5 20.5 19l-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                />
              </svg>
            </span>
            <input
              type="search"
              className="search-box__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('pokedex.searchPlaceholder')}
            />
            {searchPreview && (
              <span className="search-box__preview" aria-hidden="true">
                <span className="search-box__preview-id">#{String(searchPreview.id).padStart(3, '0')}</span>
                <img src={searchPreview.image} alt="" />
              </span>
            )}
          </div>
        </label>

        <div className="pokedex-sidebar__title">{t('pokedex.typeFilterTitle')}</div>
        <div className="type-filter-dropdown">
          <button
            type="button"
            className="type-filter-trigger"
            onClick={() => setIsTypeMenuOpen((prev) => !prev)}
            disabled={isSearchMode}
          >
            {selectedTypes.size === 0
              ? t('pokedex.allTypes')
              : t('pokedex.typeSelectionCount', { count: selectedTypes.size })}
          </button>
          {isTypeMenuOpen && !isSearchMode && (
            <div className="type-filter-panel">
              <button
                type="button"
                className={`pokemon-type-chip type-filter-chip${selectedTypes.size === 0 ? ' type-filter-chip--active' : ''}`}
                onClick={() => setSelectedTypes(new Set())}
              >
                {t('pokedex.allTypes')}
              </button>
              {availableTypes.map((typeName) => (
                <button
                  key={typeName}
                  type="button"
                  className={`pokemon-type-chip type-filter-chip${selectedTypes.has(typeName) ? ' type-filter-chip--active' : ''}`}
                  data-type={typeName}
                  onClick={() => toggleTypeFilter(typeName)}
                >
                  {localizeType(typeName)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pokedex-sidebar__title">{t('pokedex.genTabs')}</div>
        <label className="filter-select-wrap">
          <select
            className="filter-select"
            value={String(generation)}
            onChange={(e) =>
              setGeneration(e.target.value === ALL_GENERATIONS_VALUE ? ALL_GENERATIONS_VALUE : Number(e.target.value))
            }
            disabled={isSearchMode}
          >
            <option value={ALL_GENERATIONS_VALUE}>{t('pokedex.allGenerations')}</option>
            {genButtons.map((g) => (
              <option key={g} value={String(g)}>
                {t('pokedex.genTab', { n: g })}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="print-icon-btn"
          onClick={handlePrintCurrentGeneration}
          disabled={loading || !pokemon.length}
          title={t('pokedex.printTitle')}
          aria-label={t('pokedex.printAria')}
        >
          <svg
            className="print-icon-btn__svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"
            />
          </svg>
        </button>
      </aside>

      {printPortal}
      </div>
    </>
  )
}
