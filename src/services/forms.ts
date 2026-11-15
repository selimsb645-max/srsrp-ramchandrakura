/** Write helpers used by the public contact form and the membership form. */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { ContactMessage } from '@/types';

export async function submitContactMessage(
  input: Omit<ContactMessage, 'id' | 'createdAt' | 'handled'>,
): Promise<void> {
  const firestore = requireDb();
  await addDoc(collection(firestore, COLLECTIONS.contactMessages), {
    name: input.name.trim(),
    email: input.email ?? '',
    phone: input.phone ?? '',
    subject: input.subject.trim(),
    message: input.message.trim(),
    handled: false,
    createdAt: serverTimestamp(),
  });
}
