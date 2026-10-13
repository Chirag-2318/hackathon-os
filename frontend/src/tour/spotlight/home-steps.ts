import type { SpotlightStep } from './types';

export function getHomeTourSteps(hasRooms: boolean): SpotlightStep[] {
  if (hasRooms) {
    return [
      {
        target: 'nav-rooms',
        title: 'My Rooms',
        body: 'This is your base. Every room you lead or join lives under My rooms.',
      },
      {
        target: 'search-box',
        title: 'Quick Search',
        body: 'Press Ctrl K anywhere to jump to any room, page or task.',
        tryItKey: 'ctrl-k',
      },
      {
        target: 'top-notifications',
        title: 'Notifications & Profile',
        body: 'Updates and your profile live up here.',
      },
      {
        title: "You're all set",
        body: 'Jump into your rooms or press Ctrl K anytime to navigate.',
        isFinale: true,
      },
    ];
  }

  return [
    {
      target: 'nav-rooms',
      title: 'Your Base',
      body: 'This is your base. Every room you lead or join lives under My rooms.',
    },
    {
      target: 'create-room-btn',
      title: 'Create a Room',
      body: 'Starting a team? Create a room. It takes under a minute.',
    },
    {
      target: 'join-room-btn',
      title: 'Join with Code',
      body: 'Teammate sent you a code? Paste it here.',
    },
    {
      target: 'nav-playbooks',
      title: 'Playbooks & Tools',
      body: "Templates and tools, curated so you don't hunt for them.",
    },
    {
      target: 'search-box',
      title: 'Quick Search',
      body: 'Press Ctrl K anywhere to jump to any room, page or task.',
      tryItKey: 'ctrl-k',
    },
    {
      target: 'top-notifications',
      title: 'Updates & Profile',
      body: 'Updates and your profile live up here.',
    },
    {
      title: "That's the tour",
      body: 'Create a room or join one to begin.',
      isFinale: true,
    },
  ];
}
