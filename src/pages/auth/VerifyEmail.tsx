/**
 * Email verification landing page.
 *
 * The receipt mail links here (not to Firebase's blue hosted page). The one-time code is
 * applied with applyActionCode; a code that was already used or has expired is reported
 * honestly as "already verified" instead of an error, so pressing the mail button twice is
 * harmless and clear.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Spinner } from '@/components/ui/Spinner';
import { Logo } from '@/components/shared/Logo';

type State = 'working' | 'done' | 'already' | 'invalid';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [state, setState] = useState<State>('working');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // React strict mode runs effects twice; a code works once
    ran.current = true;
    const code = params.get('oobCode');
    if (!code || !auth) {
      setState('invalid');
      return;
    }
    applyActionCode(auth, code)
      .then(() => setState('done'))
      .catch((error: { code?: string }) => {
        // a used or expired code means the link was already followed
        if (error?.code === 'auth/invalid-action-code' || error?.code === 'auth/expired-action-code') {
          setState('already');
        } else {
          setState('invalid');
        }
      });
  }, [params]);

  const content: Record<State, { icon: string; tone: string; title: string; body: string }> = {
    working: { icon: '', tone: '', title: 'যাচাই করা হচ্ছে…', body: 'একটু অপেক্ষা করুন।' },
    done: {
      icon: '✓',
      tone: 'bg-leaf-100 text-leaf-700',
      title: 'ইমেইল সফলভাবে যাচাই হয়েছে',
      body: 'ধন্যবাদ। আপনার সদস্যপদ আবেদন কমিটির যাচাইয়ের অপেক্ষায় আছে। অনুমোদন হলে সদস্য নম্বর, কার্ড ও সনদ পাবেন।',
    },
    already: {
      icon: '✓',
      tone: 'bg-brand-100 text-brand-800',
      title: 'ইমেইল ইতিমধ্যে যাচাই করা হয়েছে',
      body: 'এই লিংকটি একবারই ব্যবহার করা যায়। আপনার ইমেইল আগেই যাচাই হয়ে গেছে, নতুন করে কিছু করতে হবে না।',
    },
    invalid: {
      icon: '!',
      tone: 'bg-amber-100 text-amber-700',
      title: 'লিংকটি কাজ করেনি',
      body: 'লিংকটি অসম্পূর্ণ বা মেয়াদোত্তীর্ণ হতে পারে। মেইল থেকে সরাসরি লিংকে চাপ দিন, অথবা কমিটির সাথে যোগাযোগ করুন।',
    },
  };
  const view = content[state];

  return (
    <section className="flex min-h-dvh items-center bg-slate-50 py-10">
      <Container className="max-w-md">
        <div className="card p-6 text-center sm:p-8">
          <div className="mb-5 flex justify-center">
            <Logo withText={false} />
          </div>
          {state === 'working' ? (
            <div className="flex justify-center py-3"><Spinner /></div>
          ) : (
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${view.tone}`}>
              {view.icon}
            </span>
          )}
          <h1 className="mt-4 font-display text-xl font-bold text-brand-950">{view.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{view.body}</p>
          {state !== 'working' && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to={user ? '/pending' : '/login'}
                className="inline-flex items-center justify-center rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
              >
                {user ? 'আবেদনের অবস্থা দেখুন' : 'লগইন করুন'}
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-slate-50"
              >
                মূল পাতায় যান
              </Link>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
