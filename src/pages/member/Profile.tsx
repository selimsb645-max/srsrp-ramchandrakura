import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { updateOwnContact, updateOwnProfile } from '@/services/userService';
import { changeMyPassword, updateOwnPhoto } from '@/services/memberService';
import { documentUrl, uploadDocument } from '@/services/documentService';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { Placeholder } from '@/components/ui/Placeholder';

/**
 * সদস্য নিজের তথ্য, ছবি আর পাসওয়ার্ড বদলাতে পারেন।
 * ভূমিকা, স্ট্যাটাস, সদস্য নম্বর ও প্রকাশের অনুমতি এখানে নেই — firestore.rules
 * সদস্যের সেশন থেকে এগুলো বদলাতে দেয় না।
 */
export function MemberProfilePage() {
  const { t, lang } = useI18n();
  const { user, profile, contact, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoNote, setPhotoNote] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNote, setPwNote] = useState('');
  const [pwError, setPwError] = useState('');

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

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setPhotoBusy(true);
    setPhotoNote('');
    try {
      const stored = await uploadDocument(file, 'প্রোফাইল ছবি');
      await updateOwnPhoto(user.uid, documentUrl(stored.key));
      await refreshProfile();
      setPhotoNote(t('member.photo.ok'));
    } catch (err) {
      const code = (err as Error).message;
      setPhotoNote(code === 'DOC_TOO_BIG' ? 'ছবিটি ৩ MB-এর চেয়ে বড়।' : t('common.error'));
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError('');
    setPwNote('');
    if (pw.next.length < 6) {
      setPwError(t('member.password.weak'));
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError(t('member.password.mismatch'));
      return;
    }
    setPwBusy(true);
    try {
      await changeMyPassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwNote(t('member.password.ok'));
    } catch (err) {
      const code = (err as Error).message;
      setPwError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? t('member.password.wrong')
          : code === 'WEAK_PASSWORD'
            ? t('member.password.weak')
            : t('common.error'),
      );
    } finally {
      setPwBusy(false);
    }
  }

  if (!profile) {
    return <Placeholder title={t('member.notVerified')} body={t('auth.noAccount')} />;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold text-brand-950">{t('member.photo.title')}</h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.nameBn} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                {profile.nameBn.slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600">{t('member.photo.lead')}</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50">
              {photoBusy ? <Spinner className="h-4 w-4" /> : null}
              {t('member.photo.choose')}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {photoNote && <p className="mt-2 text-sm font-medium text-leaf-700">{photoNote}</p>}
          </div>
        </div>
      </section>

      <form className="card space-y-4 p-5 sm:p-6" onSubmit={handleSubmit}>
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

      <form className="card space-y-3 p-5 sm:p-6" onSubmit={handlePassword}>
        <div>
          <h2 className="font-display text-lg font-bold text-brand-950">{t('member.password.title')}</h2>
          <p className="mt-1 text-sm text-slate-600">{t('member.password.lead')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="pw-current">{t('member.password.current')}</Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(event) => setPw({ ...pw, current: event.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="pw-next">{t('member.password.new')}</Label>
            <Input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              value={pw.next}
              onChange={(event) => setPw({ ...pw, next: event.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="pw-confirm">{t('member.password.confirm')}</Label>
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(event) => setPw({ ...pw, confirm: event.target.value })}
              required
            />
          </div>
        </div>
        {pwNote && <p className="text-sm font-medium text-leaf-700">{pwNote}</p>}
        {pwError && <p className="text-sm text-rose-600">{pwError}</p>}
        <Button type="submit" variant="outline" disabled={pwBusy}>
          {pwBusy ? <Spinner className="h-4 w-4" /> : null}
          {t('member.password.title')}
        </Button>
      </form>
    </div>
  );
}
