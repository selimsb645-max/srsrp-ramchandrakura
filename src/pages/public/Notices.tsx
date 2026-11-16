import { useI18n } from '@/i18n';
import { formatDate, safeExternalUrl } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getNotices } from '@/services/publicData';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackendNotice } from '@/components/shared/BackendNotice';

export function NoticesPage() {
  const { t, lang, pick } = useI18n();
  const { data, loading, configured, error } = useAsyncList(getNotices);

  return (
    <>
      <PageHero title={t('notices.title')} description={t('notices.lead')} />

      <Container className="py-12 sm:py-16">
        {!configured && <div className="mb-6"><BackendNotice compact /></div>}

        {error && (
          <p className="mb-6 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {t('common.error')} <span className="text-xs opacity-70">({error})</span>
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="skeleton h-28 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState title={t('notices.empty')} body={t('placeholder.body')} />
        ) : (
          <ul className="space-y-3">
            {data.map((notice) => {
              const attachment = safeExternalUrl(notice.attachmentUrl);
              return (
                <li key={notice.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-bold text-brand-950">{pick(notice.titleBn, notice.titleEn)}</h2>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(notice.date, lang)}</p>
                    </div>
                    <Badge tone={notice.priority === 'urgent' ? 'rose' : notice.priority === 'important' ? 'amber' : 'slate'}>
                      {t(`notices.priority.${notice.priority}`)}
                    </Badge>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-[15px] text-slate-700">{pick(notice.bodyBn, notice.bodyEn)}</p>
                  {attachment && (
                    <a
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline"
                    >
                      {t('notices.download')}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
