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
import { GlobalOverlays } from '@/app/overlays/global-overlays';
import { SignInPage } from '@/features/auth/sign-in-page';
import { UnsubscribedPage } from '@/features/auth/unsubscribed-page';
import { GoodbyePage } from '@/features/auth/goodbye-page';
import { InviteLandingPage } from '@/features/invite/invite-landing-page';
import { PlaybookDetailPage } from '@/features/playbooks/playbook-detail-page';
import { SituationPickerPage } from '@/features/onboarding/situation-picker-page';
import { CreateRoomWizard } from '@/features/onboarding/create-room-wizard';
import { OnboardingView } from '@/features/onboarding/onboarding-view';
import { PlaybooksView } from '@/features/playbooks/playbooks-view';
import { ToolDirectoryView } from '@/features/tools/tool-directory-view';
import { isModuleHidden } from '@/config/featureFlags';
import { RoomErrorBoundary } from '@/shared/ui/RoomErrorBoundary';
import { FullPage } from '@/features/public/full-page';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import {
  NotFoundPage,
  ForbiddenPage,
  ServerErrorPage,
  OfflinePage,
  MaintenancePage,
} from '@/features/system-pages/system-pages';

// Lazy-loaded app and room pages
const LandingPage = lazy(() =>
  import('@/features/landing/landing-page').then((m) => ({ default: m.LandingPage }))
);
const AdminOverviewPage = lazy(() =>
  import('@/features/admin/admin-overview-page').then((m) => ({ default: m.AdminOverviewPage }))
);
const HomePage = lazy(() => import('@/features/home/home-page').then((m) => ({ default: m.HomePage })));
const RoomOverviewPage = lazy(() =>
  import('@/features/room-overview/room-overview-page').then((m) => ({ default: m.RoomOverviewPage }))
);
const BriefPage = lazy(() => import('@/features/brief/brief-page').then((m) => ({ default: m.BriefPage })));
const JoinInvitePage = lazy(() =>
  import('@/features/invite/join-invite-page').then((m) => ({ default: m.JoinInvitePage }))
);
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
const DeckPage = lazy(() => import('@/features/deck/deck-page').then((m) => ({ default: m.DeckPage })));
const PitchKitPage = lazy(() => import('@/features/pitch-kit/pitch-kit-page').then((m) => ({ default: m.PitchKitPage })));
const RehearsalResultPage = lazy(() =>
  import('@/features/pitch-kit/rehearsal-result-page').then((m) => ({ default: m.RehearsalResultPage }))
);
const SubmissionPage = lazy(() =>
  import('@/features/submission/submission-page').then((m) => ({ default: m.SubmissionPage }))
);
const ReadinessPage = lazy(() =>
  import('@/features/readiness/readiness-page').then((m) => ({ default: m.ReadinessPage }))
);
const RetroPage = lazy(() => import('@/features/retro/retro-page').then((m) => ({ default: m.RetroPage })));
const RoomSummaryPage = lazy(() =>
  import('@/features/summary/room-summary-page').then((m) => ({ default: m.RoomSummaryPage }))
);
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

const MyRoomsPage = lazy(() => import('@/features/room/my-rooms-page').then((m) => ({ default: m.MyRoomsPage })));
const SocialDashboard = lazy(() =>
  import('@/features/prototypes/social-dashboard').then((m) => ({ default: m.SocialDashboard }))
);
const CalendarDashboard = lazy(() =>
  import('@/features/prototypes/calendar-dashboard').then((m) => ({ default: m.CalendarDashboard }))
);
const PortfolioPage = lazy(() =>
  import('@/features/portfolio/portfolio-page').then((m) => ({ default: m.PortfolioPage }))
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-3 animate-in fade-in duration-200">
      <div className="relative size-10 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin"
          style={{ animationDuration: '650ms' }}
        />
        <span className="font-[var(--font-display)] font-bold text-sm text-indigo-600 dark:text-indigo-400">
          H
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground">
        <span>Initializing room</span>
        <span className="inline-flex gap-0.5">
          <span className="size-1 rounded-full bg-indigo-600 animate-pulse" />
          <span className="size-1 rounded-full bg-indigo-600 animate-pulse [animation-delay:200ms]" />
          <span className="size-1 rounded-full bg-indigo-600 animate-pulse [animation-delay:400ms]" />
        </span>
      </div>
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
    <ResponsiveShell pageName={pageName}>
      <GlobalOverlays />
      <Suspense fallback={<PageSuspenseFallback />}>
        <div key={location.pathname} className="page-transition min-h-full">
          <Outlet />
        </div>
      </Suspense>
    </ResponsiveShell>
  );
}

import { toast } from 'sonner';
import { isUuid } from '@/shared/lib/uuid';
import { useRoomLive, usePresenceHeartbeat, LiveContext } from '@/design';

function RoomsWildcardRedirect() {
  const { roomId, '*': splat } = useParams<{ roomId: string; '*'?: string }>();
  return <Navigate to={`/app/room/${roomId}/${splat || ''}`} replace />;
}

