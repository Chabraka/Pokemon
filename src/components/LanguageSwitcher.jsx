import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.group')}>
      <button
        type="button"
        className={`lang-switch__btn${locale === 'fr' ? ' lang-switch__btn--active' : ''}`}
        onClick={() => setLocale('fr')}
        aria-pressed={locale === 'fr'}
      >
        FR
      </button>
      <button
        type="button"
        className={`lang-switch__btn${locale === 'en' ? ' lang-switch__btn--active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  )
}
