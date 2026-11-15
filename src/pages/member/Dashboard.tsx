import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { formatDate, formatTime } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getEvents, getNotices } from '@/services/publicData';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export function MemberDashboardPage() {
  const { t, lang, pick } = useI18n();
  const { user, profile, contact, role } = useAuth();
  const events = useAsyncList(getEvents);
  const notices = useAsyncList(getNotices);

  const now = Date.now();
  const upcoming = events.data.filter((event) => +new Date(event.startAt) >= now).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-900 to-brand-800 p-5 text-white sm:p-6">
        <p className="text-sm text-brand-200">{t('member.welcome')}</p>
        <h2 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
          {profile?.nameBn ?? user?.displayName ?? user?.email ?? ''}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={profile?.status === 'active' ? 'green' : profile?.status === 'pending' ? 'amber' : 'rose'}>
            {t(`member.status.${profile?.status ?? 'pending'}`)}
          </Badge>
          {profile?.memberCode && <span className="text-xs text-brand-200">ID: {profile.memberCode}</span>}
        </div>
        {!profile && (
          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-brand-100">{t('member.notVerified')}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-brand-950">{t('member.upcoming')}</h3>
            <Link to="/events" className="text-xs font-semibold text-brand-800 hover:underline">
              {t('common.viewAll')}
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title={t('events.empty')} />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((event) => (
                <li key={event.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">{pick(event.titleBn, event.titleEn)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(event.startAt, lang)} • {formatTime(event.startAt, lang)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-brand-950">{t('member.notices')}</h3>
            <Link to="/notices" className="text-xs font-semibold text-brand-800 hover:underline">
              {t('common.viewAll')}
            </Link>
          </div>
          {notices.data.length === 0 ? (
            <EmptyState title={t('notices.empty')} />
          ) : (
            <ul className="space-y-2">
              {notices.data.slice(0, 4).map((notice) => (
                <li key={notice.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">{pick(notice.titleBn, notice.titleEn)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(notice.date, lang)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h3 className="font-display text-base font-bold text-brand-950">{t('member.myInfo')}</h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: t('auth.email'), value: contact?.email ?? user?.email ?? '—' },
            { label: t('contact.phone'), value: contact?.phone ?? '—' },
            { label: t('member.role'), value: t(`roles.${role}`) },
            { label: lang === 'bn' ? 'গ্রাম' : 'Village', value: profile?.village ?? '—' },
            { label: lang === 'bn' ? 'ওয়ার্ড' : 'Ward', value: profile?.ward ?? '—' },
          ].map((row) => (
            <div key={row.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{row.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-800">{row.value}</dd>
            </div>
          ))}
        </dl>
        <Link to="/portal/profile" className="mt-4 inline-block text-sm font-semibold text-brand-800 hover:underline">
          {t('member.profile')} →
        </Link>
      </section>
    </div>
  );
}
