import { useI18n } from '@/i18n';
import { initials } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getCommittee } from '@/services/publicData';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackendNotice } from '@/components/shared/BackendNotice';

export function CommitteePage() {
  const { t, pick, lang } = useI18n();
  const { data, loading, configured, error } = useAsyncList(getCommittee);

  return (
    <>
      <PageHero title={t('committee.title')} description={t('committee.lead')} />

      <Container className="py-12 sm:py-16">
        {!configured && <div className="mb-6"><BackendNotice compact /></div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="card flex items-center gap-4 p-4">
                <div className="skeleton h-16 w-16 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton mt-2 h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState title={t('common.error')} body={error} />
        ) : data.length === 0 ? (
          <EmptyState title={t('committee.empty')} body={t('placeholder.body')} />
        ) : (
          <>
            <p className="mb-5 text-xs font-medium uppercase tracking-wide text-slate-400">{t('committee.verifiedOnly')}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((member) => (
                <article key={member.id} className="card flex items-start gap-4 p-4 transition hover:shadow-lg">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-display text-lg font-bold text-brand-800 ring-1 ring-brand-100">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.nameBn} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      initials(member.nameBn)
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-bold text-brand-950">
                      {pick(member.nameBn, member.nameEn)}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {pick(member.roleTitleBn, member.roleTitleEn) || t(`committee.role.${member.role}`)}
                    </p>
                    {member.termBn && <p className="mt-1 text-xs text-slate-400">{member.termBn}</p>}
                    {member.verification === 'pending' && (
                      <Badge tone="amber" className="mt-2">
                        {t('common.pending')}
                      </Badge>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-8 text-xs text-slate-400">
              {lang === 'bn'
                ? 'পদবি ও নাম শুধু কমিটির যাচাইকৃত তালিকা থেকে যোগ করা হয়।'
                : 'Names and positions are added only from the verified committee list.'}
            </p>
          </>
        )}
      </Container>
    </>
  );
}
