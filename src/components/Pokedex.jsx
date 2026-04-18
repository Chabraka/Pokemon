import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  attachDisplayNames,
  fetchPokemonByGeneration,
  GENERATION_COUNT,
} from '../services/pokemonAPI.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function Pokedex() {
  const { locale, t } = useLanguage()
  const [generation, setGeneration] = useState(1)
  const [pokemon, setPokemon] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [printJob, setPrintJob] = useState(null)
  const listCacheRef = useRef({})
  const documentTitleBeforePrintRef = useRef('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    const loadRaw = () => {
      const cached = listCacheRef.current[generation]
      if (cached?.length) return Promise.resolve(cached)
      return fetchPokemonByGeneration(generation).then((data) => {
        if (data.length) listCacheRef.current[generation] = data
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
      const withNames = await attachDisplayNames(data, locale)
      if (cancelled) return
      setPokemon(withNames)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [generation, locale])

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

  function handlePrintCurrentGeneration() {
    if (loading || !pokemon.length) return
    setPrintJob({ list: pokemon })
  }

  const genButtons = Array.from({ length: GENERATION_COUNT }, (_, i) => i + 1)

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
    <div>
      <h1>{t('pokedex.title')}</h1>
      <p className="hint">{t('pokedex.hint')}</p>

      <div className="gen-toolbar">
        <div className="gen-tabs" role="tablist" aria-label={t('pokedex.genTabs')}>
          {genButtons.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={generation === g}
              className={`gen-tab${generation === g ? ' gen-tab--active' : ''}`}
              onClick={() => setGeneration(g)}
            >
              {t('pokedex.genTab', { n: g })}
            </button>
          ))}
        </div>
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
      </div>

      {loading ? (
        <p className="gen-status">{t('pokedex.loadingGen', { n: generation })}</p>
      ) : loadError ? (
        <p className="detail-panel__error" role="alert">
          {loadError === 'EMPTY_GEN' ? t('errors.emptyGen') : loadError}
        </p>
      ) : (
        <>
          <p className="gen-count muted">
            {t('pokedex.genCount', { count: pokemon.length, gen: generation })}
          </p>
          <div className="pokedex-grid">
            {pokemon.map((p) => (
              <div key={`${p.name}-${p.id}`} className="pokemon-tile">
                <img src={p.image} alt="" aria-hidden />
                <span>{p.displayName ?? p.name}</span>
                <span className="muted">#{p.id}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {printPortal}
    </div>
  )
}
