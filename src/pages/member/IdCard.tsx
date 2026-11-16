import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Placeholder } from '@/components/ui/Placeholder';

/**
 * সদস্য আইডি কার্ড — ৮৫.৬ × ৫৪ মিমি (ক্রেডিট কার্ড মাপ), প্রিন্ট ও PDF দুটোই।
 * কার্ডে যা দেখানো হয় সবই অ্যাডমিন-নিয়ন্ত্রিত তথ্য (নাম, সদস্য নম্বর, ওয়ার্ড),
 * কোনো ফোন নম্বর বা জন্মতারিখ ছাপা হয় না, কারণ কার্ড হারালে সেগুলো ঝুঁকিতে পড়ে।
 */
export function MemberIdCardPage() {
  const { t, lang } = useI18n();
  const { profile, contact } = useAuth();
  const [qr, setQr] = useState<string>('');

  const code = profile?.memberCode ?? '';
  /**
   * The QR opens the public /verify page, so anyone holding the card can check it against the
   * association's own member list. Without a member number there is nothing to verify, and the
   * code falls back to plain text so a half-issued card is never mistaken for a verified one.
   */
  const qrPayload = code
    ? `${window.location.origin}${import.meta.env.BASE_URL}verify/${encodeURIComponent(code)}`
    : profile
      ? [
          'শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ',
          '৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা',
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

      {/* ---------- front ---------- */}
      <div className="print-sheet mx-auto w-[85.6mm]">
        <div className="relative h-[54mm] overflow-hidden rounded-[3.2mm] border border-brand-200 bg-white shadow-soft">
          <div className="flex items-center gap-[2.5mm] bg-gradient-to-r from-brand-900 to-brand-700 px-[4mm] py-[3mm] text-white">
            <img src={`${import.meta.env.BASE_URL}brand/logo-512.png`} alt="" className="h-[8mm] w-[8mm] rounded-full bg-white object-contain p-[1mm]" />
            <div className="leading-tight">
              <p className="text-[2.7mm] font-bold">শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ</p>
              <p className="text-[2.2mm] text-brand-100">৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা</p>
            </div>
          </div>

          <div className="flex gap-[3mm] px-[4mm] py-[3mm]">
            <div className="h-[19mm] w-[15mm] shrink-0 overflow-hidden rounded-[2mm] border border-slate-200 bg-slate-100">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.nameBn} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[2.2mm] text-slate-400">ছবি নেই</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[3.4mm] font-bold leading-tight text-brand-950">{profile.nameBn}</p>
              <p className="mt-[0.6mm] text-[2.2mm] text-slate-500">
                {profile.className ? `${profile.className} • ` : ''}
                {profile.school ?? profile.village ?? ''}
              </p>
              <dl className="mt-[1.6mm] space-y-[0.7mm] text-[2.3mm]">
                <div className="flex gap-[1.5mm]">
                  <dt className="w-[11mm] text-slate-400">সদস্য নং</dt>
                  <dd className="font-semibold text-slate-800">{code || '—'}</dd>
                </div>
                <div className="flex gap-[1.5mm]">
                  <dt className="w-[11mm] text-slate-400">ওয়ার্ড</dt>
                  <dd className="text-slate-800">{profile.ward || '—'}</dd>
                </div>
                <div className="flex gap-[1.5mm]">
                  <dt className="w-[11mm] text-slate-400">মেয়াদ</dt>
                  <dd className="text-slate-800">
                    {profile.approvedAt ? formatDate(profile.approvedAt, lang) : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-between">
              {qr ? (
                <img src={qr} alt="QR" className="h-[16mm] w-[16mm]" />
              ) : (
                <div className="h-[16mm] w-[16mm] rounded bg-slate-100" />
              )}
              <p className="mt-[1mm] text-center text-[1.7mm] leading-tight text-slate-400">স্ক্যান করুন</p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-brand-50 px-[4mm] py-[1.4mm] text-[1.9mm] text-brand-900">
            <span>নালিতাবাড়ী, শেরপুর</span>
            <span>{profile.status === 'active' ? 'সক্রিয় সদস্য' : 'সদস্য'}</span>
          </div>
        </div>

        {/* ---------- back ---------- */}
        <div className="print-sheet mt-[6mm] h-[54mm] w-[85.6mm] overflow-hidden rounded-[3.2mm] border border-slate-200 bg-white p-[4mm] shadow-soft">
          <p className="text-[2.4mm] font-bold text-brand-950">{t('member.card.back')}</p>
          <p className="mt-[1.5mm] text-[2.1mm] leading-[3.2mm] text-slate-600">{t('member.card.scanNote')}</p>
          <dl className="mt-[2.5mm] space-y-[1mm] text-[2.2mm]">
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-[0.8mm]">
              <dt className="text-slate-400">{t('member.card.emergency')}</dt>
              <dd className="text-slate-700">{contact?.guardianName ?? '—'}</dd>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-[0.8mm]">
              <dt className="text-slate-400">{t('member.card.bloodGroup')}</dt>
              <dd className="text-slate-700">—</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">ইউনিয়ন</dt>
              <dd className="text-slate-700">৫নং রামচন্দ্রকুড়া</dd>
            </div>
          </dl>
          <p className="mt-[2mm] text-[1.8mm] leading-tight text-slate-400">
            কার্ডটি ব্যক্তিগত। হারিয়ে গেলে কমিটিকে জানান। কার্ডে দেওয়া তথ্য ওয়েবসাইটের সদস্য তালিকা থেকেই নেওয়া।
          </p>
        </div>
      </div>

      <p className="no-print text-center text-xs text-slate-400">
        {t('member.card.print')}: A4 কাগজে ছাপলে কার্ডটি আসল মাপে আসবে।
      </p>
    </div>
  );
}
