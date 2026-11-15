import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getCommittee } from '@/services/publicData';
import {
  adminGetActivities,
  adminGetMembers,
  adminGetMessages,
  adminGetNotices,
  adminGetRequests,
} from '@/services/adminData';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatGrid } from '@/components/shared/StatGrid';
import { Link } from 'react-router-dom';

/** Small read-only table wrapper shared by the admin screens. */
function TableShell({
  title,
  description,
  headers,
  rows,
  loading,
  error,
}: {
  title: string;
  description?: string;
  headers: string[];
  rows: (string | JSX.Element)[][];
  loading: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-brand-950">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {loading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2].map((key) => (
            <div key={key} className="skeleton h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-rose-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState title={t('common.empty')} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-2.5 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2.5 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AdminOverview() {
  const { t, lang } = useI18n();
  const members = useAsyncList(adminGetMembers);
  const notices = useAsyncList(adminGetNotices);
  const activities = useAsyncList(adminGetActivities);
  const messages = useAsyncList(adminGetMessages);
  const requests = useAsyncList(adminGetRequests);
  const committee = useAsyncList(getCommittee);

  const pendingRequests = requests.data.filter((request) => request.status === 'pending').length;
  const openMessages = messages.data.filter((message) => !message.handled).length;

  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: t('stats.members'), value: members.data.length },
          { label: t('stats.activities'), value: activities.data.length },
          { label: t('stats.notices'), value: notices.data.length },
          { label: t('stats.events'), value: committee.data.length },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/requests" className="card flex items-center justify-between p-5 hover:shadow-lg">
          <div>
            <p className="text-sm font-semibold text-slate-500">{t('admin.pendingRequests')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand-900">{pendingRequests}</p>
          </div>
          <span className="text-brand-700">→</span>
        </Link>
        <Link to="/admin/messages" className="card flex items-center justify-between p-5 hover:shadow-lg">
          <div>
            <p className="text-sm font-semibold text-slate-500">{t('admin.messages')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand-900">{openMessages}</p>
          </div>
          <span className="text-brand-700">→</span>
        </Link>
      </div>

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {t('admin.notDeployed')}
        {lang === 'bn' ? ' তথ্য যোগ/সম্পাদনা Firestore Console থেকে করুন।' : ' Add or edit records from the Firestore console for now.'}
      </p>
    </div>
  );
}

export function AdminMembers() {
  const { t, lang } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetMembers);
  return (
    <TableShell
      title={t('admin.tab.members')}
      description={t('members.privacy')}
      headers={['নাম', 'ওয়ার্ড', 'অবস্থা', 'ভূমিকা']}
      loading={loading}
      error={error}
      rows={data.map((member) => [
        member.nameBn,
        member.ward ?? '—',
        <Badge tone={member.status === 'active' ? 'green' : member.status === 'pending' ? 'amber' : 'slate'}>
          {t(`member.status.${member.status}`)}
        </Badge>,
        member.role === 'admin' ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin') : lang === 'bn' ? 'সদস্য' : 'Member',
      ])}
    />
  );
}

export function AdminCommittee() {
  const { t, pick, lang } = useI18n();
  const { data, loading, error } = useAsyncList(getCommittee);
  return (
    <TableShell
      title={t('admin.tab.committee')}
      headers={['নাম', 'পদবি', 'যাচাই']}
      loading={loading}
      error={error}
      rows={data.map((member) => [
        pick(member.nameBn, member.nameEn),
        pick(member.roleTitleBn, member.roleTitleEn) || member.role,
        <Badge tone={member.verification === 'verified' ? 'green' : 'amber'}>
          {member.verification === 'verified' ? (lang === 'bn' ? 'যাচাইকৃত' : 'Verified') : t('common.pending')}
        </Badge>,
      ])}
    />
  );
}

export function AdminNotices() {
  const { t, lang, pick } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetNotices);
  return (
    <TableShell
      title={t('admin.tab.notices')}
      headers={['শিরোনাম', 'তারিখ', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((notice) => [
        pick(notice.titleBn, notice.titleEn),
        formatDate(notice.date, lang),
        <Badge tone={notice.published ? 'green' : 'slate'}>{notice.published ? 'প্রকাশিত' : 'খসড়া'}</Badge>,
      ])}
    />
  );
}

export function AdminActivities() {
  const { t, lang } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetActivities);
  return (
    <TableShell
      title={t('admin.tab.activities')}
      headers={['শিরোনাম', 'ধরন', 'তারিখ', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((activity) => [
        activity.titleBn,
        t(`activities.category.${activity.category}`),
        formatDate(activity.date, lang),
        <Badge tone={activity.published ? 'green' : 'slate'}>{activity.published ? 'প্রকাশিত' : 'খসড়া'}</Badge>,
      ])}
    />
  );
}

export function AdminMessages() {
  const { t } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetMessages);
  return (
    <TableShell
      title={t('admin.messages')}
      headers={['নাম', 'বিষয়', 'যাচাই']}
      loading={loading}
      error={error}
      rows={data.map((message) => [
        message.name,
        message.subject,
        <Badge tone={message.handled ? 'green' : 'amber'}>{message.handled ? 'সম্পন্ন' : 'অপেক্ষমাণ'}</Badge>,
      ])}
    />
  );
}

export function AdminRequests() {
  const { t } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetRequests);
  return (
    <TableShell
      title={t('admin.tab.requests')}
      headers={['নাম', 'মোবাইল', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((request) => [
        request.nameBn,
        request.phone,
        <Badge tone={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'rose' : 'amber'}>
          {request.status}
        </Badge>,
      ])}
    />
  );
}
