import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { formatDate, formatTime } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { adminGetEvents } from '@/services/adminData';
import { listAllUsers } from '@/services/userService';
import { setAttendance } from '@/services/memberService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Label, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';

/**
 * কমিটির উপস্থিতি পর্দা — কোনো কর্মসূচিতে কে আসবেন বলেছেন আর কে সত্যিই এসেছেন।
 * আরএসভিপি ও উপস্থিতি সদস্যের নিজের ডকুমেন্টে থাকে, তাই এখানে সব অ্যাকাউন্ট পড়া
 * হয় (শুধু admin/super_admin পারেন — firestore.rules-এ সেটাই লেখা)।
 */
export function AdminAttendance() {
  const { t, lang, pick } = useI18n();
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const events = useAsyncList(adminGetEvents);
  const users = useAsyncList(listAllUsers, [version]);
  const [eventId, setEventId] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (eventId || events.data.length === 0) return;
    const now = Date.now();
    const next = events.data.find((event) => +new Date(event.startAt) >= now) ?? events.data[0];
    setEventId(next.id);
  }, [events.data, eventId]);

  const members = useMemo(
    () => users.data.filter((item) => item.role === 'member' && item.status === 'active'),
    [users.data],
  );

  const rows = useMemo(() => {
    if (!eventId) return [];
    return members
      .map((member) => ({
        member,
        rsvp: member.rsvps?.[eventId],
        stamp: member.attendance?.[eventId],
      }))
      .filter((row) => row.rsvp || row.stamp)
      .sort((a, b) => a.member.nameBn.localeCompare(b.member.nameBn, 'bn'));
  }, [members, eventId]);

  const stats = useMemo(
    () => ({
      answered: rows.length,
      going: rows.filter((row) => row.rsvp === 'going').length,
      present: rows.filter((row) => row.stamp).length,
    }),
    [rows],
  );

  async function toggle(targetUid: string, present: boolean) {
    if (!user) return;
    setBusy(targetUid);
    try {
      await setAttendance(targetUid, eventId, present, user.uid);
      setVersion((value) => value + 1);
    } finally {
      setBusy('');
    }
  }

  const selected = events.data.find((event) => event.id === eventId);
  const loading = events.loading || users.loading;

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-slate-600">{t('admin.att.lead')}</p>

      {events.data.length === 0 && !events.loading ? (
        <EmptyState title={t('admin.att.noEvents')} />
      ) : (
        <>
          <div className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="att-event">{t('admin.att.event')}</Label>
              <Select id="att-event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
                {events.data.map((event) => (
                  <option key={event.id} value={event.id}>
                    {pick(event.titleBn, event.titleEn)} — {formatDate(event.startAt, lang)}
                  </option>
                ))}
              </Select>
            </div>
            {selected && (
              <div className="text-xs text-slate-500">
                {formatTime(selected.startAt, lang)}
                {selected.venueBn ? ` • ${pick(selected.venueBn, selected.venueEn)}` : ''}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">
              {t('admin.att.rsvp')}: {stats.answered}
            </Badge>
            <Badge tone="green">
              {t('admin.att.yes')}: {stats.going}
            </Badge>
            <Badge tone="brand">
              {t('admin.att.present')}: {stats.present}
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title={t('admin.att.empty')} />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">{t('admin.att.name')}</th>
                    <th className="px-4 py-2.5">{t('admin.att.ward')}</th>
                    <th className="px-4 py-2.5">{t('admin.att.rsvp')}</th>
                    <th className="px-4 py-2.5">{t('admin.att.attendance')}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.member.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {row.member.nameBn}
                        {row.member.memberCode && (
                          <span className="ml-2 font-mono text-[11px] font-normal text-slate-400">{row.member.memberCode}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{row.member.ward ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        {row.rsvp === 'going' ? (
                          <Badge tone="green">{t('admin.att.yes')}</Badge>
                        ) : row.rsvp === 'not_going' ? (
                          <Badge tone="rose">{t('admin.att.no')}</Badge>
                        ) : (
                          <span className="text-slate-400">{t('admin.att.none')}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.stamp ? <Badge tone="brand">{t('admin.att.present')}</Badge> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant={row.stamp ? 'outline' : 'secondary'}
                          disabled={busy === row.member.id}
                          onClick={() => void toggle(row.member.id, !row.stamp)}
                        >
                          {row.stamp ? t('admin.att.markAbsent') : t('admin.att.markPresent')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
