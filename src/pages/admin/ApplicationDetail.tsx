import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { getApplication } from '@/services/applicationService';
import { documentUrl } from '@/services/documentService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MembershipApplication } from '@/types';

/**
 * এক আবেদনের পূর্ণ বিবরণ — সভাপতি/কমিটির কাছে জমা দেওয়ার জন্য প্রিন্ট-উপযোগী।
 * ছবি সরাসরি দেখায়, কাগজপত্রের লিংক দেয়; "প্রিন্ট করুন" চাপলে শুধু এই পাতা ছাপে।
 */
export function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const [application, setApplication] = useState<MembershipApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!id) return;
    setLoading(true);
    getApplication(id)
      .then((found) => {
        if (alive) setApplication(found);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-6 text-sm text-slate-600">
        <Spinner className="h-4 w-4" /> {t('common.loading')}
      </div>
    );
  }

  if (error) return <div className="card p-6 text-sm text-rose-600">{error}</div>;
  if (!application) return <div className="card p-6"><EmptyState title={t('common.empty')} /></div>;

  const documents = application.documents ?? [];
  const photo = documents.find((document) => document.type.startsWith('image/'));
  const others = documents.filter((document) => document !== photo);

  const fields: { label: string; value?: string }[] = [
    { label: 'পিতা/মাতার নাম', value: application.guardianName },
    { label: 'জন্ম তারিখ', value: application.dateOfBirth },
    { label: 'মোবাইল', value: application.phone },
    { label: 'ইমেইল', value: application.email },
    { label: 'শিক্ষা প্রতিষ্ঠান', value: application.school },
    { label: 'শ্রেণি', value: application.className },
    { label: 'গ্রাম', value: application.village },
    { label: 'ওয়ার্ড নম্বর', value: application.ward },
    { label: 'জাতীয় পরিচয়পত্র নম্বর', value: application.nidNumber },
  ];

  return (
    <div className="space-y-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link to="/admin/applications" className="text-sm font-semibold text-brand-800 hover:underline">
          ← আবেদনের তালিকায় ফিরে যান
        </Link>
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          প্রিন্ট করুন
        </Button>
      </div>

      <article className="card p-6 print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-4 text-center">
          <h1 className="font-display text-xl font-bold text-brand-950">শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ</h1>
          <p className="text-sm text-slate-600">৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা • নালিতাবাড়ী, শেরপুর</p>
          <p className="mt-2 inline-block rounded-lg bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-900">
            সদস্যপদের আবেদন — যাচাইপত্র
          </p>
        </header>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row">
          {photo ? (
            <img
              src={documentUrl(photo.key)}
              alt="আবেদনকারীর ছবি"
              className="h-32 w-28 flex-none rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-32 w-28 flex-none items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
              ছবি নেই
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-brand-950">{application.fullName}</h2>
              <Badge tone={application.status === 'approved' ? 'green' : application.status === 'rejected' ? 'rose' : 'amber'}>
                {t(`application.status.${application.status}`)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              জমা দেওয়ার তারিখ: {application.createdAt ? formatDate(application.createdAt, lang) : '—'}
            </p>
            {application.facebookUrl ? (
              <p className="mt-1 text-sm text-slate-600">
                ফেসবুক: <span className="break-all text-brand-800">{application.facebookUrl}</span>
              </p>
            ) : null}
          </div>
        </div>

        <table className="mt-5 w-full text-left text-sm">
          <tbody className="divide-y divide-slate-100">
            {fields.map((field) => (
              <tr key={field.label}>
                <th className="w-52 py-2 pr-3 align-top font-semibold text-slate-600">{field.label}</th>
                <td className="py-2 text-slate-800">{field.value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {application.motivation ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">কেন সদস্য হতে চান</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{application.motivation}</p>
          </div>
        ) : null}

        <h3 className="mt-6 font-display text-base font-bold text-brand-950">সংযুক্ত কাগজপত্র</h3>
        {others.length === 0 && !photo ? (
          <p className="mt-1 text-sm text-slate-500">কোনো কাগজপত্র আপলোড করা হয়নি।</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-800">
            {documents.map((document) => (
              <li key={document.key}>
                <span className="font-semibold">{document.label}</span>{' '}
                <a
                  href={documentUrl(document.key)}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-brand-800 underline decoration-dotted"
                >
                  {document.name}
                </a>{' '}
                <span className="text-xs text-slate-500">
                  ({document.type.includes('pdf') ? 'PDF' : 'ছবি'}, {Math.max(1, Math.round(document.size / 1024))} KB)
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
          <div className="border-t border-slate-300 pt-2">যাচাইকারীর স্বাক্ষর</div>
          <div className="border-t border-slate-300 pt-2">সভাপতির স্বাক্ষর</div>
        </div>
      </article>
    </div>
  );
}
