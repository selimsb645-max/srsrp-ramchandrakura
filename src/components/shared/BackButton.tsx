import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';

/**
 * One back button for every page, so a visitor is never stuck on a deep page.
 *
 * It sits at the top of the page (never floating over the content or the footer) and walks
 * the browser history when there is something to walk back to. Without history — a deep link
 * opened straight from WhatsApp — it falls back to the page's own section (/admin, /portal)
 * or the home page. The home page and print output never show it.
 */
export function BackButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useI18n();

  if (pathname === '/') return null;

  function goBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
      return;
    }
    if (pathname.startsWith('/admin')) {
      navigate('/admin');
      return;
    }
    if (pathname.startsWith('/portal')) {
      navigate('/portal');
      return;
    }
    navigate('/');
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={t('common.back')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-brand-900',
        'ring-1 ring-slate-200 shadow-soft transition hover:bg-brand-50 hover:ring-brand-200 print:hidden',
        className,
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {t('common.back')}
    </button>
  );
}

/**
 * Thin strip under the public header that holds the back button, so every public page
 * carries it in the same predictable place. Hidden on the home page.
 */
export function BackBar() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return (
    <div className="border-b border-slate-100 bg-white print:hidden">
      <Container className="flex items-center py-2">
        <BackButton />
      </Container>
    </div>
  );
}
