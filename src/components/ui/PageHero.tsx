import type { ReactNode } from 'react';
import { Container } from './Container';

export function PageHero({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #34d178 0, transparent 42%), radial-gradient(circle at 85% 10%, #93b4ff 0, transparent 38%)',
        }}
      />
      <Container className="relative py-12 sm:py-16">
        <div className="max-w-3xl animate-fade-up">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-[16px] leading-relaxed text-brand-100">{description}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
