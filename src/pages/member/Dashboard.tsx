import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { formatDate, formatTime } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getEvents, getNotices } from '@/services/publicData';
import { checkInToEvent, clearMyRsvp, setMyRsvp } from '@/services/memberService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { EventItem, RsvpStatus } from '@/types';

/** উপস্থিতি নিশ্চিত করার জানালা: শুরুর ২ ঘণ্টা আগে থেকে শেষের ৪ ঘণ্টা পরে পর্যন্ত। */
function checkInWindow(event: EventItem): { open: boolean; reason: 'early' | 'late' | 'open' } {
  const start = +new Date(event.startAt);
  const end = event.endAt ? +new Date(event.endAt) : start + 3 * 60 * 60 * 1000;
  const now = Date.now();
  if (now < start - 2 * 60 * 60 * 1000) return { open: false, reason: 'early' };
  if (now > end + 4 * 60 * 60 * 1000) return { open: false, reason: 'late' };
  return { open: true, reason: 'open' };
}

export function MemberDashboardPage() {
  const { t, lang, pick } = useI18n();
  const { user, profile, contact, role, refreshProfile } = useAuth();
  const events = useAsyncList(getEvents);
  const notices = useAsyncList(getNotices);
  const [busy, setBusy] = useState<string>('');
  const [note, setNote] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const now = Date.now();
  const upcoming = events.data.filter((event) => +new Date(event.startAt) >= now - 6 * 60 * 60 * 1000).slice(0, 3);
  const attendedCount = Object.keys(profile?.attendance ?? {}).length;

  async function answer(eventId: string, status: RsvpStatus) {
    if (!user) return;
    setBusy(eventId);
    setNote(null);
    try {
      if (profile?.rsvps?.[eventId] === status) {
        // একই উত্তরে আবার চাপলে উত্তরটি তুলে নেওয়া হয়
        await clearMyRsvp(user.uid, eventId);
      } else {
        await setMyRsvp(user.uid, eventId, status);
      }
      await refreshProfile();
      setNote({ tone: 'ok', text: t('member.rsvp.saved') });
    } catch (error) {
      setNote({ tone: 'bad', text: (error as Error).message });
    } finally {
      setBusy('');
    }
  }

  async function checkIn(eventId: string) {
    if (!user) return;
    setBusy(`in-${eventId}`);
    setNote(null);
    try {
      await checkInToEvent(user.uid, eventId);
      await refreshProfile();
      setNote({ tone: 'ok', text: t('member.rsvp.checkInOk') });
    } catch (error) {
      setNote({ tone: 'bad', text: (error as Error).message });
    } finally {
      setBusy('');
    }
  }

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
          {attendedCount > 0 && (
            <span className="text-xs text-brand-200">
              {t('member.rsvp.attendCount')}: {attendedCount}
            </span>
          )}
        </div>
        {!profile && (
          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-brand-100">{t('member.notVerified')}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { to: '/portal/card', label: t('member.tab.card') },
            { to: '/portal/certificate', label: t('member.tab.certificate') },
            { to: '/portal/directory', label: t('member.tab.directory') },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-white transition hover:bg-white/25"
            >
              {item.label} →
            </Link>
          ))}
        </div>
      </div>

      {note && (
        <p
          className={`rounded-xl px-4 py-2.5 text-sm ${
            note.tone === 'ok' ? 'bg-leaf-50 text-leaf-800' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {note.text}
        </p>
      )}

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
            <ul className="space-y-3">
              {upcoming.map((event) => {
                const myAnswer = profile?.rsvps?.[event.id];
                const stamp = profile?.attendance?.[event.id];
                const window = checkInWindow(event);
                return (
                  <li key={event.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">{pick(event.titleBn, event.titleEn)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(event.startAt, lang)} • {formatTime(event.startAt, lang)}
                      {event.venueBn ? ` • ${pick(event.venueBn, event.venueEn)}` : ''}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={myAnswer === 'going' ? 'secondary' : 'outline'}
                        onClick={() => void answer(event.id, 'going')}
                        disabled={busy === event.id}
                      >
                        {myAnswer === 'going' ? `✓ ${t('member.rsvp.going')}` : t('member.rsvp.going')}
                      </Button>
                      <Button
                        size="sm"
                        variant={myAnswer === 'not_going' ? 'danger' : 'outline'}
                        onClick={() => void answer(event.id, 'not_going')}
                        disabled={busy === event.id}
                      >
                        {myAnswer === 'not_going' ? `✓ ${t('member.rsvp.notGoing')}` : t('member.rsvp.notGoing')}
                      </Button>
                      {stamp ? (
                        <Badge tone="green">{t('member.rsvp.attended')}</Badge>
                      ) : window.open ? (
                        <Button
                          size="sm"
                          onClick={() => void checkIn(event.id)}
                          disabled={busy === `in-${event.id}`}
                        >
                          {busy === `in-${event.id}` ? <Spinner className="h-4 w-4" /> : null}
                          {t('member.rsvp.checkIn')}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400">{t('member.rsvp.checkInClosed')}</span>
                      )}
                    </div>
                  </li>
                );
              })}
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
