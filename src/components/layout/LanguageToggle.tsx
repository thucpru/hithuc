import { useLanguage } from '@/context/LanguageContext';

/** Compact VI/EN switch shown in the header. */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1 text-sm" role="group" aria-label="Language">
      {(['vi', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`uppercase px-1.5 py-0.5 transition-colors ${
            lang === code
              ? 'font-semibold text-foreground'
              : 'font-normal text-muted-foreground hover:text-foreground'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
