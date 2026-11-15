import { PortalLayout } from './PortalLayout';

const MEMBER_TABS = [
  { to: '/portal', labelKey: 'member.dashboard', end: true },
  { to: '/portal/profile', labelKey: 'member.profile' },
];

export function MemberLayout() {
  return (
    <PortalLayout titleKey="member.dashboard" tabs={MEMBER_TABS} />
  );
}
