import { toBnDigits } from '@/lib/utils';
import { useI18n } from '@/i18n';

export interface StatItem {
  label: string;
  value: number | string;
}

export function StatGrid({ items }: { items: StatItem[] }) {
  const { lang } = useI18n();
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-soft">
          <dd className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            {typeof item.value === 'number' ? (lang === 'bn' ? toBnDigits(item.value) : item.value) : item.value}
          </dd>
          <dt className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
