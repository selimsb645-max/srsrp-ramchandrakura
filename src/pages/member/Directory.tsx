import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAsyncList } from '@/hooks/useAsyncList';
import { listDirectoryMembers } from '@/services/memberService';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Label, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';

/**
 * সদস্য ডিরেক্টরি — শুধু প্রকাশিত (published) ও সক্রিয় সদস্যদের তালিকা।
 * ফোন, ইমেইল বা জন্মতারিখ কখনো এখানে আসে না; শিক্ষা প্রতিষ্ঠান ও ওয়ার্ডই যথেষ্ট।
 */
export function MemberDirectoryPage() {
  const { t, lang } = useI18n();
  const { data, loading, error } = useAsyncList(listDirectoryMembers);
  const [search, setSearch] = useState('');
  const [ward, setWard] = useState('');

  const wards = useMemo(() => {
    const set = new Set<string>();
    data.forEach((member) => member.ward && set.add(member.ward));
    return [...set].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b, 'bn'));
  }, [data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.filter((member) => {
      if (ward && member.ward !== ward) return false;
      if (!term) return true;
      return [member.nameBn, member.nameEn, member.village, member.school, member.memberCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [data, search, ward]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">{t('member.directory.lead')}</p>

      <div className="card grid gap-3 p-4 sm:grid-cols-[1fr_180px]">
        <div>
          <Label htmlFor="dir-search">{t('common.search')}</Label>
          <Input
            id="dir-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('member.directory.search')}
          />
        </div>
        <div>
          <Label htmlFor="dir-ward">{t('member.directory.ward')}</Label>
          <Select id="dir-ward" value={ward} onChange={(event) => setWard(event.target.value)}>
            <option value="">{t('member.directory.allWards')}</option>
            {wards.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Badge tone="green">
          {t('member.directory.count')}: {data.length}
        </Badge>
        {filtered.length !== data.length && <span className="text-xs text-slate-400">{filtered.length} / {data.length}</span>}
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{t('common.error')} ({error})</p>}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('member.directory.empty')} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <li key={member.id} className="card flex items-center gap-3 p-3.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.nameBn} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-300">
                    {member.nameBn.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-950">{member.nameBn}</p>
                <p className="truncate text-xs text-slate-500">
                  {[lang === 'bn' ? 'ওয়ার্ড' : 'Ward', member.ward].filter(Boolean).join(' ')}
                  {member.village ? ` • ${member.village}` : ''}
                </p>
                {member.school && <p className="truncate text-xs text-slate-400">{member.school}</p>}
                {member.memberCode && <p className="mt-0.5 font-mono text-[11px] text-brand-700">{member.memberCode}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
