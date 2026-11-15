import { useState } from 'react';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { useAsyncList } from '@/hooks/useAsyncList';
import { getGallery } from '@/services/publicData';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackendNotice } from '@/components/shared/BackendNotice';

export function GalleryPage() {
  const { t, lang, pick } = useI18n();
  const { data, loading, configured } = useAsyncList(getGallery);
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <PageHero title={t('gallery.title')} description={t('gallery.lead')} />

      <Container className="py-12 sm:py-16">
        {!configured && <div className="mb-6"><BackendNotice compact /></div>}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="skeleton aspect-square w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState title={t('gallery.empty')} body={t('placeholder.body')} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.imageUrl)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
              >
                <img
                  src={item.imageUrl}
                  alt={pick(item.titleBn, item.titleEn)}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 text-left text-[11px] font-medium text-white">
                  {pick(item.titleBn, item.titleEn)}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">
          {lang === 'bn' ? 'ছবি প্রকাশের আগে অনুমতি ও সূত্র যাচাই করা হয়।' : 'Permission and credit are checked before a photo is published.'}
        </p>
      </Container>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <img src={active} alt="" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800"
          >
            {t('nav.close')}
          </button>
        </div>
      )}

      {data.length > 0 && data[0].takenAt && (
        <Container className="pb-10 text-center text-xs text-slate-400">{formatDate(data[0].takenAt, lang)}</Container>
      )}
    </>
  );
}
