import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '@/config/site';
import { useI18n } from '@/i18n';
import { formatDate, toBnDigits } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAsyncList } from '@/hooks/useAsyncList';
import {
  getActivities,
  getCommittee,
  getEvents,
  getMembers,
  getNotices,
  getPublicStats,
  type PublicStats,
} from '@/services/publicData';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatGrid } from '@/components/shared/StatGrid';
import { Logo } from '@/components/shared/Logo';

const values = [
  { bn: 'শিক্ষা', en: 'Education', descBn: 'শিক্ষা সহায়তা, পাঠচক্র ও বৃত্তি তথ্য।', descEn: 'Study support, reading circles and scholarship information.' },
  { bn: 'ক্রীড়া', en: 'Sports', descBn: 'শিশু-কিশোরদের ক্রীড়া প্রতিযোগিতা ও প্রশিক্ষণ।', descEn: 'Sports competitions and training for children.' },
  { bn: 'সংস্কৃতি', en: 'Culture', descBn: 'সাংস্কৃতিক অনুষ্ঠান, আবৃত্তি ও সৃজনশীল আয়োজন।', descEn: 'Cultural programmes, recitation and creative events.' },
  { bn: 'মানবিকতা', en: 'Humanity', descBn: 'স্বাস্থ্য সচেতনতা, সহায়তা ও সমাজসেবা।', descEn: 'Health awareness, support and social service.' },
];

