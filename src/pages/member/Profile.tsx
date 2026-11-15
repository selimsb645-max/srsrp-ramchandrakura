import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { updateOwnContact, updateOwnProfile } from '@/services/userService';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { Placeholder } from '@/components/ui/Placeholder';

/**
 * Members can edit their own contact details only.
 * Role, status, member code and the public listing flag are not editable here —
 * firestore.rules would reject them from a member session anyway.
 */
export function MemberProfilePage() {
  const { t, lang } = useI18n();
  const { user, profile, contact, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nameBn: '',
    phone: '',
    guardianName: '',
    village: '',
    ward: '',
    school: '',
    className: '',
  });

  useEffect(() => {
    setForm({
      nameBn: profile?.nameBn ?? '',
      phone: contact?.phone ?? '',
      guardianName: contact?.guardianName ?? '',
      village: profile?.village ?? '',
      ward: profile?.ward ?? '',
      school: profile?.school ?? '',
      className: profile?.className ?? '',
    });
  }, [profile, contact]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateOwnProfile(user.uid, {
        nameBn: form.nameBn,
        village: form.village,
        ward: form.ward,
        school: form.school,
        className: form.className,
      });
      await updateOwnContact(user.uid, { phone: form.phone, guardianName: form.guardianName });
      await refreshProfile();
      setMessage(t('member.saveOk'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <Placeholder title={t('member.notVerified')} body={t('auth.noAccount')} />;
  }

  return (
    <form className="card max-w-2xl space-y-4 p-5 sm:p-6" onSubmit={handleSubmit}>
      <div>
        <h2 className="font-display text-lg font-bold text-brand-950">{t('member.profile')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('member.profileLead')}</p>
      </div>

      <div>
        <Label htmlFor="nameBn">{lang === 'bn' ? 'পূর্ণ নাম' : 'Full name'}</Label>
        <Input id="nameBn" value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} required />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">{t('contact.phone')}</Label>
          <Input id="phone" inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="guardianName">{lang === 'bn' ? 'পিতা/মাতার নাম' : "Guardian's name"}</Label>
          <Input
            id="guardianName"
            value={form.guardianName}
            onChange={(event) => setForm({ ...form, guardianName: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="school">{lang === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'School'}</Label>
          <Input id="school" value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="className">{lang === 'bn' ? 'শ্রেণি' : 'Class'}</Label>
          <Input id="className" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="village">{lang === 'bn' ? 'গ্রাম' : 'Village'}</Label>
          <Input id="village" value={form.village} onChange={(event) => setForm({ ...form, village: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="ward">{lang === 'bn' ? 'ওয়ার্ড' : 'Ward'}</Label>
          <Input id="ward" inputMode="numeric" value={form.ward} onChange={(event) => setForm({ ...form, ward: event.target.value })} />
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        {t('auth.email')}: {contact?.email ?? user?.email ?? '—'} • {t('member.status')}: {t(`member.status.${profile.status}`)}
        {profile.memberCode ? ` • ID: ${profile.memberCode}` : ''}
      </div>
      <p className="text-xs text-slate-400">{t('members.privacy')}</p>

      {message && <p className="text-sm font-medium text-leaf-700">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? <Spinner className="h-4 w-4" /> : null}
        {t('common.save')}
      </Button>
    </form>
  );
}
