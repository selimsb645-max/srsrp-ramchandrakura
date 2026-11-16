import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { cn, formatDate } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import {
  adminGetActivities,
  adminGetAuditLogs,
  adminGetCommittee,
  adminGetEvents,
  adminGetGallery,
  adminGetMessages,
  adminGetNotices,
  deleteMessage,
  setMessageHandled,
} from '@/services/adminData';
import { listAllUsers, nextMemberCode, setMemberCode, setUserRole, setUserStatus } from '@/services/userService';
import { listApplications, reviewApplication } from '@/services/applicationService';
import { documentUrl } from '@/services/documentService';
import { deleteContent, saveContent, setContentPublished, type FormValues } from '@/services/contentService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatGrid } from '@/components/shared/StatGrid';
import { AdminTable } from './AdminTable';
import { ContentAdmin, type ColumnDef, type FieldDef } from './ContentAdmin';
import type { Activity, AccountStatus, CommitteeMember, EventItem, GalleryItem, Notice, Role, UserProfile } from '@/types';

const ROLE_OPTIONS: Role[] = ['member', 'editor', 'admin', 'super_admin'];
const STATUS_TONES: Record<AccountStatus, 'green' | 'amber' | 'rose'> = {
  active: 'green',
  pending: 'amber',
  suspended: 'rose',
};

/** আজকের তারিখ, yyyy-mm-dd — নতুন নোটিশ/কার্যক্রমের ঘর আগেই ভরা থাকে। */
function todayInput(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Firestore-এ রাখা ISO সময়কে datetime-local ঘরে বসানোর রূপে আনি। */
function toLocalInput(value?: string | null): string {
  if (!value) return '';
  return String(value).slice(0, 16);
}

export function AdminOverview() {
  const { t } = useI18n();
  const users = useAsyncList(listAllUsers);
  const applications = useAsyncList(listApplications);
  const notices = useAsyncList(adminGetNotices);
  const activities = useAsyncList(adminGetActivities);
  const events = useAsyncList(adminGetEvents);
  const messages = useAsyncList(adminGetMessages);
  const committee = useAsyncList(adminGetCommittee);

  const pending = applications.data.filter((application) => application.status === 'pending').length;
  const openMessages = messages.data.filter((message) => !message.handled).length;

  const quickLinks = [
    { to: '/admin/notices', label: t('admin.quickNotice'), note: `${notices.data.length} ${t('admin.items')}` },
    { to: '/admin/activities', label: t('admin.quickActivity'), note: `${activities.data.length} ${t('admin.items')}` },
    { to: '/admin/events', label: t('admin.quickEvent'), note: `${events.data.length} ${t('admin.items')}` },
  ];

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

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to} className="card flex items-center justify-between p-4 hover:shadow-lg">
            <span>
              <span className="block text-sm font-semibold text-brand-950">{link.label}</span>
              <span className="mt-0.5 block text-xs text-slate-400">{link.note}</span>
            </span>
            <span className="text-lg text-brand-700">+</span>
          </Link>
        ))}
      </div>

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

      <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-900">
        {t('admin.overviewLead')}
      </p>
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

/**
 * সদস্য নম্বর সেল — কমিটি সরাসরি লিখতে পারে, অথবা "তৈরি" চেপে পরবর্তী নম্বর নিতে পারে।
 * অনুমোদনের সময় নম্বর স্বয়ংক্রিয়ভাবেও দেওয়া হয়, তাই এটি সাধারণত শুধু সংশোধনের জন্য।
 */
