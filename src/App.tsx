import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { ApprovedMemberRoute, PendingOnlyRoute, StaffRoute } from '@/components/shared/ProtectedRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
import { RegisterPage } from '@/pages/auth/Register';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { PendingApprovalPage } from '@/pages/member/PendingApproval';
import { MemberDashboardPage } from '@/pages/member/Dashboard';
import { MemberProfilePage } from '@/pages/member/Profile';
import {
  AdminActivities,
  AdminApplications,
  AdminAuditLogs,
  AdminCommittee,
  AdminEvents,
  AdminMessages,
  AdminNotices,
  AdminOverview,
  AdminUsers,
} from '@/pages/admin/AdminScreens';
import { AdminApplicationDetailPage } from '@/pages/admin/ApplicationDetail';

export default function App() {
  return (
    <I18nProvider>
      {/* basename keeps every route working under the GitHub Pages project path */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/pending"
              element={
                <PendingOnlyRoute>
                  <PendingApprovalPage />
                </PendingOnlyRoute>
              }
            />

            <Route
              element={
                <ApprovedMemberRoute>
                  <MemberLayout />
                </ApprovedMemberRoute>
              }
            >
              <Route path="/portal" element={<MemberDashboardPage />} />
              <Route path="/portal/profile" element={<MemberProfilePage />} />
            </Route>

            <Route
              element={
                <StaffRoute>
                  <AdminLayout />
                </StaffRoute>
              }
            >
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
              <Route path="/admin/notices" element={<AdminNotices />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/committee" element={<AdminCommittee />} />
              <Route
                path="/admin/members"
                element={
                  <StaffRoute roles={['admin', 'super_admin']}>
                    <AdminUsers />
                  </StaffRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <StaffRoute roles={['admin', 'super_admin']}>
                    <AdminApplications />
                  </StaffRoute>
                }
              />
              <Route
                path="/admin/applications/:id"
                element={
                  <StaffRoute roles={['admin', 'super_admin']}>
                    <AdminApplicationDetailPage />
                  </StaffRoute>
                }
              />
              <Route
                path="/admin/messages"
                element={
                  <StaffRoute roles={['admin', 'super_admin']}>
                    <AdminMessages />
                  </StaffRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <StaffRoute roles={['admin', 'super_admin']}>
                    <AdminAuditLogs />
                  </StaffRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}
