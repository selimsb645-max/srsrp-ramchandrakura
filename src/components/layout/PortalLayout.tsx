import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/shared/Logo';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { BackButton } from '@/components/shared/BackButton';

interface PortalTab {
  to: string;
  labelKey: string;
  end?: boolean;
}

/** Shell for the member portal and admin dashboard (same visual language as the site). */
export function PortalLayout({ titleKey, tabs }: { titleKey: string; tabs: PortalTab[] }) {
  const { t } = useI18n();
  const { profile, isAdmin, signOutUser } = useAuth();

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {isAdmin && (
              <NavLink
                to="/admin"
                className="hidden rounded-lg px-2.5 py-2 text-[13px] font-semibold text-slate-600 hover:text-brand-900 sm:block"
              >
                {t('nav.admin')}
              </NavLink>
            )}
            <NavLink
              to="/portal"
              className="hidden rounded-lg px-2.5 py-2 text-[13px] font-semibold text-slate-600 hover:text-brand-900 sm:block"
            >
              {t('nav.portal')}
            </NavLink>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:text-rose-600"
            >
              {t('nav.logout')}
            </button>
          </div>
        </Container>
      </header>

      <Container className="py-6 sm:py-8">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold text-brand-950 sm:text-3xl">{t(titleKey)}</h1>
          {profile && <p className="text-sm text-slate-500">{profile.nameBn}</p>}
        </div>

        <nav className="mb-6 flex gap-1 overflow-x-auto pb-1" aria-label="Portal">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition',
                  isActive ? 'bg-brand-800 text-white shadow-soft' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-900',
                )
              }
            >
              {t(tab.labelKey)}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </Container>
    </div>
  );
}
