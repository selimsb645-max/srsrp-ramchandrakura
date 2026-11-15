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

    setSubmitting(true);
    setError('');
    try {
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
      });
      navigate('/pending', { replace: true });
    } catch (err) {
      setError(messageFor((err as { code?: string }).code ?? '', t));
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

          {!configured ? (
            <div className="mt-5"><BackendNotice /></div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="nameBn">{lang === 'bn' ? 'পূর্ণ নাম' : 'Full name'}</Label>
                <Input id="nameBn" name="nameBn" required autoComplete="name" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="phone">{lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile number'}</Label>
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
                  <Label htmlFor="dateOfBirth" hint={t('common.optional')}>
                    {lang === 'bn' ? 'জন্ম তারিখ' : 'Date of birth'}
                  </Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="school" hint={t('common.optional')}>
                    {lang === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'School'}
                  </Label>
                  <Input id="school" name="school" />
                </div>
                <div>
                  <Label htmlFor="className" hint={t('common.optional')}>
                    {lang === 'bn' ? 'শ্রেণি' : 'Class'}
                  </Label>
                  <Input id="className" name="className" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="village" hint={t('common.optional')}>
                    {lang === 'bn' ? 'গ্রাম' : 'Village'}
                  </Label>
                  <Input id="village" name="village" />
                </div>
                <div>
                  <Label htmlFor="ward" hint={t('common.optional')}>
                    {lang === 'bn' ? 'ওয়ার্ড নম্বর' : 'Ward no.'}
                  </Label>
                  <Input id="ward" name="ward" inputMode="numeric" />
                </div>
              </div>

              <div>
                <Label htmlFor="motivation" hint={t('common.optional')}>
                  {lang === 'bn' ? 'কেন সদস্য হতে চান' : 'Why do you want to join'}
                </Label>
                <Textarea id="motivation" name="motivation" rows={3} />
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
