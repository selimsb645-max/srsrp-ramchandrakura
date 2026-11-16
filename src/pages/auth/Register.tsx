import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { Logo } from '@/components/shared/Logo';
import { BackendNotice } from '@/components/shared/BackendNotice';
import { uploadDocuments } from '@/services/documentService';
import { FileField } from '@/components/shared/FileField';

function messageFor(code: string, t: (key: string) => string): string {
  if (code.includes('email-already-in-use')) return t('register.emailInUse');
  if (code.includes('weak-password')) return t('register.weakPassword');
  if (code.includes('invalid-email')) return t('register.invalidEmail');
  if (code.includes('too-many-requests')) return t('auth.tooMany');
  return t('common.error');
}

export function RegisterPage() {
  const { t, lang } = useI18n();
  const { register, configured } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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
    const data = new FormData(form);
    const password = String(data.get('password') ?? '');
    const confirm = String(data.get('confirm') ?? '');

    if (password !== confirm) {
      setError(t('register.passwordMismatch'));
      return;
    }

    const facebookUrl = String(data.get('facebookUrl') ?? '').trim();
    if (!/facebook\.com\//i.test(facebookUrl)) {
      setError(t('register.facebookInvalid'));
      return;
    }
    if (!photo || !eduCert || !birthCert) {
      setError(t('register.docsRequired'));
      return;
    }
    if (!consent) {
      setError(t('register.consentRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // কাগজপত্র আগে আপলোড হয়; কোনো ফাইল ব্যর্থ হলে অ্যাকাউন্টই তৈরি হয় না।
      const documents = await uploadDocuments([
        { file: photo, label: 'ছবি' },
        { file: eduCert, label: 'শিক্ষা প্রতিষ্ঠানের প্রত্যয়নপত্র / পরিচয়পত্র' },
        ...(nidCopy ? [{ file: nidCopy, label: 'জাতীয় পরিচয়পত্রের কপি' }] : []),
        { file: birthCert, label: 'জন্মসনদের কপি' },
        ...boardCerts.map((file, index) => ({ file, label: `বোর্ড পরীক্ষার সনদ ${index + 1}` })),
      ]);

      await register({
        nameBn: String(data.get('nameBn') ?? ''),
        email: String(data.get('email') ?? ''),
        password,
        phone: String(data.get('phone') ?? ''),
        guardianName: String(data.get('guardianName') ?? ''),
        dateOfBirth: String(data.get('dateOfBirth') ?? ''),
        school: String(data.get('school') ?? ''),
        className: String(data.get('className') ?? ''),
        ward: String(data.get('ward') ?? ''),
        village: String(data.get('village') ?? ''),
        motivation: String(data.get('motivation') ?? ''),
        facebookUrl,
        nidNumber: String(data.get('nidNumber') ?? '').trim(),
        documents,
      });
      navigate('/pending', { replace: true });
    } catch (err) {
      const reason = (err as Error).message;
      if (reason === 'DOC_TOO_BIG') setError(t('register.docTooBig'));
      else if (reason.startsWith('DOC_')) setError(t('register.docFailed'));
      else setError(messageFor((err as { code?: string }).code ?? '', t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-brand-50 py-10">
      <Container className="max-w-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-brand-950">{t('register.title')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('register.lead')}</p>
          <p className="mt-1 text-xs text-rose-600">
            {lang === 'bn' ? '* চিহ্নিত ঘরগুলো অবশ্যই পূরণ করতে হবে।' : '* marked fields are required.'}
          </p>

          {!configured ? (
            <div className="mt-5"><BackendNotice /></div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="nameBn">{(lang === 'bn' ? 'পূর্ণ নাম' : 'Full name') + ' *'}</Label>
                <Input id="nameBn" name="nameBn" required autoComplete="name" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">{t('auth.email') + ' *'}</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="phone">{(lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile number') + ' *'}</Label>
                  <Input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
                </div>
                <div>
                  <Label htmlFor="confirm">{t('register.confirmPassword')}</Label>
                  <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="guardianName" hint={t('common.optional')}>
                    {lang === 'bn' ? 'পিতা/মাতার নাম' : "Guardian's name"}
                  </Label>
                  <Input id="guardianName" name="guardianName" />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">
                    {(lang === 'bn' ? 'জন্ম তারিখ' : 'Date of birth') + ' *'}
                  </Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="school">
                    {(lang === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'School') + ' *'}
                  </Label>
                  <Input id="school" name="school" required />
                </div>
                <div>
                  <Label htmlFor="className">
                    {(lang === 'bn' ? 'শ্রেণি' : 'Class') + ' *'}
                  </Label>
                  <Input id="className" name="className" required />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="village">
                    {(lang === 'bn' ? 'গ্রাম' : 'Village') + ' *'}
                  </Label>
                  <Input id="village" name="village" required />
                </div>
                <div>
                  <Label htmlFor="ward">
                    {(lang === 'bn' ? 'ওয়ার্ড নম্বর' : 'Ward no.') + ' *'}
                  </Label>
                  <Input id="ward" name="ward" inputMode="numeric" required />
                </div>
              </div>

              <div>
                <Label htmlFor="motivation" hint={t('common.optional')}>
                  {lang === 'bn' ? 'কেন সদস্য হতে চান' : 'Why do you want to join'}
                </Label>
                <Textarea id="motivation" name="motivation" rows={3} />
              </div>

              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="font-display text-base font-bold text-brand-950">
                  {lang === 'bn' ? 'প্রয়োজনীয় কাগজপত্র' : 'Required documents'}
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {lang === 'bn'
                    ? 'ছবি ও PDF আকারে দিন (প্রতিটি ফাইল সর্বোচ্চ ৩ MB)। এই কাগজপত্র শুধু কমিটি যাচাইয়ের জন্য দেখবে, ওয়েবসাইটে প্রকাশ হবে না।'
                    : 'Images or PDF, up to 3 MB each. Only the committee sees these for verification; they are never published.'}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="facebookUrl">{(lang === 'bn' ? 'ফেসবুক আইডি লিংক' : 'Facebook profile link') + ' *'}</Label>
                    <Input id="facebookUrl" name="facebookUrl" required placeholder="https://facebook.com/your.profile" />
                  </div>
                  <div>
                    <Label htmlFor="nidNumber" hint={t('common.optional')}>
                      {lang === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর' : 'NID number'}
                    </Label>
                    <Input id="nidNumber" name="nidNumber" inputMode="numeric" />
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <FileField id="photo" label={lang === 'bn' ? 'নিজের ১ কপি ছবি' : 'One photo'} accept="image/jpeg,image/png,image/webp" required onChange={(files) => setPhoto(files[0] ?? null)} />
                  <FileField id="eduCert" label={lang === 'bn' ? 'শিক্ষা প্রতিষ্ঠানের প্রত্যয়নপত্র / পরিচয়পত্র' : 'School certificate or ID'} accept={fileAccept} required onChange={(files) => setEduCert(files[0] ?? null)} />
                  <FileField id="birthCert" label={lang === 'bn' ? 'জন্মসনদের কপি' : 'Birth certificate copy'} accept={fileAccept} required onChange={(files) => setBirthCert(files[0] ?? null)} />
                  <FileField id="nidCopy" label={lang === 'bn' ? 'জাতীয় পরিচয়পত্রের কপি' : 'NID copy'} hint={lang === 'bn' ? '১৮ বছরের কম হলে লাগবে না' : 'Not needed under 18'} accept={fileAccept} onChange={(files) => setNidCopy(files[0] ?? null)} />
                  <FileField id="boardCerts" label={lang === 'bn' ? 'সকল বোর্ড পরীক্ষার সনদ' : 'Board exam certificates'} hint={lang === 'bn' ? 'একাধিক ফাইল বাছাই করা যায়' : 'Multiple files allowed'} accept={fileAccept} multiple onChange={setBoardCerts} />
                </div>

                <label className="mt-4 flex items-start gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4" />
                  <span>{t('register.consent')}</span>
                </label>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <Button type="submit" full disabled={submitting}>
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                {t('register.submit')}
              </Button>

              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">{t('register.approvalNote')}</p>

              <p className="text-center text-sm text-slate-600">
                {t('register.haveAccount')}{' '}
                <Link to="/login" className="font-semibold text-brand-800 hover:underline">
                  {t('auth.signIn')}
                </Link>
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
