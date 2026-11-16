import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getActivities } from '@/services/publicData';
import type { ActivityCategory } from '@/types';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackendNotice } from '@/components/shared/BackendNotice';
import { cn } from '@/lib/utils';

const categories: ActivityCategory[] = ['education', 'sports', 'culture', 'health', 'social', 'environment', 'other'];

export function ActivitiesPage() {
  const { t, lang } = useI18n();
  const { data, loading, configured, error } = useAsyncList(getActivities);
  const [filter, setFilter] = useState<ActivityCategory | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? data : data.filter((activity) => activity.category === filter)),
    [data, filter],
  );

  return (
    <>
      <PageHero title={t('activities.title')} description={t('activities.lead')} />

      <Container className="py-12 sm:py-16">
        {!configured && <div className="mb-6"><BackendNotice compact /></div>}

        {error && (
          <p className="mb-6 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {t('common.error')} <span className="text-xs opacity-70">({error})</span>
          </p>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
              filter === 'all' ? 'bg-brand-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
            )}
          >
            {t('common.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                filter === category ? 'bg-brand-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
            >
              {t(`activities.category.${category}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="card h-64 p-5">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton mt-4 h-6 w-3/4" />
                <div className="skeleton mt-3 h-4 w-full" />
                <div className="skeleton mt-2 h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={t('activities.empty')} body={t('placeholder.body')} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((activity) => (
              <article key={activity.id} className="card flex flex-col overflow-hidden">
                {activity.coverImageUrl && (
                  <img src={activity.coverImageUrl} alt={activity.titleBn} loading="lazy" className="h-40 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <Badge tone="green">{t(`activities.category.${activity.category}`)}</Badge>
                  <h2 className="mt-3 text-lg font-bold">{activity.titleBn}</h2>
                  <p className="mt-2 text-sm text-slate-600">{activity.summaryBn}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-400">
                    <span>{formatDate(activity.date, lang)}</span>
                    {activity.locationBn && <span>{activity.locationBn}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
