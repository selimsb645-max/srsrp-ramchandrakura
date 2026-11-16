import { Label } from '@/components/ui/Field';

/** কাগজপত্রের ফাইল বাছাই — ফাইলের নাম দেখিয়ে দেয়, যাতে ব্যবহারকারী বুঝতে পারে ঠিক আছে। */
export function FileField({
  id,
  label,
  hint,
  accept,
  required,
  multiple,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  accept: string;
  required?: boolean;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {`${label}${required ? ' *' : ''}`}
      </Label>
      <input
        id={id}
        name={id}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
      />
    </div>
  );
}
