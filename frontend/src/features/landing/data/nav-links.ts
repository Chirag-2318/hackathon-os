/**
 * Nav link data for the landing page navigation.
 * Items with `to` are router routes; items with `href` are plain anchors.
 * The "#pricing" anchor points at a pricing section that a later slice adds
 * (section id "pricing"); until then it does nothing, which is expected.
 */

export interface NavLinkItem {
  label: string;
  to?: string;
  href?: string;
}

export const NAV_LINKS: NavLinkItem[] = [
  { label: 'Playbooks', to: '/playbooks' },
  { label: 'Tools', to: '/app/tools' },
  { label: 'Pricing', href: '#pricing' },
];

export const SIGN_IN_LINK: NavLinkItem = { label: 'Sign in', to: '/signin' };

export const START_ROOM_LINK: NavLinkItem = { label: 'Start a room', to: '/signin' };
