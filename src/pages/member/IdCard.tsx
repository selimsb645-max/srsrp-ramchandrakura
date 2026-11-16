import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { site } from '@/config/site';
import { toBnDigits } from '@/lib/utils';
import { verifyUrlFor } from '@/lib/verifyUrl';
import { Button } from '@/components/ui/Button';
import { Placeholder } from '@/components/ui/Placeholder';

/**
 * সদস্য আইডি কার্ড — ৮৫.৬ × ৫৪ মিমি (ক্রেডিট কার্ড মাপ), সামনে ও পিছনে দুটোই।
 *
 * সামনের অংশ: লোগো, সংগঠনের পূর্ণ নাম, শাখার নাম, ছবি, সদস্যের পূর্ণ নাম,
 * MEMBER ID, সাংগঠনিক পদবি, ইউনিয়ন ও উপজেলা পরিচয়।
 * পিছনের অংশ: আইডি পুনরায়, যোগদান/ইস্যু/মেয়াদ, QR যাচাই, কর্তৃপক্ষের স্বাক্ষরের লাইন,
 * হারানো কার্ডের নির্দেশনা। স্বাক্ষর বা সিল ছাপা হয় না — কমিটি নিজে দেন।
 *
 * কার্ডে যা দেখানো হয় সবই কমিটি-নিয়ন্ত্রিত তথ্য (নাম, নম্বর, পদবি, ওয়ার্ড) —
 * ফোন নম্বর, জন্মতারিখ বা অভিভাবকের তথ্য ছাপা হয় না, কারণ কার্ড হারালে সেগুলো ঝুঁকিতে পড়ে।
 */
function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

/** কার্ডে ছোট মাপে তারিখ: ০১-০১-২০২৬ */
function shortDate(value: Date | null | undefined, lang: 'bn' | 'en'): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const text = `${day}-${month}-${date.getFullYear()}`;
  return lang === 'bn' ? toBnDigits(text) : text;
}

