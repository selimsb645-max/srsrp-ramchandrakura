import { PortalLayout } from './PortalLayout';

const MEMBER_TABS = [
  { to: '/portal', labelKey: 'member.dashboard', end: true },
  { to: '/portal/profile', labelKey: 'member.profile' },
  { to: '/portal/card', labelKey: 'member.tab.card' },
  { to: '/portal/certificate', labelKey: 'member.tab.certificate' },
  { to: '/portal/directory', labelKey: 'member.tab.directory' },
];

export function MemberLayout() {
  return (
    <PortalLayout titleKey="member.dashboard" tabs={MEMBER_TABS} />
  );
}
