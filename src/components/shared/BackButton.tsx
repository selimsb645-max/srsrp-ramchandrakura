import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * One back button for every page, so a visitor is never stuck on a deep page.
 *
 * It walks the browser history when there is something to walk back to, and otherwise
 * falls back to the page's own section (/admin, /portal) or the home page — so a link
 * opened straight from WhatsApp still leads somewhere sensible. The home page and print
 * output never show it.
 */
export function BackButton({
  variant = 'floating',
  className,
}: {
  variant?: 'floating' | 'inline';
  className?: string;
}) {
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
        'inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-brand-900 transition print:hidden',
        'bg-white ring-1 ring-slate-200 shadow-soft hover:bg-brand-50 hover:ring-brand-200',
        variant === 'floating'
          ? 'fixed bottom-5 left-4 z-30 px-4 py-2.5 sm:bottom-6 sm:left-6'
          : 'px-3.5 py-2',
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
