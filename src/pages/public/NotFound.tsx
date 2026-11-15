import { useI18n } from '@/i18n';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-6xl font-bold text-brand-200">৪০৪</p>
      <h1 className="mt-3 text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-slate-600">{t('notFound.body')}</p>
      <ButtonLink to="/" className="mt-6">
        {t('notFound.home')}
      </ButtonLink>
    </Container>
  );
}
