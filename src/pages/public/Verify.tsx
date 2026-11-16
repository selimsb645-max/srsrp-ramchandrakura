import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { site } from '@/config/site';
import { Container } from '@/components/ui/Container';
import { Spinner } from '@/components/ui/Spinner';
import { normaliseMemberCode, verifyMemberCode, type VerifyOutcome } from '@/services/verifyService';

/**
 * Public membership verification — what the QR on the printed ID card opens.
 *
 * Anyone can scan and see whether the number exists in the association's own database and
 * is active, which is what stops a forged card. Contact details and the birth date are never
 * shown here, and the page states plainly that it is a database check, not a cryptographic
 * signature.
 */
export function VerifyPage() {
  const { t, lang } = useI18n();
  const { code = '' } = useParams<{ code: string }>();
  const [typed, setTyped] = useState(code);
  const [result, setResult] = useState<VerifyOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const run = useCallback(async (value: string) => {
    if (!normaliseMemberCode(value)) {
      setResult({ state: 'not_found' });
      setCheckedAt(new Date());
      return;
    }
    setLoading(true);
    const outcome = await verifyMemberCode(value);
    setResult(outcome);
    setCheckedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    setTyped(code);
    void run(code);
  }, [code, run]);

  const member = result && 'member' in result ? result.member : null;

  return (
    <section className="bg-slate-50/60 py-10">
      <Container className="max-w-2xl">
        <div className="text-center">
          <img
            src={site.brand.logo}
            alt=""
            className="mx-auto h-16 w-16 rounded-full ring-2 ring-brand-100"
          />
          <h1 className="mt-4 font-display text-2xl font-bold text-brand-950 sm:text-3xl">{t('verify.title')}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">{t('verify.lead')}</p>
        </div>

        <form
          className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void run(typed);
          }}
        >
          <div className="flex-1">
            <label htmlFor="verify-code" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('verify.codeLabel')}
            </label>
            <input
              id="verify-code"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={t('verify.codePlaceholder')}
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-brand-950 uppercase tracking-wide outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
          >
            {loading && <Spinner className="h-4 w-4" />}
            {t('verify.check')}
          </button>
        </form>

        {loading && !result && (
          <div className="card mt-4 flex items-center gap-2 p-5 text-sm text-slate-600">
            <Spinner className="h-4 w-4" /> {t('common.loading')}
          </div>
        )}

        {!loading && result?.state === 'found' && member && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-leaf-200 bg-white shadow-soft">
            <div className="flex items-start gap-3 bg-leaf-50 px-5 py-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[17px] font-bold text-leaf-900">{t('verify.genuine')}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-leaf-800">{t('verify.genuineBody')}</p>
              </div>
            </div>
            <dl className="divide-y divide-slate-100 px-5">
              {[
                { label: t('verify.name'), value: member.name },
                { label: t('verify.memberCode'), value: member.memberCode },
                { label: t('verify.designation'), value: member.designation },
                { label: t('verify.ward'), value: member.ward },
                { label: t('verify.village'), value: member.village },
                {
                  label: t('verify.joined'),
                  value: member.joinedAt ? formatDate(member.joinedAt, lang === 'bn' ? 'bn' : 'en') : '',
                },
                { label: t('verify.status'), value: t('verify.active') },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-[13px] font-semibold text-slate-500">{row.label}</dt>
                    <dd className="text-right text-[15px] font-semibold text-brand-950">{row.value}</dd>
                  </div>
                ))}
            </dl>
            <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-[12px] leading-relaxed text-slate-500">
              {t('verify.privacy')}
            </p>
          </div>
        )}

        {!loading && result?.state === 'inactive' && (
          <div className="card mt-4 border-amber-200 bg-amber-50 p-5">
            <p className="font-display text-[17px] font-bold text-amber-900">{t('verify.inactive')}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-800">{t('verify.inactiveBody')}</p>
          </div>
        )}

        {!loading && result?.state === 'not_found' && (
          <div className="card mt-4 border-rose-200 bg-rose-50 p-5">
            <p className="font-display text-[17px] font-bold text-rose-900">{t('verify.notFound')}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-rose-800">{t('verify.notFoundBody')}</p>
          </div>
        )}

        {!loading && (result?.state === 'error' || result?.state === 'not_configured') && (
          <div className="card mt-4 border-slate-200 p-5">
            <p className="font-display text-[17px] font-bold text-brand-950">{t('verify.error')}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{t('verify.errorBody')}</p>
          </div>
        )}

        {checkedAt && (
          <p className="mt-4 text-center text-[12px] text-slate-500">
            {t('verify.checkedAt')}: {formatDate(checkedAt, lang === 'bn' ? 'bn' : 'en')}
          </p>
        )}

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-slate-500">
          {t('verify.footerNote')}{' '}
          <Link to="/contact" className="font-semibold text-brand-800 hover:underline">
            {t('nav.contact')}
          </Link>
        </p>
      </Container>
    </section>
  );
}
