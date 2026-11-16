import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { cn, formatDate } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getCommittee } from '@/services/publicData';
import { adminGetActivities, adminGetAuditLogs, adminGetEvents, adminGetMessages, adminGetNotices } from '@/services/adminData';
import { listAllUsers, setUserRole, setUserStatus } from '@/services/userService';
import { listApplications, reviewApplication } from '@/services/applicationService';
import { documentUrl } from '@/services/documentService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatGrid } from '@/components/shared/StatGrid';
import { AdminTable } from './AdminTable';
import type { AccountStatus, Role, UserProfile } from '@/types';

const ROLE_OPTIONS: Role[] = ['member', 'editor', 'admin', 'super_admin'];
const STATUS_TONES: Record<AccountStatus, 'green' | 'amber' | 'rose'> = {
  active: 'green',
  pending: 'amber',
  suspended: 'rose',
};

export function AdminOverview() {
  const { t } = useI18n();
  const users = useAsyncList(listAllUsers);
  const applications = useAsyncList(listApplications);
  const notices = useAsyncList(adminGetNotices);
  const activities = useAsyncList(adminGetActivities);
  const messages = useAsyncList(adminGetMessages);
  const committee = useAsyncList(getCommittee);

  const pending = applications.data.filter((application) => application.status === 'pending').length;
  const openMessages = messages.data.filter((message) => !message.handled).length;

  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: t('stats.members'), value: users.data.length },
          { label: t('stats.activities'), value: activities.data.length },
          { label: t('stats.notices'), value: notices.data.length },
          { label: t('admin.tab.committee'), value: committee.data.length },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/applications" className="card flex items-center justify-between p-5 hover:shadow-lg">
          <div>
            <p className="text-sm font-semibold text-slate-500">{t('admin.pendingRequests')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand-900">{pending}</p>
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

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('admin.notDeployed')}</p>
    </div>
  );
}

