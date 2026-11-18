import { useI18n } from '@/i18n';
import { initials } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getCommittee } from '@/services/publicData';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackendNotice } from '@/components/shared/BackendNotice';
import type { CommitteeMember } from '@/types';

/** পদ অনুযায়ী স্তর — নেতৃত্ব আগে, তারপর সম্পাদকমণ্ডলী, শেষে সদস্য। */
function tierOf(member: CommitteeMember): 'lead' | 'deputy' | 'secretary' | 'member' {
  if (member.role === 'president' || member.role === 'general_secretary') return 'lead';
  if (member.role === 'vice_president' || member.role === 'joint_secretary') return 'deputy';
  if (member.role === 'member') return 'member';
  return 'secretary';
}

function Avatar({ name, size, tone }: { name: string; size: string; tone: 'light' | 'dark' }) {
  return (
    <span
      className={
        tone === 'dark'
          ? `flex ${size} shrink-0 items-center justify-center rounded-full bg-white/15 font-display font-bold text-white ring-2 ring-white/30`
          : `flex ${size} shrink-0 items-center justify-center rounded-full bg-brand-50 font-display font-bold text-brand-800 ring-1 ring-brand-100`
      }
    >
      {initials(name)}
    </span>
  );
}

function LeadCard({ member }: { member: CommitteeMember }) {
  return (
    <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-leaf-800 p-5 text-white shadow-soft sm:p-6">
      <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.07]" />
      <span className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/[0.04]" />
      <div className="relative flex items-center gap-4">
        <Avatar name={member.nameBn} size="h-20 w-20 text-2xl" tone="dark" />
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[12px] font-bold leading-none text-brand-900 shadow-sm">
            {member.roleTitleBn || member.role}
          </span>
          <h2 className="mt-2 truncate font-display text-xl font-bold leading-tight text-white sm:text-2xl">
            {member.nameBn}
          </h2>
          {member.termBn && <p className="mt-1.5 text-xs font-medium text-white/85">{member.termBn}</p>}
        </div>
      </div>
    </article>
  );
}

function PersonCard({ member }: { member: CommitteeMember }) {
  return (
    <article className="card group flex items-center gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg">
      <Avatar name={member.nameBn} size="h-12 w-12 text-sm" tone="light" />
      <div className="min-w-0">
        <h3 className="truncate font-display text-sm font-bold text-brand-950">{member.nameBn}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {member.roleTitleBn || member.role}
        </p>
      </div>
    </article>
  );
}

function MemberChip({ member }: { member: CommitteeMember }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf-50 font-display text-[11px] font-bold text-leaf-700 ring-1 ring-leaf-200">
        {initials(member.nameBn)}
      </span>
      <span className="truncate text-sm text-slate-700">{member.nameBn}</span>
    </div>
  );
}

export function CommitteePage() {
  const { t, lang } = useI18n();
  const { data, loading, configured, error } = useAsyncList(getCommittee);

  const bn = lang === 'bn';
  const lead = data.filter((m) => tierOf(m) === 'lead');
  const deputy = data.filter((m) => tierOf(m) === 'deputy');
  const secretaries = data.filter((m) => tierOf(m) === 'secretary');
  const members = data.filter((m) => tierOf(m) === 'member');

  const sections = [
    { key: 'lead', title: bn ? 'নেতৃত্ব' : 'Leadership', items: lead },
    { key: 'deputy', title: bn ? 'সহ-সভাপতি ও যুগ্ম সম্পাদক' : 'Vice Presidents & Joint Secretaries', items: deputy },
    { key: 'secretary', title: bn ? 'সম্পাদকমণ্ডলী' : 'Secretaries', items: secretaries },
  ].filter((section) => section.items.length > 0);

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
          <div className="space-y-12">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-800">
                {bn ? `মোট ${data.length} জন` : `${data.length} members`}
              </span>
              <span>{t('committee.verifiedOnly')}</span>
            </div>

            {sections.map((section) => (
              <section key={section.key}>
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="font-display text-lg font-bold text-brand-950">{section.title}</h2>
                  <span className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" />
                  <span className="text-xs text-slate-400">{section.items.length}</span>
                </div>
                {section.key === 'lead' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.items.map((member) => <LeadCard key={member.id} member={member} />)}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((member) => <PersonCard key={member.id} member={member} />)}
                  </div>
                )}
              </section>
            ))}

            {members.length > 0 && (
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="font-display text-lg font-bold text-brand-950">{bn ? 'সদস্যবৃন্দ' : 'Members'}</h2>
                  <span className="h-px flex-1 bg-gradient-to-r from-leaf-200 to-transparent" />
                  <span className="text-xs text-slate-400">{members.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => <MemberChip key={member.id} member={member} />)}
                </div>
              </section>
            )}

            <p className="text-xs text-slate-400">
              {bn
                ? 'পদবি ও নাম শুধু কমিটির যাচাইকৃত তালিকা থেকে যোগ করা হয়।'
                : 'Names and positions are added only from the verified committee list.'}
            </p>
          </div>
        )}
      </Container>
    </>
  );
}
