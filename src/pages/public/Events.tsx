import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import { formatDate, formatTime } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getEvents } from '@/services/publicData';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackendNotice } from '@/components/shared/BackendNotice';

export function EventsPage() {
  const { t, lang, pick } = useI18n();
  const { data, loading, configured } = useAsyncList(getEvents);

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const sorted = [...data].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
    return {
      upcoming: sorted.filter((event) => +new Date(event.startAt) >= now),
      past: sorted.filter((event) => +new Date(event.startAt) < now).reverse(),
    };
  }, [data, now]);

  return (
    <>
      <PageHero title={t('events.title')} description={t('events.lead')} />

      <Container className="py-12 sm:py-16">
        {!configured && <div className="mb-6"><BackendNotice compact /></div>}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="skeleton h-24 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState title={t('events.empty')} body={t('placeholder.body')} />
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-brand-950">{t('events.upcoming')}</h2>
              {upcoming.length === 0 ? (
                <EmptyState title={t('events.empty')} />
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((event) => (
                    <li key={event.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-800 text-white">
                        <span className="font-display text-xl font-bold leading-none">{new Date(event.startAt).getDate()}</span>
                        <span className="mt-1 text-[10px] uppercase tracking-wide">
                          {new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short' }).format(new Date(event.startAt))}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-brand-950">{pick(event.titleBn, event.titleEn)}</h3>
                          <Badge tone="green">{t('events.upcoming')}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{pick(event.descriptionBn, event.descriptionEn)}</p>
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                          <div className="flex gap-1">
                            <dt className="font-semibold">{t('events.time')}:</dt>
                            <dd>
                              {formatTime(event.startAt, lang)} • {formatDate(event.startAt, lang)}
                            </dd>
                          </div>
                          <div className="flex gap-1">
                            <dt className="font-semibold">{t('events.venue')}:</dt>
                            <dd>{pick(event.venueBn, event.venueEn) || `«${t('common.pending')}»`}</dd>
                          </div>
                        </dl>
                      </div>
                      {!event.registrationOpen && (
                        <span className="text-xs font-medium text-slate-400">{t('events.registrationSoon')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-xl font-bold text-brand-950">{t('events.past')}</h2>
                <ul className="space-y-2">
                  {past.map((event) => (
                    <li key={event.id} className="card flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{pick(event.titleBn, event.titleEn)}</p>
                        <p className="text-xs text-slate-500">{formatDate(event.startAt, lang)}</p>
                      </div>
                      <Badge tone="slate">{t('events.past')}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