/** Applications awaiting review — admin + super_admin. */
export function AdminApplications() {
  const { t, lang } = useI18n();
  const { user, role } = useAuth();
  const { data, loading, error } = useAsyncList(listApplications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function decide(id: string, decision: 'approve' | 'reject', fullName: string) {
    const application = data.find((item) => item.id === id);
    if (!application || !user) return;
    const question = decision === 'approve' ? t('admin.confirmApprove') : t('admin.confirmReject');
    if (!window.confirm(`${question}\n\n${fullName}`)) return;
    setBusyId(id);
    setNote('');
    try {
      await reviewApplication(application, decision, { uid: user.uid, role });
      setNote(t('admin.actionDone'));
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {note && <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-900">{note}</p>}
      <AdminTable
        title={t('admin.tab.applications')}
        description={t('admin.applicationsLead')}
        headers={['নাম', 'মোবাইল', 'গ্রাম', 'কাগজপত্র', 'তারিখ', 'অবস্থা', '']}
        loading={loading}
        error={error}
        rows={data.map((application) => [
          application.fullName,
          application.phone,
          application.village ?? '—',
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {(application.documents ?? []).length === 0 ? (
              <span className="text-slate-400">নেই</span>
            ) : (
              (application.documents ?? []).map((document) => (
                <a
                  key={document.key}
                  href={documentUrl(document.key)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-800 underline decoration-dotted"
                  title={document.name}
                >
                  {document.label.replace('শিক্ষা প্রতিষ্ঠানের প্রত্যয়নপত্র / পরিচয়পত্র', 'প্রত্যয়নপত্র')}
                </a>
              ))
            )}
            {application.facebookUrl ? (
              <a
                href={application.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-brand-800 underline decoration-dotted"
              >
                ফেসবুক
              </a>
            ) : null}
          </span>,
          application.createdAt ? formatDate(application.createdAt, lang) : '—',
          <Badge
            tone={
              application.status === 'approved' ? 'green' : application.status === 'rejected' ? 'rose' : 'amber'
            }
          >
            {t(`application.status.${application.status}`)}
          </Badge>,
          <span className="flex items-center gap-1.5">
            <Link
              to={`/admin/applications/${application.id}`}
              className="text-xs font-semibold text-brand-800 hover:underline"
            >
              বিস্তারিত
            </Link>
            {application.status === 'pending' ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === application.id}
                  onClick={() => void decide(application.id, 'approve', application.fullName)}
                >
                  {t('admin.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busyId === application.id}
                  onClick={() => void decide(application.id, 'reject', application.fullName)}
                >
                  {t('admin.reject')}
                </Button>
              </>
            ) : (
              <span className="text-xs text-slate-400">{application.reviewedBy ? '✓' : '—'}</span>
            )}
          </span>,
        ])}
      />
    </div>
  );
}

/** Account list with status controls; role changes are super_admin only. */
export function AdminUsers() {
  const { t, lang } = useI18n();
  const { user, role, isSuperAdmin } = useAuth();
  const { data, loading, error } = useAsyncList(listAllUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function changeStatus(target: UserProfile, status: AccountStatus) {
    if (!user) return;
    if (!window.confirm(`${t('admin.confirmStatus')}\n\n${target.nameBn} → ${status}`)) return;
    setBusyId(target.id);
    setNote('');
    try {
      await setUserStatus(target, status, role);
      setNote(t('admin.actionDone'));
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(target: UserProfile, nextRole: Role) {
    if (!user || nextRole === target.role) return;
    if (!window.confirm(`${t('admin.confirmRole')}\n\n${target.nameBn} → ${nextRole}`)) return;
    setBusyId(target.id);
    setNote('');
    try {
      await setUserRole(target, nextRole, role);
      setNote(t('admin.actionDone'));
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {note && <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-900">{note}</p>}
      <AdminTable
        title={t('admin.tab.members')}
        description={t('members.privacy')}
        headers={['নাম', 'ওয়ার্ড', 'অবস্থা', 'ভূমিকা', '']}
        loading={loading}
        error={error}
        rows={data.map((member) => [
          member.nameBn,
          member.ward ?? '—',
          <Badge tone={STATUS_TONES[member.status]}>{t(`member.status.${member.status}`)}</Badge>,
          isSuperAdmin ? (
            <select
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
              value={member.role}
              disabled={busyId === member.id || member.id === user?.uid}
              onChange={(event) => void changeRole(member, event.target.value as Role)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`roles.${option}`)}
                </option>
              ))}
            </select>
          ) : (
            t(`roles.${member.role}`)
          ),
          member.status !== 'active' ? (
            <Button size="sm" variant="secondary" disabled={busyId === member.id} onClick={() => void changeStatus(member, 'active')}>
              {t('admin.activate')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busyId === member.id || member.id === user?.uid} onClick={() => void changeStatus(member, 'suspended')}>
              {t('admin.suspend')}
            </Button>
          ),
        ])}
      />
      <p className="text-xs text-slate-400">{t('admin.selfProtection')} {formatDate(new Date(), lang)}</p>
    </div>
  );
}

export function AdminCommittee() {
  const { t, pick, lang } = useI18n();
  const { data, loading, error } = useAsyncList(getCommittee);
  return (
    <AdminTable
      title={t('admin.tab.committee')}
      headers={['নাম', 'পদবি', 'যাচাই']}
      loading={loading}
      error={error}
      rows={data.map((member) => [
        pick(member.nameBn, member.nameEn),
        pick(member.roleTitleBn, member.roleTitleEn) || t(`committee.role.${member.role}`),
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
    <AdminTable
      title={t('admin.tab.notices')}
      headers={['শিরোনাম', 'তারিখ', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((notice) => [
        pick(notice.titleBn, notice.titleEn),
        formatDate(notice.date, lang),
        <Badge tone={notice.published ? 'green' : 'slate'}>{notice.published ? t('admin.published') : t('admin.draft')}</Badge>,
      ])}
    />
  );
}

export function AdminActivities() {
  const { t, lang } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetActivities);
  return (
    <AdminTable
      title={t('admin.tab.activities')}
      headers={['শিরোনাম', 'ধরন', 'তারিখ', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((activity) => [
        activity.titleBn,
        t(`activities.category.${activity.category}`),
        formatDate(activity.date, lang),
        <Badge tone={activity.published ? 'green' : 'slate'}>{activity.published ? t('admin.published') : t('admin.draft')}</Badge>,
      ])}
    />
  );
}

export function AdminEvents() {
  const { t, lang, pick } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetEvents);
  return (
    <AdminTable
      title={t('admin.tab.events')}
      headers={['শিরোনাম', 'শুরুর সময়', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((event) => [
        pick(event.titleBn, event.titleEn),
        formatDate(event.startAt, lang),
        <Badge tone={event.published ? 'green' : 'slate'}>{event.published ? t('admin.published') : t('admin.draft')}</Badge>,
      ])}
    />
  );
}

export function AdminMessages() {
  const { t, lang } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetMessages);
  return (
    <AdminTable
      title={t('admin.messages')}
      headers={['নাম', 'বিষয়', 'তারিখ', 'অবস্থা']}
      loading={loading}
      error={error}
      rows={data.map((message) => [
        message.name,
        message.subject,
        message.createdAt ? formatDate(message.createdAt, lang) : '—',
        <Badge tone={message.handled ? 'green' : 'amber'}>{message.handled ? t('admin.handled') : t('admin.pending')}</Badge>,
      ])}
    />
  );
}

export function AdminAuditLogs() {
  const { t, lang } = useI18n();
  const { data, loading, error } = useAsyncList(adminGetAuditLogs);
  return (
    <AdminTable
      title={t('admin.tab.audit')}
      description={t('admin.auditLead')}
      headers={['কাজ', 'ধরন', 'বিবরণ', 'সময়']}
      loading={loading}
      error={error}
      rows={data.map((log) => [
        <span className={cn('font-mono text-xs', log.action.includes('role') ? 'text-rose-700' : 'text-slate-700')}>{log.action}</span>,
        log.targetType,
        log.detail ?? '—',
        log.createdAt ? formatDate(log.createdAt, lang) : '—',
      ])}
    />
  );
}
