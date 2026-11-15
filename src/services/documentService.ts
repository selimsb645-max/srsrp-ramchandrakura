/**
 * সদস্যপদের কাগজপত্র আপলোড।
 *
 * ফাইলগুলো Firebase Storage-এ রাখা হয় না (প্রজেক্টে billing ছাড়া bucket তৈরি করা যায় না)।
 * Cloudflare Worker-এর KV স্টোরে র‍্যান্ডম কী দিয়ে রাখা হয়, আর Firestore-এ শুধু কী-টা
 * লেখা থাকে। কী-টা গোপন, তাই লিংক না জানলে কেউ কাগজপত্র দেখতে পারে না।
 */

const DOC_ENDPOINT = 'https://srsrp-reset-mailer.selimsb645.workers.dev/doc';
const MAX_BYTES = 3 * 1024 * 1024;

export interface StoredDocument {
  label: string;
  name: string;
  key: string;
  type: string;
  size: number;
}

export function documentUrl(key: string): string {
  return `${DOC_ENDPOINT}/${key}`;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('DOC_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

/** মোবাইল ক্যামেরার ছবি কয়েক MB হয়, তাই ছবি থাকলে ছোট করে নিই। */
async function shrinkImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size < 700 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadDocument(file: File, label: string): Promise<StoredDocument> {
  const prepared = await shrinkImage(file);
  if (prepared.size > MAX_BYTES) throw new Error('DOC_TOO_BIG');

  const dataUrl = await readAsDataUrl(prepared);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const type = prepared.type || file.type || 'application/octet-stream';

  const response = await fetch(DOC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, type, label, data: base64 }),
  });
  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; key?: string; type?: string; size?: number; code?: string }
    | null;
  if (!response.ok || !result?.ok || !result.key) {
    throw new Error(result?.code === 'TOO_BIG' ? 'DOC_TOO_BIG' : 'DOC_UPLOAD_FAILED');
  }
  return {
    label,
    name: file.name,
    key: result.key,
    type: result.type ?? type,
    size: result.size ?? prepared.size,
  };
}

export async function uploadDocuments(entries: { file: File; label: string }[]): Promise<StoredDocument[]> {
  const stored: StoredDocument[] = [];
  for (const entry of entries) {
    stored.push(await uploadDocument(entry.file, entry.label));
  }
  return stored;
}
