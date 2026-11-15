import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { EmptyState } from '@/components/ui/EmptyState';

/** Read-only table shell shared by every admin screen (kept from phase 1 design). */
export function AdminTable({
  title,
  description,
  headers,
  rows,
  loading,
  error,
  emptyTitle,
}: {
  title: string;
  description?: string;
  headers: string[];
  rows: ReactNode[][];
  loading: boolean;
  error: string | null;
  emptyTitle?: string;
}) {
  const { t } = useI18n();
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-brand-950">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {loading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2].map((key) => (
            <div key={key} className="skeleton h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-rose-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState title={emptyTitle ?? t('common.empty')} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-2.5 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2.5 align-middle text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
