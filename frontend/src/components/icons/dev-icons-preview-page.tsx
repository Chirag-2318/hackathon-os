import * as React from 'react';
import {
  HomeIcon,
  MyRoomsIcon,
  PlaybooksIcon,
  ToolDirectoryIcon,
  PortfolioIcon,
  SettingsIcon,
  CollapseLeftIcon,
  CollapseRightIcon,
  BackArrowIcon,
  OverviewIcon,
  TeamIcon,
  SpeedModeIcon,
  PrepIcon,
  BriefIcon,
  IdeateIcon,
  CrowdCheckIcon,
  PlanIcon,
  BoardIcon,
  ScheduleIcon,
  MvpStudioIcon,
  DocsIcon,
  GithubIcon,
  ApiHubIcon,
  DiagramsIcon,
  PitchDeckIcon,
  RehearseIcon,
  QaIcon,
  DemoIcon,
  SubmissionIcon,
  ReadinessIcon,
  RetroIcon,
  InviteIcon,
  GroupChevronIcon,
  BellIcon,
  SearchIcon,
  LogoutIcon,
  CopyLinkIcon,
} from './nav-icons';

interface IconEntry {
  name: string;
  category: string;
  spec: string;
  render: (size: number) => React.ReactNode;
}

const ICONS: IconEntry[] = [
  {
    name: 'Home',
    category: 'Global',
    spec: 'Roof lifts 1.5px while door scales up slightly',
    render: (size) => <HomeIcon size={size} />,
  },
  {
    name: 'My rooms',
    category: 'Global',
    spec: 'Squares spread outward',
    render: (size) => <MyRoomsIcon size={size} />,
  },
  {
    name: 'Playbooks',
    category: 'Global',
    spec: 'Download arrow slides down 3px and returns, tray stays',
    render: (size) => <PlaybooksIcon size={size} />,
  },
  {
    name: 'Tool directory',
    category: 'Global',
    spec: 'Wrench rotates -18deg',
    render: (size) => <ToolDirectoryIcon size={size} />,
  },
  {
    name: 'Portfolio',
    category: 'Global',
    spec: 'Briefcase handle pops up 2px, lid shifts up 1px',
    render: (size) => <PortfolioIcon size={size} />,
  },
  {
    name: 'Settings',
    category: 'Global',
    spec: 'Gear rotates 45deg',
    render: (size) => <SettingsIcon size={size} />,
  },
  {
    name: 'Collapse (Left)',
    category: 'Global',
    spec: 'Chevrons slide 2px left',
    render: (size) => <CollapseLeftIcon size={size} />,
  },
  {
    name: 'Collapse (Right)',
    category: 'Global',
    spec: 'Chevrons slide 2px right',
    render: (size) => <CollapseRightIcon size={size} />,
  },
  {
    name: 'Back arrow (All rooms)',
    category: 'Room Header',
    spec: 'Arrow slides left 3px',
    render: (size) => <BackArrowIcon size={size} />,
  },
  {
    name: 'Invite (user-plus)',
    category: 'Room Header',
    spec: 'Plus rotates 90deg and scales 1.15',
    render: (size) => <InviteIcon size={size} />,
  },
  {
    name: 'Overview',
    category: 'Pinned',
    spec: 'Four tiles swap scale (TL/BR shrink 0.8, TR/BL grow 1.14)',
    render: (size) => <OverviewIcon size={size} />,
  },
  {
    name: 'Team',
    category: 'Pinned',
    spec: 'Avatars slide apart 1.5px and third pops in',
    render: (size) => <TeamIcon size={size} />,
  },
  {
    name: 'Speed mode',
    category: 'Pinned',
    spec: 'Bolt scales 1.12, skews 6deg, glow ring fades in',
    render: (size) => <SpeedModeIcon size={size} />,
  },
  {
    name: 'Prep',
    category: 'PLAN',
    spec: 'Clipboard check mark redraws via stroke-dashoffset',
    render: (size) => <PrepIcon size={size} />,
  },
  {
    name: 'Brief',
    category: 'PLAN',
    spec: 'Text lines extend one after another (staggered)',
    render: (size) => <BriefIcon size={size} />,
  },
  {
    name: 'Ideate',
    category: 'PLAN',
    spec: 'Bulb bobs up 1.5px and ray strokes fade in',
    render: (size) => <IdeateIcon size={size} />,
  },
  {
    name: 'Crowd check',
    category: 'PLAN',
    spec: 'Back person shifts right 2px and extra person pops in',
    render: (size) => <CrowdCheckIcon size={size} />,
  },
  {
    name: 'Plan',
    category: 'PLAN',
    spec: 'Dashed route line redraws and end pin drops 1.5px',
    render: (size) => <PlanIcon size={size} />,
  },
  {
    name: 'Board',
    category: 'BUILD',
    spec: 'Card translates from column 1 to column 2',
    render: (size) => <BoardIcon size={size} />,
  },
  {
    name: 'Schedule',
    category: 'BUILD',
    spec: 'Calendar rings bounce 1px and date dot moves cell',
    render: (size) => <ScheduleIcon size={size} />,
  },
  {
    name: 'MVP studio',
    category: 'BUILD',
    spec: 'Rocket lifts 2px diagonally and flame flickers',
    render: (size) => <MvpStudioIcon size={size} />,
  },
  {
    name: 'Docs',
    category: 'BUILD',
    spec: 'Folder front flap tilts open 12deg',
    render: (size) => <DocsIcon size={size} />,
  },
  {
    name: 'GitHub',
    category: 'TECH',
    spec: 'Branch node slides along branch line',
    render: (size) => <GithubIcon size={size} />,
  },
  {
    name: 'API hub',
    category: 'TECH',
    spec: 'Curly braces spread apart 2px, center dot scales in',
    render: (size) => <ApiHubIcon size={size} />,
  },
  {
    name: 'Diagrams',
    category: 'TECH',
    spec: 'Nodes pulse in sequence, connector lines redraw',
    render: (size) => <DiagramsIcon size={size} />,
  },
  {
    name: 'Pitch deck',
    category: 'PRESENT',
    spec: 'Screen slides up 1px and chart bars grow in sequence',
    render: (size) => <PitchDeckIcon size={size} />,
  },
  {
    name: 'Rehearse',
    category: 'PRESENT',
    spec: 'Mic sound-wave arcs emit outward in sequence',
    render: (size) => <RehearseIcon size={size} />,
  },
  {
    name: 'Q&A',
    category: 'PRESENT',
    spec: 'Bubble wobbles and question mark bounces',
    render: (size) => <QaIcon size={size} />,
  },
  {
    name: 'Demo',
    category: 'PRESENT',
    spec: 'Play triangle nudges right 1.5px and scales 1.1',
    render: (size) => <DemoIcon size={size} />,
  },
  {
    name: 'Submission',
    category: 'PRESENT',
    spec: 'Paper plane flies 4px up-right with short trail, settles',
    render: (size) => <SubmissionIcon size={size} />,
  },
  {
    name: 'Readiness',
    category: 'REVIEW',
    spec: 'Gauge needle sweeps from left to 70%',
    render: (size) => <ReadinessIcon size={size} />,
  },
  {
    name: 'Retro',
    category: 'REVIEW',
    spec: 'History arrow rotates -45deg and returns',
    render: (size) => <RetroIcon size={size} />,
  },
  {
    name: 'Group chevron',
    category: 'Navigation',
    spec: 'Rotates 180deg when open',
    render: (size) => <GroupChevronIcon size={size} isOpen={false} />,
  },
  {
    name: 'Bell (Notifications)',
    category: 'Top Bar',
    spec: 'Wiggles (-12, 10, -6, 0deg over 500ms)',
    render: (size) => <BellIcon size={size} />,
  },
  {
    name: 'Search',
    category: 'Top Bar',
    spec: 'Lens scales 1.08 and tilts -6deg',
    render: (size) => <SearchIcon size={size} />,
  },
  {
    name: 'Log out',
    category: 'Top Bar',
    spec: 'Arrow slides right 3px',
    render: (size) => <LogoutIcon size={size} />,
  },
  {
    name: 'Copy link',
    category: 'Top Bar / Modal',
    spec: 'Link halves slide together 1px, icon scales 1.05',
    render: (size) => <CopyLinkIcon size={size} />,
  },
];

