import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackButton } from '@/components/shared/BackButton';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/60">
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackButton />
    </div>
  );
}