export function HomePage() {
  const { t, lang } = useI18n();
  const { user, isStaff, isApprovedMember } = useAuth();

  // The join invitation belongs to visitors. A signed-in person gets a way back to
  // their own place: the admin panel, the member portal, or the pending screen.
  const signedIn = Boolean(user);
  const memberCta = isStaff
    ? { to: '/admin', label: t('hero.ctaAdmin') }
    : isApprovedMember
      ? { to: '/portal', label: t('hero.ctaDashboard') }
      : { to: '/pending', label: t('hero.ctaPending') };

  const activities = useAsyncList(getActivities);
  const events = useAsyncList(getEvents);
  const notices = useAsyncList(getNotices);
  const committee = useAsyncList(getCommittee);
  const members = useAsyncList(getMembers);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let alive = true;
    getPublicStats().then((value) => {
      if (alive) setStats(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  const now = new Date();
  const upcoming = events.data
    .filter((event) => new Date(event.startAt) >= now)
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    .slice(0, 3);

  // Public counters come from settings/publicStats (written by the scheduled job);
  // the published list length is the floor, so the badge never under-reports.
  const count = (fromDoc: number | undefined, listLength: number) =>
    Math.max(fromDoc ?? 0, listLength);

  const statItems = [
    { label: t('stats.members'), value: count(stats?.memberCount, members.data.length) },
    { label: t('stats.activities'), value: count(stats?.activityCount, activities.data.length) },
    { label: t('stats.events'), value: count(stats?.eventCount, events.data.length) },
    { label: t('stats.notices'), value: count(stats?.noticeCount, notices.data.length) },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 15% -10%, #34d178 0, transparent 45%), radial-gradient(ellipse at 90% 0%, #668cff 0, transparent 45%)',
          }}
        />
        <Container className="relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf-400" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-5 max-w-2xl text-[30px] font-bold leading-[1.3] text-white sm:text-[42px]">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-brand-100 sm:text-base">{t('hero.subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to="/about" variant="secondary" size="lg">
                {t('hero.ctaPrimary')}
              </ButtonLink>
              <ButtonLink
                to={signedIn ? memberCta.to : '/members#join'}
                size="lg"
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                {signedIn ? memberCta.label : t('hero.ctaSecondary')}
              </ButtonLink>
            </div>
            <p className="mt-5 text-xs text-brand-300">{t('hero.note')}</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  <img src={site.brand.logo} alt={lang === 'bn' ? site.brand.logoAltBn : site.brand.logoAltEn} className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-snug text-white">{site.organization.nameBn}</p>
                  <p className="mt-1 text-sm text-brand-200">{site.organization.branchBn}</p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/10 px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-wide text-brand-300">{t('contact.address')}</dt>
                  <dd className="mt-0.5 text-brand-50">{site.organization.parentBn}</dd>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-wide text-brand-300">{t('footer.organization')}</dt>
                  <dd className="mt-0.5 text-brand-50">{lang === 'bn' ? 'প্রতিষ্ঠা ১৯৮৯' : 'Since 1989'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <Container className="-mt-8 relative z-10">
        <StatGrid items={statItems} />
      </Container>

      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[.14em] text-leaf-600">
              {t('home.aboutKicker')}
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl">{t('home.aboutTitle')}</h2>
            <p className="mt-4 text-[16px] text-slate-600">{t('home.aboutBody')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/about" variant="outline">
                {t('common.readMore')}
              </ButtonLink>
              <ButtonLink to="/committee" variant="ghost">
                {t('home.committeePreview')} →
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.en} className="card p-5">
                <p className="font-display text-base font-bold text-brand-900">{lang === 'bn' ? value.bn : value.en}</p>
                <p className="mt-1.5 text-sm text-slate-600">{lang === 'bn' ? value.descBn : value.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <Container>
          <SectionHeading
            kicker={t('nav.activities')}
            title={t('home.latestActivities')}
            action={
              <Link to="/activities" className="text-sm font-semibold text-brand-800 hover:underline">
                {t('common.viewAll')} →
              </Link>
            }
          />
          {activities.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="card h-56 p-5">
                  <div className="skeleton h-4 w-20" />
                  <div className="skeleton mt-4 h-6 w-3/4" />
                  <div className="skeleton mt-3 h-4 w-full" />
                  <div className="skeleton mt-2 h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : activities.data.length === 0 ? (
            <EmptyState title={t('activities.empty')} body={t('placeholder.body')} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activities.data.slice(0, 3).map((activity) => (
                <Link key={activity.id} to="/activities" className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <Badge tone="green">{t(`activities.category.${activity.category}`)}</Badge>
                  <h3 className="mt-3 text-lg font-bold group-hover:text-brand-800">{activity.titleBn}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{activity.summaryBn}</p>
                  <p className="mt-auto pt-4 text-xs font-medium text-slate-400">{formatDate(activity.date, lang)}</p>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              kicker={t('nav.events')}
              title={t('home.upcomingEvents')}
              action={
                <Link to="/events" className="text-sm font-semibold text-brand-800 hover:underline">
                  {t('common.viewAll')} →
                </Link>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState title={t('events.empty')} body={t('placeholder.body')} />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((event) => (
                  <li key={event.id} className="card flex items-start gap-4 p-4">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                      <span className="font-display text-lg font-bold leading-none">
                        {lang === 'bn' ? toBnDigits(new Date(event.startAt).getDate()) : new Date(event.startAt).getDate()}
                      </span>
                      <span className="mt-1 text-[10px] font-medium uppercase text-brand-600">
                        {new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short' }).format(new Date(event.startAt))}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-950">{event.titleBn}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.venueBn ?? `«${t('common.pending')}»`}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionHeading
              kicker={t('nav.notices')}
              title={t('home.latestNotices')}
              action={
                <Link to="/notices" className="text-sm font-semibold text-brand-800 hover:underline">
                  {t('common.viewAll')} →
                </Link>
              }
            />
            {notices.data.length === 0 ? (
              <EmptyState title={t('notices.empty')} body={t('placeholder.body')} />
            ) : (
              <ul className="space-y-3">
                {notices.data.slice(0, 3).map((notice) => (
                  <li key={notice.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-brand-950">{notice.titleBn}</p>
                      <Badge tone={notice.priority === 'urgent' ? 'rose' : notice.priority === 'important' ? 'amber' : 'slate'}>
                        {t(`notices.priority.${notice.priority}`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(notice.date, lang)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>

      {!signedIn && (
      <section className="bg-brand-950 py-14 text-white sm:py-16">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('home.joinTitle')}</h2>
            <p className="mt-2 text-brand-200">{t('home.joinBody')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/members#join" variant="secondary" size="lg">
              {t('hero.ctaSecondary')}
            </ButtonLink>
            <ButtonLink to="/contact" variant="ghost" size="lg" className="border border-white/25 text-white hover:bg-white/10">
              {t('nav.contact')}
            </ButtonLink>
          </div>
        </Container>
      </section>
      )}

      <Container className="py-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo withText={false} />
          <p className="text-sm text-slate-500">
            {site.organization.nameBn} — {site.organization.branchBn}
          </p>
          <p className="text-xs text-slate-400">
            {committee.data.length > 0 ? t('committee.verifiedOnly') : t('committee.empty')}
          </p>
        </div>
      </Container>
    </>
  );
}
