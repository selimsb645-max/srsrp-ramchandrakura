import { useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { useAsyncList } from '@/hooks/useAsyncList';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { uploadDocument, documentUrl } from '@/services/documentService';
import { cn } from '@/lib/utils';
import type { ListResult } from '@/services/publicData';
import type { FormValues } from '@/services/contentService';

export type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'datetime' | 'number' | 'url' | 'checkbox' | 'image';

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
  wide?: boolean;
  placeholder?: string;
  min?: number;
  rows?: number;
}

export interface ColumnDef<T> {
  header: string;
  cell: (item: T) => ReactNode;
}

interface Props<T extends { id: string }> {
  title: string;
  description?: string;
  addLabel: string;
  load: () => Promise<ListResult<T>>;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  blank: FormValues;
  toForm: (item: T) => FormValues;
  save: (values: FormValues, id?: string | null) => Promise<void>;
  remove?: (item: T) => Promise<void>;
  publish?: { isPublished: (item: T) => boolean; toggle: (item: T) => Promise<void> };
  emptyTitle?: string;
}

/**
 * Shared management screen: list of records plus a create / edit dialog.
 * Used by নোটিশ, কার্যক্রম, কর্মসূচি, কমিটি and গ্যালারি so the five screens behave
 * exactly the same way, and every write goes through `services/contentService`.
 */
export function ContentAdmin<T extends { id: string }>({
  title,
  description,
  addLabel,
  load,
  columns,
  fields,
  blank,
  toForm,
  save,
  remove,
  publish,
  emptyTitle,
}: Props<T>) {
  const { t } = useI18n();
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useAsyncList(load, [version]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(blank);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  function reload() {
    setVersion((value) => value + 1);
  }

  function startCreate() {
    setEditingId(null);
    setForm(blank);
    setNote(null);
    setOpen(true);
  }

  function startEdit(item: T) {
    setEditingId(item.id);
    setForm({ ...blank, ...toForm(item) });
    setNote(null);
    setOpen(true);
  }

  function setValue(name: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    for (const field of fields) {
      if (!field.required) continue;
      const value = form[field.name];
      if (typeof value === 'string' && value.trim() === '') {
        setNote({ tone: 'bad', text: `${field.label} — ${t('admin.fieldRequired')}` });
        return;
      }
    }
    setBusy(true);
    setNote(null);
    try {
      const payload: FormValues = { ...form };
      for (const field of fields) {
        if (field.type === 'number' && typeof payload[field.name] === 'string') {
          const num = Number(String(payload[field.name]).trim());
          payload[field.name] = Number.isFinite(num) ? num : 0;
        }
      }
      await save(payload, editingId);
      setOpen(false);
      reload();
      setNote({ tone: 'ok', text: t('admin.saved') });
    } catch (err) {
      setNote({ tone: 'bad', text: `${t('admin.saveFailed')} ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(item: T) {
    if (!publish) return;
    setBusyId(item.id);
    setNote(null);
    try {
      await publish.toggle(item);
      reload();
    } catch (err) {
      setNote({ tone: 'bad', text: `${t('admin.saveFailed')} ${(err as Error).message}` });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: T, label: string) {
    if (!remove) return;
    if (!window.confirm(`${t('admin.confirmDelete')}\n\n${label}`)) return;
    setBusyId(item.id);
    setNote(null);
    try {
      await remove(item);
      reload();
      setNote({ tone: 'ok', text: t('admin.deleted') });
    } catch (err) {
      setNote({ tone: 'bad', text: `${t('admin.saveFailed')} ${(err as Error).message}` });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-bold text-brand-950">{title}</h1>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        <Button size="sm" onClick={startCreate}>
          + {addLabel}
        </Button>
      </div>

      {note && (
        <p
          className={cn(
            'rounded-xl px-4 py-2 text-sm',
            note.tone === 'ok' ? 'bg-brand-50 text-brand-900' : 'bg-rose-50 text-rose-700',
          )}
        >
          {note.text}
        </p>
      )}
      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="skeleton h-24 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="card p-5">
          <EmptyState title={emptyTitle ?? t('admin.noItems')} />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {data.map((item) => {
            const published = publish ? publish.isPublished(item) : undefined;
            return (
              <li key={item.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-brand-950">{columns[0]?.cell(item)}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {columns.slice(1).map((column) => (
                        <span key={column.header}>
                          <span className="text-slate-400">{column.header}: </span>
                          {column.cell(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {published !== undefined && (
                    <Badge tone={published ? 'green' : 'slate'}>{published ? t('admin.published') : t('admin.draft')}</Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    {t('admin.edit')}
                  </Button>
                  {publish && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => void handleToggle(item)}
                    >
                      {published ? t('admin.unpublish') : t('admin.publish')}
                    </Button>
                  )}
                  {remove && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyId === item.id}
                      onClick={() => void handleDelete(item, String(columns[0]?.cell(item) ?? item.id))}
                    >
                      {t('admin.delete')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={open}
        title={editingId ? `${title} — ${t('admin.edit')}` : `${title} — ${addLabel}`}
        description={t('admin.formLead')}
        onClose={() => setOpen(false)}
        wide
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setOpen(false)} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" type="submit" form="content-form" disabled={busy}>
              {busy ? t('admin.saving') : t('common.save')}
            </Button>
          </div>
        }
      >
        <form id="content-form" onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={form[field.name]}
              onChange={(value) => setValue(field.name, value)}
            />
          ))}
        </form>
      </Modal>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string | boolean | number | undefined;
  onChange: (value: string | boolean | number) => void;
}) {
  const { t } = useI18n();
  const id = `field-${field.name}`;
  const type = field.type ?? 'text';
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const label = `${field.label}${field.required ? ' *' : ''}`;

  if (type === 'checkbox') {
    return (
      <div className={cn(field.wide && 'sm:col-span-2')}>
        <label htmlFor={id} className="flex items-start gap-2 text-sm font-medium text-slate-700">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>
            {field.label}
            {field.hint && <span className="ml-1 text-xs font-normal text-slate-400">({field.hint})</span>}
          </span>
        </label>
      </div>
    );
  }

  const text = typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);

  return (
    <div className={cn((field.wide || type === 'textarea' || type === 'image') && 'sm:col-span-2')}>
      <Label htmlFor={id} hint={field.hint}>
        {label}
      </Label>
      {type === 'textarea' ? (
        <Textarea
          id={id}
          value={text}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={field.rows ? undefined : 'min-h-[96px]'}
        />
      ) : type === 'select' ? (
        <Select id={id} value={text} onChange={(event) => onChange(event.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : type === 'image' ? (
        <div className="space-y-2">
          <Input
            id={id}
            value={text}
            placeholder="ছবির লিংক (https://…)"
            onChange={(event) => onChange(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*"
              className="block w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setUploadError(null);
                setUploading(true);
                uploadDocument(file, field.label)
                  .then((stored) => onChange(documentUrl(stored.key)))
                  .catch(() => setUploadError(t('admin.uploadFailed')))
                  .finally(() => setUploading(false));
              }}
            />
            {uploading && <span className="text-xs text-slate-500">{t('admin.uploading')}</span>}
          </div>
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
          {text && (
            <img
              src={text}
              alt="preview"
              className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
              loading="lazy"
            />
          )}
        </div>
      ) : (
        <Input
          id={id}
          type={type === 'datetime' ? 'datetime-local' : type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
          value={text}
          min={field.min}
          placeholder={field.placeholder}
          inputMode={type === 'number' ? 'numeric' : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