export function MemberIdCardPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const [qr, setQr] = useState<string>('');

  const code = profile?.memberCode ?? '';
  const position = profile?.designationBn?.trim() || t('member.card.defaultDesignation');

  /** যোগদান = অনুমোদনের তারিখ; না থাকলে অ্যাকাউন্ট তৈরির তারিখ। */
  const joinedAt = profile?.joinedAt ?? profile?.approvedAt ?? profile?.createdAt ?? null;
  /** কার্ড ইস্যু হয় যোগদানের দিনই, যদি আলাদা করে কিছু না দেওয়া থাকে। */
  const issuedAt = profile?.cardIssuedAt ?? joinedAt;
  const expiresAt = profile?.cardExpiresAt ?? (issuedAt ? addYears(issuedAt, site.membership.cardTermYears) : null);

  /**
   * The QR opens the public /verify page, so anyone holding the card can check it against the
   * association's own member list. Without a member number there is nothing to verify, and the
   * code falls back to plain text so a half-issued card is never mistaken for a verified one.
   */
  const qrPayload = code
    ? verifyUrlFor(code)
    : profile
      ? [
          site.organization.nameBn,
          site.organization.branchBn,
          `সদস্য: ${profile.nameBn}`,
          profile.ward ? `ওয়ার্ড: ${profile.ward}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

  useEffect(() => {
    if (!qrPayload) {
      setQr('');
      return;
    }
    QRCode.toDataURL(qrPayload, { margin: 0, width: 320, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(''));
  }, [qrPayload]);

  if (!profile) {
    return <Placeholder title={t('member.notVerified')} body={t('auth.noAccount')} />;
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-600">{t('member.card.lead')}</p>
        <Button onClick={() => window.print()}>{t('member.card.print')}</Button>
      </div>

      {!code && (
        <p className="no-print rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{t('member.card.noCode')}</p>
      )}

      <div className="print-sheet mx-auto w-[85.6mm]">
        {/* ---------- front: পরিচয় ---------- */}
        <div className="relative h-[54mm] overflow-hidden rounded-[3.2mm] border border-brand-200 bg-white shadow-soft">
          <div className="flex items-center gap-[2.5mm] bg-gradient-to-r from-brand-900 to-brand-700 px-[4mm] py-[2.6mm] text-white">
            <img
              src={`${import.meta.env.BASE_URL}brand/logo-512.png`}
              alt=""
              className="h-[9mm] w-[9mm] rounded-full bg-white object-contain p-[0.8mm]"
            />
            <div className="leading-tight">
              <p className="text-[2.8mm] font-bold">{site.organization.nameBn}</p>
              <p className="mt-[0.4mm] text-[2.1mm] text-brand-100">{site.organization.branchBn}</p>
            </div>
          </div>

          <div className="flex gap-[3mm] px-[4mm] pt-[2.6mm]">
            <div className="h-[22mm] w-[17mm] shrink-0 overflow-hidden rounded-[2mm] border border-slate-200 bg-slate-100">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.nameBn} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[2.1mm] text-slate-400">ছবি নেই</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[3.6mm] font-bold leading-tight text-brand-950">{profile.nameBn}</p>

              <div className="mt-[1.2mm] rounded-[1.4mm] bg-brand-50 px-[2mm] py-[0.9mm]">
                <p className="text-[1.5mm] font-semibold uppercase tracking-[0.32mm] text-brand-600">
                  {t('member.card.memberIdLabel')}
                </p>
                <p className="font-mono text-[3mm] font-bold leading-tight text-brand-900">{code || '—'}</p>
              </div>

              <dl className="mt-[1.3mm] space-y-[0.7mm] text-[2.15mm]">
                <div className="flex gap-[1.5mm]">
                  <dt className="w-[9mm] shrink-0 text-slate-400">{t('member.card.designation')}</dt>
                  <dd className="truncate font-semibold text-slate-800">{position}</dd>
                </div>
                <div className="flex gap-[1.5mm]">
                  <dt className="w-[9mm] shrink-0 text-slate-400">{t('member.card.ward')}</dt>
                  <dd className="text-slate-800">{profile.ward || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mx-[4mm] mt-[1.7mm] flex items-center justify-between gap-[2mm] rounded-[1.4mm] bg-leaf-50 px-[2mm] py-[1.1mm] text-[1.9mm] text-leaf-800">
            <span className="font-semibold">{site.organization.branchBn}</span>
            <span className="truncate">{site.organization.parentBn}</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-brand-50 px-[4mm] py-[1.3mm] text-[1.8mm] text-brand-900">
            <span>নালিতাবাড়ী, শেরপুর</span>
            <span className="rounded-full bg-brand-700 px-[2mm] py-[0.4mm] text-[1.6mm] font-semibold text-white">
              {t('member.card.badge')}
            </span>
          </div>
        </div>

        {/* ---------- back: যাচাই ও নির্দেশনা ---------- */}
        <div className="print-sheet mt-[6mm] h-[54mm] w-[85.6mm] overflow-hidden rounded-[3.2mm] border border-slate-200 bg-white p-[3.6mm] shadow-soft">
          <div className="flex items-start justify-between gap-[3mm]">
            <div className="min-w-0 flex-1">
              <p className="text-[2.5mm] font-bold text-brand-950">{t('member.card.backTitle')}</p>
              <p className="mt-[0.5mm] text-[1.55mm] uppercase tracking-[0.18mm] text-slate-400">
                {t('member.card.orgEn')}
              </p>
              <div className="mt-[1.8mm] border-t border-dashed border-brand-200" />
              <dl className="mt-[1.5mm] space-y-[0.9mm] text-[2.1mm]">
                <div className="flex items-baseline justify-between gap-[2mm]">
                  <dt className="text-slate-400">{t('member.card.memberId')}</dt>
                  <dd className="font-mono text-[2.3mm] font-bold text-brand-900">{code || '—'}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-[2mm]">
                  <dt className="text-slate-400">{t('member.card.joined')}</dt>
                  <dd className="font-semibold text-slate-800">{shortDate(joinedAt, lang)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-[2mm]">
                  <dt className="text-slate-400">{t('member.card.issued')}</dt>
                  <dd className="font-semibold text-slate-800">{shortDate(issuedAt, lang)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-[2mm]">
                  <dt className="text-slate-400">{t('member.card.expiry')}</dt>
                  <dd className="font-semibold text-slate-800">{shortDate(expiresAt, lang)}</dd>
                </div>
              </dl>
            </div>

            <div className="shrink-0 text-center">
              {qr ? (
                <img src={qr} alt="QR" className="h-[15mm] w-[15mm]" />
              ) : (
                <div className="h-[15mm] w-[15mm] rounded bg-slate-100" />
              )}
              <p className="mt-[0.8mm] w-[15mm] text-[1.45mm] leading-tight text-slate-400">
                {t('member.card.scanVerify')}
              </p>
            </div>
          </div>

          <div className="mt-[2.2mm]">
            <div className="h-[5.5mm] w-[30mm] border-b border-slate-400" />
            <p className="mt-[0.6mm] text-[1.55mm] text-slate-500">{t('member.card.signature')}</p>
          </div>

          <div className="mt-[1.8mm] border-t border-slate-100 pt-[1.2mm]">
            <p className="text-[1.6mm] leading-[2.4mm] text-slate-500">{t('member.card.lost')}</p>
            <p className="mt-[0.4mm] text-[1.5mm] text-slate-400">{t('member.card.address')}</p>
          </div>
        </div>
      </div>

      <p className="no-print text-center text-xs text-slate-400">
        {t('member.card.print')}: A4 কাগজে ছাপলে কার্ডটি আসল মাপে আসবে।
      </p>
    </div>
  );
}
