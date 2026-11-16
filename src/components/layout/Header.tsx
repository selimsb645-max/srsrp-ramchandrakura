import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { publicNav, site } from '@/config/site';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/shared/Logo';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export function Header() {
  const { t, lang } = useI18n();
  const { user, isAdmin, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const desktopNav = publicNav.slice(1);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="bg-brand-950 text-white">
        <Container className="flex min-h-[26px] items-center justify-between gap-3 py-1">
          <p className="truncate text-[10.5px] font-medium tracking-wide text-brand-100 sm:text-[11.5px]">
            {lang === 'bn' ? site.organization.taglineBn : site.organization.taglineEn}
          </p>
          <p className="hidden shrink-0 text-[10.5px] font-semibold tracking-wide text-leaf-200 sm:block sm:text-[11.5px]">
            {lang === 'bn' ? site.organization.approvedByBn : site.organization.approvedByEn}
          </p>
        </Container>
      </div>
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {desktopNav.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition',
                  isActive ? 'bg-brand-50 text-brand-900' : 'text-slate-600 hover:bg-slate-50 hover:text-brand-900',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <LanguageToggle />
          {user ? (
            <>
              <ButtonLink to={isAdmin ? '/admin' : '/portal'} size="sm" variant="outline">
                {isAdmin ? t('nav.admin') : t('nav.portal')}
              </ButtonLink>
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-slate-500 hover:text-rose-600"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <ButtonLink to="/login" size="sm">
              {t('nav.login')}
            </ButtonLink>
          )}
        </div>

        <div className="flex items-center gap-1.5 xl:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t('nav.close') : t('nav.menu')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-brand-900"
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white xl:hidden sm:top-[72px]">
          <Container className="py-4">
            <nav className="flex flex-col" aria-label="Mobile">
              {publicNav.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-3 py-3 text-[15px] font-semibold',
                      isActive ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50',
                    )
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-200 pt-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  <ButtonLink to={isAdmin ? '/admin' : '/portal'} full>
                    {isAdmin ? t('nav.admin') : t('nav.portal')}
                  </ButtonLink>
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <ButtonLink to="/login" full>
                  {t('nav.login')}
                </ButtonLink>
              )}
              <p className="mt-4 text-center text-xs text-slate-400">
                <Link to="/about" className="hover:text-brand-700">
                  {t('footer.builtNote')}
                </Link>
              </p>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