export function DevIconsPreviewPage() {
  const [filter, setFilter] = React.useState('All');
  const categories = ['All', ...Array.from(new Set(ICONS.map((i) => i.category)))];

  const filtered = filter === 'All' ? ICONS : ICONS.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen bg-[var(--shell)] p-8 font-[var(--font-inter)] text-ink">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Icon Hover Animation System</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              Dev Only ({ICONS.length} icons)
            </span>
          </div>
          <p className="text-sm text-ink-2">
            Hover over any card below to test its row-triggered micro-animation. Built with custom inline SVGs and
            cubic-bezier(0.22, 1, 0.36, 1) hardware-accelerated transforms.
          </p>
        </header>

        {/* Filter tags */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === cat
                  ? 'bg-ink text-white'
                  : 'bg-card border border-border text-ink-2 hover:bg-hover hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.name}
              className="group nav-row flex flex-col p-4 rounded-[var(--r-card)] bg-card border border-border hover:border-border-strong hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                  {item.category}
                </span>
                <span className="size-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-surface border border-border flex items-center justify-center text-ink group-hover:bg-hover transition-colors">
                  {item.render(22)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-[11px] text-ink-3">Hover to test</span>
                </div>
              </div>

              <p className="text-xs text-ink-2 bg-surface/60 rounded-md p-2 mt-auto border border-border/50">
                {item.spec}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
