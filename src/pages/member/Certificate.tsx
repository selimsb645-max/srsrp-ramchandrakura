import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { verifyUrlFor } from '@/lib/verifyUrl';
import { Button } from '@/components/ui/Button';
import { Placeholder } from '@/components/ui/Placeholder';

/**
 * সদস্যপদ সনদ — A4, প্রিন্ট/PDF।
 *
 * যা ছাপা হয় সবই অ্যাডমিন-নিয়ন্ত্রিত: নাম, পিতা/মাতার নাম, সদস্য নম্বর, ওয়ার্ড,
 * অনুমোদনের তারিখ। স্বাক্ষর ও সিল ছাপা হয় না — কমিটি নিজে হাতে দেবেন, তাই কোনো
 * ভুয়া স্বাক্ষর বা বানানো স্মারক নম্বর নেই।
 */
export function MemberCertificatePage() {
  const { t, lang } = useI18n();
  const { profile, contact } = useAuth();

  if (!profile) {
    return <Placeholder title={t('member.notVerified')} body={t('auth.noAccount')} />;
  }

  const issued = profile.approvedAt ?? profile.createdAt ?? null;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-600">{t('member.cert.lead')}</p>
        <Button onClick={() => window.print()}>{t('member.cert.print')}</Button>
      </div>

      {!profile.memberCode && (
        <p className="no-print rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{t('member.card.noCode')}</p>
      )}

      <div className="print-sheet mx-auto w-full max-w-[190mm] rounded-lg border-[3px] border-double border-brand-800 bg-white p-[10mm] shadow-soft">
        <div className="flex items-center gap-[4mm] border-b border-brand-100 pb-[5mm]">
          <img
            src={`${import.meta.env.BASE_URL}brand/logo-512.png`}
            alt=""
            className="h-[18mm] w-[18mm] object-contain"
          />
          <div>
            <h2 className="font-display text-[5.2mm] font-bold leading-tight text-brand-950">
              শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ
            </h2>
            <p className="text-[3.2mm] text-slate-600">৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা</p>
            <p className="text-[2.8mm] text-slate-400">নালিতাবাড়ী, শেরপুর, ময়মনসিংহ</p>
          </div>
        </div>

        <div className="py-[10mm] text-center">
          <p className="font-display text-[6mm] font-bold tracking-[0.5mm] text-brand-800">{t('member.cert.heading')}</p>
          <p className="mt-[7mm] text-[3.2mm] text-slate-500">{t('member.cert.issuedTo')}</p>
          <p className="mt-[3mm] font-display text-[6.4mm] font-bold text-brand-950">{profile.nameBn}</p>
          {contact?.guardianName && (
            <p className="mt-[1.5mm] text-[3mm] text-slate-500">
              পিতা/মাতা: {contact.guardianName}
              {profile.village ? ` • গ্রাম: ${profile.village}` : ''}
              {profile.ward ? ` • ওয়ার্ড: ${profile.ward}` : ''}
            </p>
          )}
          <p className="mx-auto mt-[6mm] max-w-[140mm] text-[3.3mm] leading-[5.4mm] text-slate-700">
            {t('member.cert.body')}
          </p>

          <dl className="mx-auto mt-[8mm] grid max-w-[120mm] grid-cols-2 gap-[4mm] text-left text-[3mm]">
            <div className="rounded-lg bg-brand-50 px-3 py-2">
              <dt className="text-[2.4mm] uppercase tracking-wide text-brand-700">সদস্য নম্বর</dt>
              <dd className="font-semibold text-brand-950">{profile.memberCode ?? '—'}</dd>
            </div>
            <div className="rounded-lg bg-brand-50 px-3 py-2">
              <dt className="text-[2.4mm] uppercase tracking-wide text-brand-700">{t('member.cert.issued')}</dt>
              <dd className="font-semibold text-brand-950">{issued ? formatDate(issued, lang) : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-[10mm] flex items-end justify-between gap-[6mm]">
          <div className="text-center">
            <div className="mb-[1.5mm] h-[0.4mm] w-[52mm] bg-slate-400" />
            <p className="text-[2.9mm] font-semibold text-slate-700">{t('member.cert.signPresident')}</p>
          </div>
          <div className="text-center">
            <div className="mb-[1.5mm] h-[0.4mm] w-[52mm] bg-slate-400" />
            <p className="text-[2.9mm] font-semibold text-slate-700">{t('member.cert.signSecretary')}</p>
          </div>
        </div>

        <p className="mt-[7mm] border-t border-dashed border-slate-200 pt-[3mm] text-[2.4mm] leading-tight text-slate-400">
          {t('member.cert.note')}
        </p>
        {profile.memberCode && (
          <p className="mt-[1.5mm] text-[2.3mm] leading-tight text-slate-500">
            যাচাই / Verify: {verifyUrlFor(profile.memberCode)}
          </p>
        )}
      </div>
    </div>
  );
}
