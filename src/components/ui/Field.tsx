import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50';

export function Label({ children, htmlFor, hint }: { children: string; htmlFor: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}
      {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-[120px] resize-y', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'pr-9', className)} {...rest}>
      {children}
    </select>
  );
}
