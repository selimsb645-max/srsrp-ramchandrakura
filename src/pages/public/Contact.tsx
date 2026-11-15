import { useState, type FormEvent } from 'react';
import { site } from '@/config/site';
import { useI18n } from '@/i18n';
import { isPlaceholder } from '@/lib/utils';
import { submitContactMessage } from '@/services/forms';
import { isFirebaseConfigured } from '@/lib/firebase';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { BackendNotice } from '@/components/shared/BackendNotice';

export function ContactPage() {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const rows = [
    { label: t('contact.address'), value: lang === 'bn' ? site.contact.addressBn : site.contact.addressEn },
    { label: t('contact.phone'), value: site.contact.phone },
    { label: t('contact.email'), value: site.contact.email },
    { label: t('contact.hours'), value: site.contact.officeHoursBn },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus('sending');
    try {
      await submitContactMessage({
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        subject: String(formData.get('subject') ?? ''),
        message: String(formData.get('message') ?? ''),
      });
      form.reset();
      setStatus('sent');
    } catch (error) {
      setStatus('error');
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <>
      <PageHero title={t('contact.title')} description={t('contact.lead')} />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {rows.map((row) => (
                <div key={row.label} className="px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.label}</p>
                  <p className={isPlaceholder(row.value) ? 'mt-1 text-sm italic text-amber-700' : 'mt-1 text-[15px] text-slate-800'}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <p className="text-sm text-slate-600">{t('contact.formNote')}</p>
              <a
                href={site.links.officialFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:underline"
              >
                {lang === 'bn' ? 'অফিসিয়াল ফেসবুক পেজ' : 'Official Facebook page'} →
              </a>
            </div>
          </div>

          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-950">{t('contact.formTitle')}</h2>
            {!isFirebaseConfigured ? (
              <div className="mt-4"><BackendNotice /></div>
            ) : status === 'sent' ? (
              <div className="mt-4 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm text-leaf-800">
                {t('contact.success')}
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="name">{t('contact.name')}</Label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="email" hint={t('common.optional')}>
                      {t('auth.email')}
                    </Label>
                    <Input id="email" name="email" type="email" autoComplete="email" />
                  </div>
                  <div>
                    <Label htmlFor="phone" hint={t('common.optional')}>
                      {t('contact.phone')}
                    </Label>
                    <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">{t('contact.subject')}</Label>
                  <Input id="subject" name="subject" required />
                </div>
                <div>
                  <Label htmlFor="message">{t('contact.message')}</Label>
                  <Textarea id="message" name="message" required rows={6} />
                </div>
                {status === 'error' && <p className="text-sm text-rose-600">{errorMessage || t('common.error')}</p>}
                <Button type="submit" full disabled={status === 'sending'}>
                  {status === 'sending' ? <Spinner className="h-4 w-4" /> : null}
                  {t('common.submit')}
                </Button>
              </form>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}
