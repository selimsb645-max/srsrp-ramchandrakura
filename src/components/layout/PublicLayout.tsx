import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackBar } from '@/components/shared/BackButton';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/60">
      <Header />
      <BackBar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
