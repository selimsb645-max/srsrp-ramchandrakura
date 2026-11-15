import { useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '@/config/site';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Organization logo.
 * Uses the official logo image from /public/brand unless it cannot be loaded, in which
 * case a neutral text mark is shown (no invented artwork).
 */
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  const { lang } = useI18n();
  const [failed, setFailed] = useState(false);

  return (
    <Link to="/" className={cn('group flex items-center gap-3', className)} aria-label={site.organization.nameBn}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-soft ring-1 ring-brand-100 sm:h-12 sm:w-12">
        {failed ? (
          <span className="font-display text-sm font-bold text-brand-800">শেরা</span>
        ) : (
          <img
            src={site.brand.logo}
            alt={lang === 'bn' ? site.brand.logoAltBn : site.brand.logoAltEn}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </span>
      {withText && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-display text-[15px] font-bold text-brand-950 sm:text-base">
            {site.organization.nameBn}
          </span>
          <span className="block truncate text-[11px] font-medium text-slate-500 sm:text-xs">
            {site.organization.branchBn} • {lang === 'bn' ? 'নালিতাবাড়ী, শেরপুর' : 'Nalitabari, Sherpur'}
          </span>
        </span>
      )}
    </Link>
  );
}
