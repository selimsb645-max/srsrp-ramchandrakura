import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { BackendNotice } from '@/components/shared/BackendNotice';

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'limit'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    try {
      await resetPassword(email.trim());
      setState('sent');
    } catch (error) {
      setState(error instanceof Error && error.message === 'RESET_LIMIT' ? 'limit' : 'error');
    }
  }

  return (
    <section className="flex min-h-dvh items-center bg-slate-50 py-10">
      <Container className="max-w-md">
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-brand-950">{t('auth.resetTitle')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('auth.resetLead')}</p>

          {!configured ? (
            <div className="mt-5"><BackendNotice /></div>
          ) : state === 'sent' ? (
            <div className="mt-5 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm text-leaf-800">
              {t('auth.resetSent')}
            </div>
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
              {state === 'error' && <p className="text-sm text-rose-600">{t('auth.resetError')}</p>}
              {state === 'limit' && <p className="text-sm text-amber-700">{t('auth.resetLimit')}</p>}
              <Button type="submit" full disabled={state === 'sending'}>
                {state === 'sending' ? <Spinner className="h-4 w-4" /> : null}
                {t('common.submit')}
              </Button>
            </form>
          )}

          <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-brand-800 hover:underline">
            ← {t('auth.signIn')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
