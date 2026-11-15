import { site } from '@/config/site';
import { useI18n } from '@/i18n';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Placeholder } from '@/components/ui/Placeholder';

export function AboutPage() {
  const { t, lang } = useI18n();

  const structure = [
    { bn: 'কেন্দ্রীয় কমিটি', en: 'Central committee' },
    { bn: 'জেলা / মহানগর কমিটি', en: 'District / city committee' },
    { bn: 'উপজেলা / থানা কমিটি', en: 'Upazila / thana committee' },
    { bn: 'ইউনিয়ন শাখা', en: 'Union branch' },
  ];

  const objectives = [
    { bn: 'শিক্ষা ও সৃজনশীলতায় শিশু-কিশোরদের অংশগ্রহণ বাড়ানো।', en: 'Increase participation of children in education and creativity.' },
    { bn: 'ক্রীড়া ও সংস্কৃতির মাধ্যমে সুস্থ প্রতিযোগিতার চর্চা।', en: 'Encourage healthy competition through sports and culture.' },
    { bn: 'শহীদ শেখ রাসেলের স্মৃতি ও আদর্শ সংরক্ষণ।', en: 'Preserve the memory and ideals of Shaheed Sheikh Russel.' },
    { bn: 'স্বাস্থ্য সচেতনতা ও মানবিক সহায়তায় অংশ নেওয়া।', en: 'Take part in health awareness and humanitarian support.' },
  ];

  return (
    <>
      <PageHero title={t('about.title')} description={t('about.lead')} />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_.9fr] lg:items-start">
          <div className="space-y-10">
            <section>
              <SectionHeading title={t('about.historyTitle')} />
              <div className="prose-bn">
                <p>{t('about.historyBody')}</p>
                <p>{lang === 'bn' ? site.organization.foundedBn : site.organization.foundedEn}</p>
              </div>
            </section>

            <section>
              <SectionHeading title={t('about.missionTitle')} />
              <ul className="grid gap-3 sm:grid-cols-2">
                {objectives.map((item) => (
                  <li key={item.en} className="card flex items-start gap-3 p-4">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[15px] text-slate-700">{lang === 'bn' ? item.bn : item.en}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <SectionHeading title={t('about.structureTitle')} description={t('about.structureBody')} />
              <ol className="space-y-3">
                {structure.map((level, index) => (
                  <li key={level.en} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 font-display text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-[15px] font-medium text-slate-700">{lang === 'bn' ? level.bn : level.en}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <SectionHeading title={t('about.branchTitle')} description={t('about.branchBody')} />
              <div className="card overflow-hidden">
                <dl className="divide-y divide-slate-100">
                  {[
                    { label: t('footer.organization'), value: site.organization.nameBn },
                    { label: lang === 'bn' ? 'শাখা' : 'Branch', value: site.organization.branchBn },
                    { label: lang === 'bn' ? 'উপজেলা' : 'Upazila', value: site.organization.parentBn },
                    { label: t('contact.address'), value: lang === 'bn' ? site.contact.addressBn : site.contact.addressEn },
                  ].map((row) => (
                    <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                      <dt className="text-sm font-semibold text-slate-500">{row.label}</dt>
                      <dd className="text-[15px] text-slate-800">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display text-base font-bold text-brand-950">
                {lang === 'bn' ? 'যাচাই নীতি' : 'Verification policy'}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{t('about.disclaimer')}</p>
            </div>
            <Placeholder />
          </aside>
        </div>
      </Container>
    </>
  );
}
