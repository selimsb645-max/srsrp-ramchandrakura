import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[.98]';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-800 text-white shadow-soft hover:bg-brand-900',
  secondary: 'bg-leaf-500 text-white shadow-soft hover:bg-leaf-600',
  outline: 'border border-brand-200 bg-white text-brand-900 hover:border-brand-400 hover:bg-brand-50',
  ghost: 'text-brand-900 hover:bg-brand-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  full?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  full,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], full && 'w-full', className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  full,
}: CommonProps & { to?: string; href?: string }) {
  const classes = cn(base, variants[variant], sizes[size], full && 'w-full', className);
  if (href) {
    return (
      <a className={classes} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={classes} to={to ?? '/'}>
      {children}
    </Link>
  );
}
