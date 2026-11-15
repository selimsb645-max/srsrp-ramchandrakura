import { PortalLayout } from './PortalLayout';
import { useAuth } from '@/context/AuthContext';

interface Tab {
  to: string;
  labelKey: string;
  end?: boolean;
}

const CONTENT_TABS: Tab[] = [
  { to: '/admin', labelKey: 'admin.tab.overview', end: true },
  { to: '/admin/activities', labelKey: 'admin.tab.activities' },
  { to: '/admin/notices', labelKey: 'admin.tab.notices' },
  { to: '/admin/events', labelKey: 'admin.tab.events' },
  { to: '/admin/committee', labelKey: 'admin.tab.committee' },
];

const ADMIN_TABS: Tab[] = [
  { to: '/admin/members', labelKey: 'admin.tab.members' },
  { to: '/admin/applications', labelKey: 'admin.tab.applications' },
  { to: '/admin/messages', labelKey: 'admin.tab.messages' },
  { to: '/admin/audit', labelKey: 'admin.tab.audit' },
];

/**
 * Tabs are filtered by role for clarity only. The matching routes are wrapped in
 * <StaffRoute roles={…}> and firestore.rules reject the reads regardless.
 */
export function AdminLayout() {
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? [...CONTENT_TABS, ...ADMIN_TABS] : CONTENT_TABS;
  return (
    <PortalLayout titleKey="admin.title" tabs={tabs} />
  );
}
