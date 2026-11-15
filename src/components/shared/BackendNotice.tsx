import { useI18n } from '@/i18n';

/**
 * Shown instead of fake content whenever Firebase is not configured yet.
 * Keeps the deployable build honest: no invented members, notices or statistics.
 */
export function BackendNotice({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'
          : 'rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-900'
      }
    >
      <p className="font-semibold">{t('auth.notConfigured')}</p>
      <p className="mt-1 text-sm leading-relaxed">{t('auth.notConfiguredBody')}</p>
    </div>
  );
}
