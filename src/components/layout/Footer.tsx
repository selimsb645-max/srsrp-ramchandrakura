import { Link } from 'react-router-dom';
import { publicNav, site } from '@/config/site';
import { useI18n } from '@/i18n';
import { isPlaceholder, safeExternalUrl } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/shared/Logo';

export function Footer() {
  const { t, lang } = useI18n();
  const year = new Date().getFullYear();
  const fb = safeExternalUrl(site.links.officialFacebook);
  const address = lang === 'bn' ? site.contact.addressBn : site.contact.addressEn;

  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-950 text-brand-100">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="rounded-2xl bg-white/95 p-3">
            <Logo />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-brand-200">{t('footer.builtNote')}</p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-white">
            {t('footer.quickLinks')}
          </h2>
          <ul className="space-y-2 text-sm">
            {publicNav.slice(1, 6).map((item) => (
              <li key={item.key}>
                <Link to={item.to} className="text-brand-200 transition hover:text-white">
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-white">
            {t('footer.portalLinks')}
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/login" className="text-brand-200 transition hover:text-white">
                {t('nav.login')}
              </Link>
            </li>
            <li>
              <Link to="/portal" className="text-brand-200 transition hover:text-white">
                {t('nav.portal')}
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-brand-200 transition hover:text-white">
                {t('nav.admin')}
              </Link>
            </li>
            <li>
              <Link to="/members#join" className="text-brand-200 transition hover:text-white">
                {t('members.joinTitle')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-white">
            {t('footer.contact')}
          </h2>
          <ul className="space-y-2 text-sm text-brand-200">
            <li>{address}</li>
            <li>{isPlaceholder(site.contact.phone) ? `«${t('common.pending')}»` : site.contact.phone}</li>
            <li>{isPlaceholder(site.contact.email) ? `«${t('common.pending')}»` : site.contact.email}</li>
          </ul>
          {fb && (
            <a
              href={fb}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.5 21v-7h2.4l.4-2.9h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.2c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.2H8.2V14h2.3v7h3z" />
              </svg>
              {t('footer.follow')}
            </a>
          )}
        </div>
      </Container>

      <div className="border-t border-white/10 py-5">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-brand-300 sm:flex-row">
          <p>
            © {year} {site.organization.nameBn} — {site.organization.branchBn}. {t('footer.rights')}.
          </p>
          <p>{site.organization.parentBn}</p>
        </Container>
      </div>
    </footer>
  );
}
