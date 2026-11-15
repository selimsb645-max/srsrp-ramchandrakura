import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {kicker && (
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[.14em] text-leaf-600">
            {kicker}
          </span>
        )}
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-[15px] text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
