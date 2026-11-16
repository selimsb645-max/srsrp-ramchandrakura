import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n';
import { initials } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getMembers } from '@/services/publicData';
import { submitApplication } from '@/services/applicationService';
import { uploadDocuments } from '@/services/documentService';
import { FileField } from '@/components/shared/FileField';
import { BackendNotConfiguredError, isFirebaseConfigured } from '@/lib/firebase';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Field';
import { BackendNotice } from '@/components/shared/BackendNotice';
import { Spinner } from '@/components/ui/Spinner';

export function MembersPage() {
  const { t, lang } = useI18n();
  const { data, loading, configured } = useAsyncList(getMembers);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [eduCert, setEduCert] = useState<File | null>(null);
  const [nidCopy, setNidCopy] = useState<File | null>(null);
  const [birthCert, setBirthCert] = useState<File | null>(null);
  const [boardCerts, setBoardCerts] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);

  const fileAccept = 'image/jpeg,image/png,image/webp,application/pdf';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setErrorMessage('');

    const facebookUrl = String(formData.get('facebookUrl') ?? '').trim();
    if (!/facebook\.com\//i.test(facebookUrl)) {
      setStatus('error');
      setErrorMessage(t('register.facebookInvalid'));
      return;
    }
    if (!photo || !eduCert || !birthCert) {
      setStatus('error');
      setErrorMessage(t('register.docsRequired'));
      return;
    }
    if (!consent) {
      setStatus('error');
      setErrorMessage(t('register.consentRequired'));
      return;
    }

    setStatus('sending');
    try {
      const documents = await uploadDocuments([
        { file: photo, label: 'ছবি' },
        { file: eduCert, label: 'শিক্ষা প্রতিষ্ঠানের প্রত্যয়নপত্র / পরিচয়পত্র' },
        ...(nidCopy ? [{ file: nidCopy, label: 'জাতীয় পরিচয়পত্রের কপি' }] : []),
        { file: birthCert, label: 'জন্মসনদের কপি' },
        ...boardCerts.map((file, index) => ({ file, label: `বোর্ড পরীক্ষার সনদ ${index + 1}` })),
      ]);

      await submitApplication({
        fullName: String(formData.get('nameBn') ?? ''),
        guardianName: String(formData.get('guardianName') ?? ''),
        dateOfBirth: String(formData.get('dateOfBirth') ?? ''),
        school: String(formData.get('school') ?? ''),
        className: String(formData.get('className') ?? ''),
        ward: String(formData.get('ward') ?? ''),
        village: String(formData.get('village') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        email: String(formData.get('email') ?? ''),
        motivation: String(formData.get('motivation') ?? ''),
        facebookUrl,
        documents,
        uid: undefined,
      });
      form.reset();
      setPhoto(null);
      setEduCert(null);
      setNidCopy(null);
      setBirthCert(null);
      setBoardCerts([]);
      setConsent(false);
      setStatus('sent');
    } catch (error) {
      setStatus('error');
      const reason = (error as Error).message;
      if (reason === 'DOC_TOO_BIG') setErrorMessage(t('register.docTooBig'));
      else if (reason.startsWith('DOC_')) setErrorMessage(t('register.docFailed'));
      else
        setErrorMessage(
          error instanceof BackendNotConfiguredError ? t('auth.notConfiguredBody') : t('common.error'),
        );
    }
  }

  return (
    <>
      <PageHero title={t('members.title')} description={t('members.lead')} />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
          <div>
            <SectionHeading
              title={`${t('members.count')}${data.length > 0 ? ` — ${data.length}` : ''}`}
              description={t('members.privacy')}
            />
            {!configured && <div className="mb-4"><BackendNotice compact /></div>}
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((key) => (
                  <div key={key} className="skeleton h-14 w-full" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <EmptyState title={t('members.empty')} body={t('placeholder.body')} />
            ) : (
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {data.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {initials(member.nameBn)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-800">{member.nameBn}</p>
                      <p className="text-xs text-slate-500">
                        {member.village ? `${member.village} • ` : ''}
                        {member.ward ? (lang === 'bn' ? `${member.ward} নং ওয়ার্ড` : `Ward ${member.ward}`) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <section id="join" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-950">{t('members.joinTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('members.joinLead')}</p>

            {!isFirebaseConfigured ? (
              <div className="mt-4"><BackendNotice /></div>
            ) : status === 'sent' ? (
              <div className="mt-4 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm text-leaf-800">
                {lang === 'bn' ? 'আবেদন জমা হয়েছে। কমিটি যাচাই করে যোগাযোগ করবে।' : 'Application submitted. The committee will review it.'}
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="nameBn">{lang === 'bn' ? 'পূর্ণ নাম' : 'Full name'}</Label>
                  <Input id="nameBn" name="nameBn" required autoComplete="name" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="guardianName">{lang === 'bn' ? 'পিতা/মাতার নাম' : "Guardian's name"}</Label>
                    <Input id="guardianName" name="guardianName" />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">{lang === 'bn' ? 'জন্ম তারিখ' : 'Date of birth'}</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="school">{lang === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'School'}</Label>
                    <Input id="school" name="school" required />
                  </div>
                  <div>
                    <Label htmlFor="className">{lang === 'bn' ? 'শ্রেণি' : 'Class'}</Label>
                    <Input id="className" name="className" required />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="village">{lang === 'bn' ? 'গ্রাম' : 'Village'}</Label>
                    <Input id="village" name="village" required />
                  </div>
                  <div>
                    <Label htmlFor="ward">{lang === 'bn' ? 'ওয়ার্ড নম্বর' : 'Ward no.'}</Label>
                    <Input id="ward" name="ward" inputMode="numeric" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">{lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile number'}</Label>
                  <Input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <Label htmlFor="email" hint={t('common.optional')}>
                    {t('auth.email')}
                  </Label>
                  <Input id="email" name="email" type="email" autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="motivation" hint={t('common.optional')}>
                    {lang === 'bn' ? 'কেন সদস্য হতে চান' : 'Why do you want to join'}
                  </Label>
                  <Textarea id="motivation" name="motivation" rows={3} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">
                    {lang === 'bn' ? 'প্রয়োজনীয় কাগজপত্র (নোটিশ অনুযায়ী)' : 'Required documents (per the notice)'}
                  </p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label htmlFor="join-facebook">{lang === 'bn' ? 'ফেসবুক আইডি লিংক' : 'Facebook profile link'}</Label>
                      <Input id="join-facebook" name="facebookUrl" required placeholder="https://facebook.com/your.profile" />
                    </div>
                    <FileField id="join-photo" label={lang === 'bn' ? 'নিজের ১ কপি ছবি' : 'One photo'} accept="image/jpeg,image/png,image/webp" required onChange={(files) => setPhoto(files[0] ?? null)} />
                    <FileField id="join-edu" label={lang === 'bn' ? 'শিক্ষা প্রতিষ্ঠানের প্রত্যয়নপত্র / পরিচয়পত্র' : 'School certificate or ID'} accept={fileAccept} required onChange={(files) => setEduCert(files[0] ?? null)} />
                    <FileField id="join-birth" label={lang === 'bn' ? 'জন্মসনদের কপি' : 'Birth certificate copy'} accept={fileAccept} required onChange={(files) => setBirthCert(files[0] ?? null)} />
                    <FileField id="join-nid" label={lang === 'bn' ? 'জাতীয় পরিচয়পত্রের কপি' : 'NID copy'} hint={lang === 'bn' ? '১৮ বছরের কম হলে লাগবে না' : 'Not needed under 18'} accept={fileAccept} onChange={(files) => setNidCopy(files[0] ?? null)} />
                    <FileField id="join-board" label={lang === 'bn' ? 'সকল বোর্ড পরীক্ষার সনদ' : 'Board exam certificates'} hint={lang === 'bn' ? 'একাধিক ফাইল বাছাই করা যায়' : 'Multiple files allowed'} accept={fileAccept} multiple onChange={setBoardCerts} />
                  </div>
                  <label className="mt-3 flex items-start gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4" />
                    <span>{t('register.consent')}</span>
                  </label>
                </div>
                {status === 'error' && <p className="text-sm text-rose-600">{errorMessage || t('common.error')}</p>}
                <Button type="submit" full disabled={status === 'sending'}>
                  {status === 'sending' ? <Spinner className="h-4 w-4" /> : null}
                  {t('common.submit')}
                </Button>
                <p className="text-xs text-slate-400">{t('members.privacy')}</p>
              </form>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}
