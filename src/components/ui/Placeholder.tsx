import { useI18n } from '@/i18n';

/**
 * The visible "we have not verified this yet" marker.
 * Used everywhere a real value (member, notice, event, contact detail) is missing,
 * so the site never publishes invented information.
 */
export function Placeholder({ title, body, compact }: { title?: string; body?: string; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3'
          : 'rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center'
      }
    >
      <p className="font-semibold text-slate-700">{title ?? t('placeholder.title')}</p>
      <p className="mt-1 text-sm text-slate-500">{body ?? t('placeholder.body')}</p>
    </div>
  );
}
