/**
 * React Router setup
 * Source: tech_stack.md §4.1 — React Router (pinned in AGENTS.md)
 *
 * Public routes run without the app shell.
 * Authenticated routes are wrapped in the shell layout under /app.
 * Routes are code-split and lazy-loaded via React.lazy and Suspense.
 */
import React, { Suspense, lazy, useState, type ReactNode } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { ResponsiveShell } from '@/app/layout/responsive-shell';
import { SpeedModeShell } from '@/app/layout/speed-mode-shell';
import { GlobalOverlays } from '@/app/overlays/global-overlays';
import { LandingPage } from '@/features/landing/landing-page';
import { SignInPage } from '@/features/auth/sign-in-page';
import { InviteLandingPage } from '@/features/invite/invite-landing-page';
import { PlaybookBrowsePage } from '@/features/playbooks/playbook-browse-page';
import { PlaybookDetailPage } from '@/features/playbooks/playbook-detail-page';
import { SituationPickerPage } from '@/features/onboarding/situation-picker-page';
import { CreateRoomWizard } from '@/features/onboarding/create-room-wizard';
import { PlaybooksView } from '@/features/playbooks/playbooks-view';
import { ToolDirectoryView } from '@/features/tools/tool-directory-view';
import { isModuleHidden } from '@/config/featureFlags';
import { RoomErrorBoundary } from '@/shared/ui/RoomErrorBoundary';
import {
  NotFoundPage,
  ForbiddenPage,
  ServerErrorPage,
  OfflinePage,
  MaintenancePage,
} from '@/features/system-pages/system-pages';

// Lazy-loaded app and room pages
const HomePage = lazy(() => import('@/features/home/home-page').then((m) => ({ default: m.HomePage })));
const RoomOverviewPage = lazy(() =>
  import('@/features/room-overview/room-overview-page').then((m) => ({ default: m.RoomOverviewPage }))
);
const BriefPage = lazy(() => import('@/features/brief/brief-page').then((m) => ({ default: m.BriefPage })));
const TeamPage = lazy(() => import('@/features/team/team-page').then((m) => ({ default: m.TeamPage })));
const IdeatePage = lazy(() => import('@/features/ideate/ideate-page').then((m) => ({ default: m.IdeatePage })));
const PlanPage = lazy(() => import('@/features/plan/plan-page').then((m) => ({ default: m.PlanPage })));
const DocsPage = lazy(() => import('@/features/docs/docs-page').then((m) => ({ default: m.DocsPage })));
const BoardPage = lazy(() => import('@/features/board/board-page').then((m) => ({ default: m.BoardPage })));
const SchedulePage = lazy(() =>
  import('@/features/schedule/schedule-page').then((m) => ({ default: m.SchedulePage }))
);
const MvpPage = lazy(() => import('@/features/mvp/mvp-page').then((m) => ({ default: m.MvpPage })));
const GithubPage = lazy(() => import('@/features/github/github-page').then((m) => ({ default: m.GithubPage })));
const ApiPage = lazy(() => import('@/features/apis/api-page').then((m) => ({ default: m.ApiPage })));
const DiagramPage = lazy(() =>
  import('@/features/diagrams/diagram-page').then((m) => ({ default: m.DiagramPage }))
);
const PitchPage = lazy(() => import('@/features/pitch/pitch-page').then((m) => ({ default: m.PitchPage })));
const DemoPage = lazy(() => import('@/features/demo/demo-page').then((m) => ({ default: m.DemoPage })));
const SubmissionPage = lazy(() =>
  import('@/features/submission/submission-page').then((m) => ({ default: m.SubmissionPage }))
);
const ReadinessPage = lazy(() =>
  import('@/features/readiness/readiness-page').then((m) => ({ default: m.ReadinessPage }))
);
const RetroPage = lazy(() => import('@/features/retro/retro-page').then((m) => ({ default: m.RetroPage })));
const PrepPage = lazy(() => import('@/features/prep/prep-page').then((m) => ({ default: m.PrepPage })));
const CrowdCheckPage = lazy(() =>
  import('@/features/prep/crowd-check-page').then((m) => ({ default: m.CrowdCheckPage }))
);
const SettingsPage = lazy(() =>
  import('@/features/settings/settings-page').then((m) => ({ default: m.SettingsPage }))
);
const SettingsIndexRedirect = lazy(() =>
  import('@/features/settings/settings-page').then((m) => ({ default: m.SettingsIndexRedirect }))
);
const ProfileSection = lazy(() =>
  import('@/features/settings/sections/profile-section').then((m) => ({ default: m.ProfileSection }))
);
const AppearanceSection = lazy(() =>
  import('@/features/settings/sections/appearance-section').then((m) => ({ default: m.AppearanceSection }))
);
const NotificationsSection = lazy(() =>
  import('@/features/settings/sections/notifications-section').then((m) => ({ default: m.NotificationsSection }))
);
const IntegrationsSection = lazy(() =>
  import('@/features/settings/sections/integrations-section').then((m) => ({ default: m.IntegrationsSection }))
);
const AiKeysSection = lazy(() =>
  import('@/features/settings/sections/ai-keys-section').then((m) => ({ default: m.AiKeysSection }))
);
const PrivacySection = lazy(() =>
  import('@/features/settings/sections/privacy-section').then((m) => ({ default: m.PrivacySection }))
);
const BillingSection = lazy(() =>
  import('@/features/settings/sections/billing-section').then((m) => ({ default: m.BillingSection }))
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications/notifications-page').then((m) => ({ default: m.NotificationsPage }))
);
const MentorPage = lazy(() => import('@/features/mentor/mentor-page').then((m) => ({ default: m.MentorPage })));
const SpeedModePage = lazy(() =>
  import('@/features/speed-mode/speed-mode-page').then((m) => ({ default: m.SpeedModePage }))
);
const MyRoomsPage = lazy(() => import('@/features/room/my-rooms-page').then((m) => ({ default: m.MyRoomsPage })));
const SocialDashboard = lazy(() =>
  import('@/features/prototypes/social-dashboard').then((m) => ({ default: m.SocialDashboard }))
);
const CalendarDashboard = lazy(() =>
  import('@/features/prototypes/calendar-dashboard').then((m) => ({ default: m.CalendarDashboard }))
);