function MemberCodeCell({ member, onSaved }: { member: UserProfile; onSaved: (message: string) => void }) {
  const [value, setValue] = useState(member.memberCode ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(member.memberCode ?? '');
  }, [member.memberCode]);

  async function save() {
    if (busy || value.trim().toUpperCase() === (member.memberCode ?? '')) return;
    setBusy(true);
    try {
      await setMemberCode(member.id, value);
      onSaved(`${member.nameBn}: সদস্য নম্বর সংরক্ষণ হয়েছে।`);
    } catch {
      onSaved('নম্বরটি নেওয়া হয়নি — ৪ থেকে ২৪ অক্ষর, শুধু A–Z, 0–9 ও হাইফেন ব্যবহার করুন।');
      setValue(member.memberCode ?? '');
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      const code = await nextMemberCode();
      await setMemberCode(member.id, code);
      setValue(code);
      onSaved(`${member.nameBn}: নতুন নম্বর ${code}`);
    } catch (err) {
      onSaved((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        className="w-32 rounded-lg border border-slate-300 px-2 py-1 font-mono text-[11px]"
        value={value}
        placeholder="SRC-RK-26-0001"
        disabled={busy}
        onChange={(event) => setValue(event.target.value.toUpperCase())}
        onBlur={() => void save()}
        aria-label="সদস্য নম্বর"
      />
      <button type="button" className="text-[11px] font-semibold text-brand-700 hover:underline" disabled={busy} onClick={() => void generate()}>
        তৈরি
      </button>
    </div>
  );
}

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
        headers={['নাম', 'সদস্য নম্বর', 'ওয়ার্ড', 'অবস্থা', 'ভূমিকা', '']}
        loading={loading}
        error={error}
        rows={data.map((member) => [
          member.nameBn,
          <MemberCodeCell member={member} onSaved={setNote} />,
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

const COMMITTEE_ROLE_OPTIONS = [
  'president',
  'vice_president',
  'general_secretary',
  'joint_secretary',
  'organizing_secretary',
  'treasurer',
  'office_secretary',
  'publicity_secretary',
  'member',
].map((value) => ({ value, label: value }));

export function AdminCommittee() {
  const { t, pick } = useI18n();
  const { role } = useAuth();

  const roleOptions = COMMITTEE_ROLE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`committee.role.${option.value}`),
  }));

  const fields: FieldDef[] = [
    { name: 'nameBn', label: 'নাম (বাংলা)', required: true },
    { name: 'nameEn', label: 'নাম (English)', hint: 'ঐচ্ছিক' },
    { name: 'role', label: 'পদবি', type: 'select', required: true, options: roleOptions },
    { name: 'order', label: 'ক্রম', type: 'number', required: true, hint: '১ = প্রথমে দেখাবে' },
    { name: 'roleTitleBn', label: 'পদবির পূর্ণ নাম (বাংলা)', hint: 'যেমন সাংগঠনিক সম্পাদক' },
    { name: 'roleTitleEn', label: 'পদবির পূর্ণ নাম (English)' },
    { name: 'termBn', label: 'কার্যকাল', hint: 'যেমন ২০২৬–২০২৮' },
    { name: 'photoUrl', label: 'ছবি', type: 'image' },
    { name: 'phone', label: 'মোবাইল', hint: 'ঐচ্ছিক, প্রকাশ্যে দেখানো হয় না' },
    {
      name: 'verification',
      label: 'যাচাই',
      type: 'select',
      options: [
        { value: 'pending', label: 'যাচাই বাকি' },
        { value: 'verified', label: 'যাচাইকৃত' },
      ],
    },
    { name: 'published', label: 'ওয়েবসাইটে প্রকাশ করুন', type: 'checkbox', wide: true },
  ];

  const columns: ColumnDef<CommitteeMember>[] = [
    { header: 'নাম', cell: (member) => pick(member.nameBn, member.nameEn) },
    {
      header: 'পদবি',
      cell: (member) => pick(member.roleTitleBn, member.roleTitleEn) || t(`committee.role.${member.role}`),
    },
    {
      header: 'যাচাই',
      cell: (member) => (
        <Badge tone={member.verification === 'verified' ? 'green' : 'amber'}>
          {member.verification === 'verified' ? 'যাচাইকৃত' : t('common.pending')}
        </Badge>
      ),
    },
    { header: 'কার্যকাল', cell: (member) => member.termBn ?? '—' },
  ];

  return (
    <ContentAdmin<CommitteeMember>
      title={t('admin.tab.committee')}
      description={t('admin.manageLead')}
      addLabel="নতুন কমিটি সদস্য"
      load={adminGetCommittee}
      columns={columns}
      fields={fields}
      blank={{ nameBn: '', nameEn: '', role: 'member', order: 10, verification: 'pending', published: false }}
      toForm={(member) => ({
        nameBn: member.nameBn,
        nameEn: member.nameEn ?? '',
        role: member.role,
        roleTitleBn: member.roleTitleBn ?? '',
        roleTitleEn: member.roleTitleEn ?? '',
        order: member.order ?? 10,
        termBn: member.termBn ?? '',
        photoUrl: member.photoUrl ?? '',
        phone: member.phone ?? '',
        verification: member.verification,
        published: member.published === true,
      })}
      save={(values, id) => saveContent('committees', values, id)}
      remove={(member) => deleteContent('committees', member.id, role)}
      publish={{
        isPublished: (member) => member.published === true,
        toggle: (member) => setContentPublished('committees', member.id, !member.published, role),
      }}
      emptyTitle="কমিটির কোনো সদস্য এখনো যোগ করা হয়নি।"
    />
  );
}

export function AdminNotices() {
  const { t, lang, pick } = useI18n();
  const { role } = useAuth();

  const fields: FieldDef[] = [
    { name: 'titleBn', label: 'শিরোনাম (বাংলা)', required: true },
    { name: 'titleEn', label: 'শিরোনাম (English)' },
    { name: 'date', label: 'তারিখ', type: 'date', required: true },
    {
      name: 'priority',
      label: 'গুরুত্ব',
      type: 'select',
      required: true,
      options: [
        { value: 'normal', label: t('notices.priority.normal') },
        { value: 'important', label: t('notices.priority.important') },
        { value: 'urgent', label: t('notices.priority.urgent') },
      ],
    },
    { name: 'bodyBn', label: 'বিস্তারিত (বাংলা)', type: 'textarea', required: true },
    { name: 'bodyEn', label: 'বিস্তারিত (English)', type: 'textarea' },
    { name: 'attachmentUrl', label: 'সংযুক্তির লিংক', hint: 'PDF বা ছবির লিংক, ঐচ্ছিক' },
    { name: 'published', label: 'ওয়েবসাইটে প্রকাশ করুন', type: 'checkbox', wide: true },
  ];

  const columns: ColumnDef<Notice>[] = [
    { header: 'শিরোনাম', cell: (notice) => pick(notice.titleBn, notice.titleEn) },
    { header: 'তারিখ', cell: (notice) => formatDate(notice.date, lang) },
    { header: 'গুরুত্ব', cell: (notice) => t(`notices.priority.${notice.priority}`) },
  ];

  return (
    <ContentAdmin<Notice>
      title={t('admin.tab.notices')}
      description={t('admin.manageLead')}
      addLabel="নতুন নোটিশ"
      load={adminGetNotices}
      columns={columns}
      fields={fields}
      blank={{ titleBn: '', titleEn: '', bodyBn: '', bodyEn: '', date: todayInput(), priority: 'normal', published: false }}
      toForm={(notice) => ({
        titleBn: notice.titleBn,
        titleEn: notice.titleEn ?? '',
        bodyBn: notice.bodyBn,
        bodyEn: notice.bodyEn ?? '',
        date: toLocalInput(notice.date).slice(0, 10),
        priority: notice.priority,
        attachmentUrl: notice.attachmentUrl ?? '',
        published: notice.published === true,
      })}
      save={(values, id) => saveContent('notices', values, id)}
      remove={(notice) => deleteContent('notices', notice.id, role)}
      publish={{
        isPublished: (notice) => notice.published === true,
        toggle: (notice) => setContentPublished('notices', notice.id, !notice.published, role),
      }}
      emptyTitle="এখনো কোনো নোটিশ যোগ করা হয়নি।"
    />
  );
}

export function AdminActivities() {
  const { t, lang } = useI18n();
  const { role } = useAuth();

  const fields: FieldDef[] = [
    { name: 'titleBn', label: 'শিরোনাম (বাংলা)', required: true },
    { name: 'titleEn', label: 'শিরোনাম (English)' },
    {
      name: 'category',
      label: 'ধরন',
      type: 'select',
      required: true,
      options: ['education', 'sports', 'culture', 'health', 'social', 'environment', 'other'].map((value) => ({
        value,
        label: t(`activities.category.${value}`),
      })),
    },
    { name: 'date', label: 'তারিখ', type: 'date', required: true },
    { name: 'summaryBn', label: 'সংক্ষেপ (বাংলা)', type: 'textarea', required: true },
    { name: 'summaryEn', label: 'সংক্ষেপ (English)', type: 'textarea' },
    { name: 'bodyBn', label: 'বিস্তারিত (বাংলা)', type: 'textarea' },
    { name: 'bodyEn', label: 'বিস্তারিত (English)', type: 'textarea' },
    { name: 'locationBn', label: 'স্থান' },
    { name: 'coverImageUrl', label: 'প্রচ্ছদ ছবি', type: 'image' },
    { name: 'published', label: 'ওয়েবসাইটে প্রকাশ করুন', type: 'checkbox', wide: true },
  ];

  const columns: ColumnDef<Activity>[] = [
    { header: 'শিরোনাম', cell: (activity) => activity.titleBn },
    { header: 'ধরন', cell: (activity) => t(`activities.category.${activity.category}`) },
    { header: 'তারিখ', cell: (activity) => formatDate(activity.date, lang) },
  ];

  return (
    <ContentAdmin<Activity>
      title={t('admin.tab.activities')}
      description={t('admin.manageLead')}
      addLabel="নতুন কার্যক্রম"
      load={adminGetActivities}
      columns={columns}
      fields={fields}
      blank={{
        titleBn: '',
        titleEn: '',
        category: 'education',
        date: todayInput(),
        summaryBn: '',
        summaryEn: '',
        published: false,
      }}
      toForm={(activity) => ({
        titleBn: activity.titleBn,
        titleEn: activity.titleEn ?? '',
        category: activity.category,
        date: toLocalInput(activity.date).slice(0, 10),
        summaryBn: activity.summaryBn,
        summaryEn: activity.summaryEn ?? '',
        bodyBn: activity.bodyBn ?? '',
        bodyEn: activity.bodyEn ?? '',
        locationBn: activity.locationBn ?? '',
        coverImageUrl: activity.coverImageUrl ?? '',
        published: activity.published === true,
      })}
      save={(values, id) => saveContent('activities', values, id)}
      remove={(activity) => deleteContent('activities', activity.id, role)}
      publish={{
        isPublished: (activity) => activity.published === true,
        toggle: (activity) => setContentPublished('activities', activity.id, !activity.published, role),
      }}
      emptyTitle="এখনো কোনো কার্যক্রম যোগ করা হয়নি।"
    />
  );
}

export function AdminEvents() {
  const { t, lang, pick } = useI18n();
  const { role } = useAuth();

  const fields: FieldDef[] = [
    { name: 'titleBn', label: 'শিরোনাম (বাংলা)', required: true },
    { name: 'titleEn', label: 'শিরোনাম (English)' },
    { name: 'startAt', label: 'শুরু', type: 'datetime', required: true },
    { name: 'endAt', label: 'শেষ', type: 'datetime' },
    { name: 'venueBn', label: 'স্থান (বাংলা)' },
    { name: 'venueEn', label: 'স্থান (English)' },
    { name: 'descriptionBn', label: 'বিবরণ (বাংলা)', type: 'textarea' },
    { name: 'descriptionEn', label: 'বিবরণ (English)', type: 'textarea' },
    { name: 'registrationOpen', label: 'অনলাইন নিবন্ধন চালু', type: 'checkbox', wide: true },
    { name: 'published', label: 'ওয়েবসাইটে প্রকাশ করুন', type: 'checkbox', wide: true },
  ];

  const columns: ColumnDef<EventItem>[] = [
    { header: 'শিরোনাম', cell: (event) => pick(event.titleBn, event.titleEn) },
    { header: 'শুরু', cell: (event) => formatDate(event.startAt, lang) },
    { header: 'স্থান', cell: (event) => pick(event.venueBn, event.venueEn) || '—' },
  ];

  return (
    <ContentAdmin<EventItem>
      title={t('admin.tab.events')}
      description={t('admin.manageLead')}
      addLabel="নতুন কর্মসূচি"
      load={adminGetEvents}
      columns={columns}
      fields={fields}
      blank={{
        titleBn: '',
        titleEn: '',
        startAt: '',
        venueBn: '',
        venueEn: '',
        registrationOpen: false,
        published: false,
      }}
      toForm={(event) => ({
        titleBn: event.titleBn,
        titleEn: event.titleEn ?? '',
        startAt: toLocalInput(event.startAt),
        endAt: toLocalInput(event.endAt),
        venueBn: event.venueBn ?? '',
        venueEn: event.venueEn ?? '',
        descriptionBn: event.descriptionBn ?? '',
        descriptionEn: event.descriptionEn ?? '',
        registrationOpen: event.registrationOpen === true,
        published: event.published === true,
      })}
      save={(values, id) => saveContent('events', values, id)}
      remove={(event) => deleteContent('events', event.id, role)}
      publish={{
        isPublished: (event) => event.published === true,
        toggle: (event) => setContentPublished('events', event.id, !event.published, role),
      }}
      emptyTitle="এখনো কোনো কর্মসূচি যোগ করা হয়নি।"
    />
  );
}

export function AdminGallery() {
  const { t, lang, pick } = useI18n();
  const { role } = useAuth();

  const fields: FieldDef[] = [
    { name: 'titleBn', label: 'শিরোনাম (বাংলা)', required: true },
    { name: 'titleEn', label: 'শিরোনাম (English)' },
    { name: 'imageUrl', label: 'ছবি', type: 'image', required: true },
    { name: 'albumBn', label: 'অ্যালবাম', hint: 'যেমন বার্ষিক ক্রীড়া ২০২৬' },
    { name: 'takenAt', label: 'ছবি তোলার তারিখ', type: 'date' },
    { name: 'credit', label: 'কৃতজ্ঞতা', hint: 'ছবি যিনি তুলেছেন' },
    { name: 'published', label: 'ওয়েবসাইটে প্রকাশ করুন', type: 'checkbox', wide: true },
  ];

  const columns: ColumnDef<GalleryItem>[] = [
    { header: 'শিরোনাম', cell: (item) => pick(item.titleBn, item.titleEn) },
    { header: 'অ্যালবাম', cell: (item) => item.albumBn ?? '—' },
    { header: 'তারিখ', cell: (item) => (item.takenAt ? formatDate(item.takenAt, lang) : '—') },
  ];

  return (
    <ContentAdmin<GalleryItem>
      title={t('admin.tab.gallery')}
      description={t('admin.manageLead')}
      addLabel="নতুন ছবি"
      load={adminGetGallery}
      columns={columns}
      fields={fields}
      blank={{ titleBn: '', titleEn: '', imageUrl: '', albumBn: '', takenAt: '', credit: '', published: false }}
      toForm={(item) => ({
        titleBn: item.titleBn,
        titleEn: item.titleEn ?? '',
        imageUrl: item.imageUrl,
        albumBn: item.albumBn ?? '',
        takenAt: item.takenAt ?? '',
        credit: item.credit ?? '',
        published: item.published === true,
      })}
      save={(values: FormValues, id?: string | null) => saveContent('gallery', values, id)}
      remove={(item) => deleteContent('gallery', item.id, role)}
      publish={{
        isPublished: (item) => item.published === true,
        toggle: (item) => setContentPublished('gallery', item.id, !item.published, role),
      }}
      emptyTitle="এখনো কোনো ছবি যোগ করা হয়নি।"
    />
  );
}

export function AdminMessages() {
  const { t, lang } = useI18n();
  const { role, isSuperAdmin } = useAuth();
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useAsyncList(adminGetMessages, [version]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function toggleHandled(id: string, handled: boolean) {
    setBusyId(id);
    setNote('');
    try {
      await setMessageHandled(id, handled);
      setVersion((value) => value + 1);
      setNote(t('admin.saved'));
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    setBusyId(id);
    setNote('');
    try {
      await deleteMessage(id, role);
      setVersion((value) => value + 1);
      setNote(t('admin.deleted'));
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-lg font-bold text-brand-950">{t('admin.messages')}</h1>
        <p className="mt-1 text-xs text-slate-500">{t('admin.messagesLead')}</p>
      </div>
      {note && <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-900">{note}</p>}
      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="card p-5 text-sm text-slate-500">{t('admin.noMessages')}</div>
      ) : (
        <ul className="space-y-2.5">
          {data.map((message) => (
            <li key={message.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-brand-950">{message.name}</p>
                  <p className="mt-0.5 text-sm text-slate-700">{message.subject}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {message.createdAt ? formatDate(message.createdAt, lang) : ''}
                    {message.phone ? ` • ${message.phone}` : ''}
                    {message.email ? ` • ${message.email}` : ''}
                  </p>
                </div>
                <Badge tone={message.handled ? 'green' : 'amber'}>
                  {message.handled ? t('admin.handled') : t('admin.pending')}
                </Badge>
              </div>
              {openId === message.id && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {message.message}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === message.id ? null : message.id)}>
                  {openId === message.id ? t('nav.close') : t('admin.viewMessage')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === message.id}
                  onClick={() => void toggleHandled(message.id, !message.handled)}
                >
                  {message.handled ? t('admin.markPending') : t('admin.markHandled')}
                </Button>
                {isSuperAdmin && (
                  <Button size="sm" variant="danger" disabled={busyId === message.id} onClick={() => void remove(message.id)}>
                    {t('admin.delete')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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
