import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { site } from '@/config/site';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/shared/Logo';

/**
 * Landing screen for accounts that exist but are not approved yet.
 * This is the client-side mirror of the rule "only approved members read the portal".
 */
export function PendingApprovalPage() {
  const { t, lang } = useI18n();
  const { profile, user, status, refreshProfile, signOutUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="min-h-dvh bg-slate-50 py-10">
      <Container className="max-w-xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 7v6M12 16.5h.01" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-950">
            {status === 'suspended' ? t('pending.suspendedTitle') : t('pending.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {status === 'suspended' ? t('pending.suspendedBody') : t('pending.body')}
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm">
            <p className="text-slate-500">{t('pending.account')}</p>
            <p className="font-semibold text-slate-800">{profile?.nameBn ?? user?.displayName ?? '—'}</p>
            <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2">
              <Badge tone={status === 'pending' ? 'amber' : 'rose'}>
                {status === 'pending' ? t('member.status.pending') : t('member.status.suspended')}
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => void handleRefresh()} disabled={refreshing}>
              {refreshing ? t('common.loading') : t('pending.refresh')}
            </Button>
            <Button variant="outline" onClick={() => void signOutUser()}>
              {t('nav.logout')}
            </Button>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            {lang === 'bn' ? 'অনুমোদনের জন্য যোগাযোগ করুন: ' : 'For approval, contact: '}
            <a href={site.links.officialFacebook} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 hover:underline">
              {lang === 'bn' ? 'অফিসিয়াল পেজ' : 'official page'}
            </a>
          </p>
          <Link to="/" className="mt-3 inline-block text-sm font-semibold text-brand-800 hover:underline">
            ← {t('notFound.home')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