// Dynamic dev tool loading: only loaded in DEV mode
const DevIconsPreviewPage = import.meta.env.DEV
  ? lazy(() =>
      import('@/components/icons/dev-icons-preview-page').then((m) => ({ default: m.DevIconsPreviewPage }))
    )
  : NotFoundPage;

const DevFlowPage = import.meta.env.DEV
  ? lazy(() => import('@/features/dev/dev-flow-page').then((m) => ({ default: m.DevFlowPage })))
  : NotFoundPage;

function PageSuspenseFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8 text-sm text-ink-muted animate-pulse">
      Loading...
    </div>
  );
}

function HiddenModuleRoute({ moduleId, element }: { moduleId: string; element: React.ReactElement }) {
  const { roomId } = useParams<{ roomId: string }>();
  if (isModuleHidden(moduleId)) {
    return <Navigate to={`/app/room/${roomId}/overview`} replace />;
  }
  return element;
}

/** Layout route for non-room app pages (like Home) */
function HomeShellLayout() {
  const location = useLocation();
  const pageName = (() => {
    const path = location.pathname;
    if (path.startsWith('/app/playbooks')) return 'Playbooks';
    if (path.startsWith('/app/tools')) return 'Tool directory';
    if (path.startsWith('/app/rooms')) return 'My rooms';
    if (path.startsWith('/app/settings')) return 'Settings';
    if (path.startsWith('/app/portfolio')) return 'Portfolio';
    if (path.startsWith('/app/notifications')) return 'Notifications';
    return 'Home';
  })();

  return (
    <ResponsiveShell showPhaseTrack={false} pageName={pageName}>
      <GlobalOverlays />
      <Suspense fallback={<PageSuspenseFallback />}>
        <Outlet />
      </Suspense>
    </ResponsiveShell>
  );
}

import { toast } from 'sonner';
import { isUuid } from '@/shared/lib/uuid';

/** Layout route for room pages */
function RoomShellLayout() {
  const [rightRail, setRightRail] = useState<ReactNode>(null);
  const location = useLocation();
  const { roomId } = useParams<{ roomId?: string }>();

  if (!roomId || !isUuid(roomId)) {
    toast.error('That room link is not valid');
    return <Navigate to="/app/rooms" replace />;
  }

  return (
    <ResponsiveShell showPhaseTrack={true} pageName="Overview" rightRail={rightRail}>
      <GlobalOverlays />
      <RoomErrorBoundary key={location.pathname}>
        <Suspense fallback={<PageSuspenseFallback />}>
          <Outlet context={{ setRightRail }} />
        </Suspense>
      </RoomErrorBoundary>
    </ResponsiveShell>
  );
}

