import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cn('inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-semibold', className)}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('bn')}
        className={cn(
          'rounded-full px-2.5 py-1 transition',
          lang === 'bn' ? 'bg-brand-800 text-white' : 'text-slate-600 hover:text-brand-800',
        )}
        aria-pressed={lang === 'bn'}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'rounded-full px-2.5 py-1 transition',
          lang === 'en' ? 'bg-brand-800 text-white' : 'text-slate-600 hover:text-brand-800',
        )}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
