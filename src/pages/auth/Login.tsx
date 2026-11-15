import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { Logo } from '@/components/shared/Logo';
import { BackendNotice } from '@/components/shared/BackendNotice';

function messageFor(code: string, t: (key: string) => string): string {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return t('auth.invalid');
  }
  if (code.includes('too-many-requests')) return t('auth.tooMany');
  return t('common.error');
}

export function LoginPage() {
  const { t } = useI18n();
  const { signIn, configured, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      navigate(from ?? (isAdmin ? '/admin' : '/portal'), { replace: true });
    } catch (err) {
      setError(messageFor((err as { code?: string }).code ?? '', t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-dvh items-center bg-gradient-to-br from-slate-50 via-white to-brand-50 py-10">
      <Container className="max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-brand-950">{t('auth.loginTitle')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('auth.loginLead')}</p>

          {!configured ? (
            <div className="mt-5"><BackendNotice /></div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button type="submit" full disabled={submitting}>
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                {submitting ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="font-semibold text-brand-800 hover:underline">
                  {t('auth.forgot')}
                </Link>
                <Link to="/" className="text-slate-500 hover:text-brand-800">
                  {t('common.back')}
                </Link>
              </div>
            </form>
          )}

          <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">{t('auth.noAccount')}</p>
        </div>
        {user && (
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link to={isAdmin ? '/admin' : '/portal'} className="font-semibold text-brand-800 hover:underline">
              {t('nav.portal')} →
            </Link>
          </p>
        )}
      </Container>
    </section>
  );
}