/** Speed Mode layout route */
function SpeedModeLayout() {
  return (
    <SpeedModeShell>
      <GlobalOverlays />
      <Suspense fallback={<PageSuspenseFallback />}>
        <Outlet />
      </Suspense>
    </SpeedModeShell>
  );
}

/** Placeholder page */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-h1 mb-2">{title}</h1>
      <p className="text-body text-ink-muted">
        This screen will be built in a later phase.
      </p>
    </div>
  );
}

const router = createBrowserRouter([
  // ── Prototypes ────────────────────────────────────────────────
  {
    path: '/prototypes/social',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <SocialDashboard />
      </Suspense>
    ),
  },
  {
    path: '/prototypes/calendar',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <CalendarDashboard />
      </Suspense>
    ),
  },

  // ── Public routes (no app shell) ──────────────────────────────
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/login',
    element: <SignInPage />,
  },
  {
    path: '/invite/:token',
    element: <InviteLandingPage />,
  },
  {
    path: '/playbooks',
    element: <PlaybookBrowsePage />,
  },
  {
    path: '/playbooks/:slug',
    element: <PlaybookDetailPage />,
  },

  // ── Authenticated routes (with shell) ─────────────────────────
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <HomeShellLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'home', element: <HomePage /> },
      { path: 'situation', element: <SituationPickerPage /> },
      { path: 'create-room', element: <CreateRoomWizard /> },
      { path: 'rooms', element: <MyRoomsPage /> },
      { path: 'playbooks', element: <PlaybooksView /> },
      { path: 'playbooks/:slug', element: <PlaybookDetailPage /> },
      { path: 'tools', element: <ToolDirectoryView /> },
      { path: 'portfolio', element: <PlaceholderPage title="Portfolio" /> },
      {
        path: 'settings',
        element: <SettingsPage />,
        children: [
          { index: true, element: <SettingsIndexRedirect /> },
          { path: 'profile', element: <ProfileSection /> },
          { path: 'appearance', element: <AppearanceSection /> },
          { path: 'notifications', element: <NotificationsSection /> },
          { path: 'integrations', element: <IntegrationsSection /> },
          { path: 'ai-keys', element: <AiKeysSection /> },
          { path: 'privacy', element: <PrivacySection /> },
          { path: 'billing', element: <BillingSection /> },
        ],
      },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  {
    path: '/app/room/:roomId',
    element: (
      <ProtectedRoute>
        <RoomShellLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoomOverviewPage /> },
      { path: 'overview', element: <RoomOverviewPage /> },
      { path: 'brief', element: <BriefPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'prep', element: <HiddenModuleRoute moduleId="prep" element={<PrepPage />} /> },
      {
        path: 'crowd-check',
        element: <HiddenModuleRoute moduleId="crowd-check" element={<CrowdCheckPage />} />,
      },
      { path: 'ideate', element: <IdeatePage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: 'board', element: <BoardPage /> },
      {
        path: 'schedule',
        element: <HiddenModuleRoute moduleId="schedule" element={<SchedulePage />} />,
      },
      { path: 'mvp', element: <MvpPage /> },
      { path: 'github', element: <GithubPage /> },
      { path: 'apis', element: <ApiPage /> },
      { path: 'diagrams', element: <DiagramPage /> },
      { path: 'pitch', element: <PitchPage /> },
      { path: 'pitch/deck', element: <PitchPage /> },
      { path: 'pitch/rehearse', element: <PitchPage /> },
      { path: 'pitch/qa', element: <PitchPage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'submit', element: <SubmissionPage /> },
      { path: 'submission', element: <SubmissionPage /> },
      { path: 'readiness', element: <ReadinessPage /> },
      { path: 'retro', element: <RetroPage /> },
      { path: 'speed-mode', element: <SpeedModePage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  // S30 Mentor view
  {
    path: '/mentor/:token',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <MentorPage />
      </Suspense>
    ),
  },
  // S31 Speed Mode
  {
    path: '/speed-mode',
    element: <SpeedModeLayout />,
    children: [
      { index: true, element: <SpeedModePage /> },
      { path: ':roomId', element: <SpeedModePage /> },
    ],
  },
  // Dev-only preview route for icons
  {
    path: '/dev/icons',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <DevIconsPreviewPage />
      </Suspense>
    ),
  },
  // Dev-only flow test panel
  {
    path: '/dev/flow',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <DevFlowPage />
      </Suspense>
    ),
  },
  // S32 System pages
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '/offline', element: <OfflinePage /> },
  { path: '/maintenance', element: <MaintenancePage /> },
  // 404 catch-all
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
