import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { AdminRoute, ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { HomePage } from '@/pages/public/Home';
import { AboutPage } from '@/pages/public/About';
import { CommitteePage } from '@/pages/public/Committee';
import { MembersPage } from '@/pages/public/Members';
import { ActivitiesPage } from '@/pages/public/Activities';
import { EventsPage } from '@/pages/public/Events';
import { NoticesPage } from '@/pages/public/Notices';
import { GalleryPage } from '@/pages/public/Gallery';
import { ContactPage } from '@/pages/public/Contact';
import { NotFoundPage } from '@/pages/public/NotFound';
import { LoginPage } from '@/pages/auth/Login';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { MemberDashboardPage } from '@/pages/member/Dashboard';
import { MemberProfilePage } from '@/pages/member/Profile';
import {
  AdminActivities,
  AdminCommittee,
  AdminMembers,
  AdminMessages,
  AdminNotices,
  AdminOverview,
  AdminRequests,
} from '@/pages/admin/AdminScreens';

const memberTabs = [
  { to: '/portal', labelKey: 'member.dashboard', end: true },
  { to: '/portal/profile', labelKey: 'member.profile' },
];

const adminTabs = [
  { to: '/admin', labelKey: 'admin.tab.overview', end: true },
  { to: '/admin/members', labelKey: 'admin.tab.members' },
  { to: '/admin/committee', labelKey: 'admin.tab.committee' },
  { to: '/admin/activities', labelKey: 'admin.tab.activities' },
  { to: '/admin/notices', labelKey: 'admin.tab.notices' },
  { to: '/admin/messages', labelKey: 'admin.tab.messages' },
  { to: '/admin/requests', labelKey: 'admin.tab.requests' },
];

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/committee" element={<CommitteePage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <PortalLayout titleKey="member.dashboard" tabs={memberTabs} />
                </ProtectedRoute>
              }
            >
              <Route path="/portal" element={<MemberDashboardPage />} />
              <Route path="/portal/profile" element={<MemberProfilePage />} />
            </Route>

            <Route
              element={
                <AdminRoute>
                  <PortalLayout titleKey="admin.title" tabs={adminTabs} />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/committee" element={<AdminCommittee />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
              <Route path="/admin/notices" element={<AdminNotices />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}