/** Layout route for room pages */
function RoomShellLayout() {
  const [rightRail, setRightRail] = useState<ReactNode>(null);
  const location = useLocation();
  const { roomId } = useParams<{ roomId?: string }>();

  const isTourActive = typeof window !== 'undefined' && sessionStorage.getItem('tour_active') === '1';
  const isSampleRoom = roomId === 'sample-room';

  if (isSampleRoom) {
    if (!isTourActive) {
      return <Navigate to="/app/home" replace />;
    }
  } else if (!roomId || !isUuid(roomId)) {
    toast.error('That room link is not valid');
    return <Navigate to="/app/rooms" replace />;
  }

  const liveState = useRoomLive(isSampleRoom ? undefined : roomId);
  usePresenceHeartbeat(isSampleRoom ? undefined : roomId);

  return (
    <LiveContext.Provider value={liveState}>
      <ResponsiveShell pageName="Overview" rightRail={rightRail}>
        <GlobalOverlays />
        <RoomErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageSuspenseFallback />}>
            <div key={location.pathname} className="page-transition min-h-full flex-1 flex flex-col bg-page">
              <Outlet context={{ setRightRail }} />
            </div>
          </Suspense>
        </RoomErrorBoundary>
      </ResponsiveShell>
    </LiveContext.Provider>
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

/**
 * Smart redirect for /playbooks and /playbooks/:slug:
 * - Authenticated users → /app/playbooks (the in-app view)
 * - Guests             → /signin?returnUrl=/app/playbooks
 */
function PlaybooksRedirect() {
  const { data: user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    // Tiny loading state to avoid a flash while auth resolves
    return <PageSuspenseFallback />;
  }

  if (user) {
    // Map /playbooks/:slug → /app/playbooks/:slug if present
    const appPath = location.pathname.replace(/^\/playbooks/, '/app/playbooks') + location.search;
    return <Navigate to={appPath} replace />;
  }

  return (
    <Navigate
      to={`/signin?next=${encodeURIComponent('/app/playbooks')}`}
      replace
    />
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
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <LandingPage />
      </Suspense>
    ),
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
    path: '/full',
    element: <FullPage />,
  },
  {
    path: '/terms',
    element: <PlaceholderPage title="Terms of Service" />,
  },
  {
    path: '/privacy',
    element: <PlaceholderPage title="Privacy Policy" />,
  },
  {
    path: '/join',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <JoinInvitePage />
      </Suspense>
    ),
  },
  {
    path: '/invite/:token',
    element: <InviteLandingPage />,
  },
  {
    path: '/unsubscribed',
    element: <UnsubscribedPage />,
  },
  {
    path: '/goodbye',
    element: <GoodbyePage />,
  },
  {
    path: '/playbooks',
    element: <PlaybooksRedirect />,
  },
  {
    path: '/playbooks/:slug',
    element: <PlaybooksRedirect />,
  },
  {
    path: '/onboarding',
    element: <OnboardingView />,
  },
  {
    path: '/tour',
    element: <Navigate to="/app/home" replace />,
  },
  {
    path: '/u/:username',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <PortfolioPage />
      </Suspense>
    ),
  },

  {
    path: '/present/pitch-kit/rehearsals/:rehearsalId',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageSuspenseFallback />}>
          <RehearsalResultPage />
        </Suspense>
      </ProtectedRoute>
    ),
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
      { path: 'portfolio', element: <PortfolioPage /> },
      {
        path: 'settings',
        element: <SettingsPage />,
        children: [
          { index: true, element: <SettingsIndexRedirect /> },
          { path: 'profile', element: <ProfileSection /> },
          { path: 'appearance', element: <AppearanceSection /> },
          { path: 'notifications', element: <NotificationsSection /> },
          { path: 'integrations', element: <IntegrationsSection /> },
          { path: 'ai-status', element: <AiKeysSection /> },
          { path: 'ai-keys', element: <AiKeysSection /> },
          { path: 'ai', element: <AiKeysSection /> },
          { path: 'privacy', element: <PrivacySection /> },
          { path: 'billing', element: <BillingSection /> },
        ],
      },
      { path: 'notifications', element: <NotificationsPage /> },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <AdminOverviewPage />
          </Suspense>
        ),
      },
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
      // ── PRESENT group: new canonical routes ──
      { path: 'deck', element: <DeckPage /> },
      { path: 'pitch-kit', element: <PitchKitPage /> },
      { path: 'pitch-kit/rehearsals/:rehearsalId', element: <RehearsalResultPage /> },
      { path: 'submission', element: <SubmissionPage /> },
      // ── Legacy redirects (pages kept but unrouted) ──
      { path: 'pitch', element: <Navigate to={`deck`} replace /> },
      { path: 'pitch/deck', element: <Navigate to={`../deck`} replace relative="path" /> },
      { path: 'pitch/rehearse', element: <Navigate to={`../pitch-kit?open=pitch&rehearse=1`} replace relative="path" /> },
      { path: 'pitch/qa', element: <Navigate to={`../pitch-kit?open=qa`} replace relative="path" /> },
      { path: 'demo', element: <Navigate to={`pitch-kit?open=demo`} replace /> },
      { path: 'submit', element: <Navigate to="submission" replace /> },
      { path: 'readiness', element: <ReadinessPage /> },
      { path: 'summary', element: <RoomSummaryPage /> },
      { path: 'retro', element: <RetroPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  {
    path: '/app/rooms/:roomId/*',
    element: <RoomsWildcardRedirect />,
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
