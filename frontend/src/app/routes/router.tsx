/**
 * React Router setup
 * Source: tech_stack.md §4.1 — React Router (pinned in AGENTS.md)
 *
 * Public routes (S01, S02, S03) run without the app shell.
 * Authenticated routes are wrapped in the shell layout under /app.
 * Placeholder routes for later screen phases.
 */
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
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

import { useState, type ReactNode } from 'react';

/** Layout route for non-room app pages (like Home) */
function HomeShellLayout() {
  const [rightRail, setRightRail] = useState<ReactNode>(null);
  return (
    <ResponsiveShell showPhaseTrack={false} pageName="Home" rightRail={rightRail}>
      <GlobalOverlays />
      <Outlet context={{ setRightRail }} />
    </ResponsiveShell>
  );
}

/** Layout route for room pages */
function RoomShellLayout() {
  const [rightRail, setRightRail] = useState<ReactNode>(null);
  // We can read roomId from params here if needed, but pageName="Overview" is fine for now
  // or we can determine it from the matched route in the future.
  return (
    <ResponsiveShell showPhaseTrack={true} pageName="Overview" rightRail={rightRail}>
      <GlobalOverlays />
      <Outlet context={{ setRightRail }} />
    </ResponsiveShell>
  );
}

/** Speed Mode layout route */
function SpeedModeLayout() {
  return (
    <SpeedModeShell>
      <GlobalOverlays />
      <Outlet />
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

import { HomePage } from '@/features/home/home-page';
import { RoomOverviewPage } from '@/features/room-overview/room-overview-page';
import { BriefPage } from '@/features/brief/brief-page';
import { TeamPage } from '@/features/team/team-page';
import { IdeatePage } from '@/features/ideate/ideate-page';
import { PlanPage } from '@/features/plan/plan-page';
import { DocsPage } from '@/features/docs/docs-page';
import { BoardPage } from '@/features/board/board-page';
import { SchedulePage } from '@/features/schedule/schedule-page';
import { MvpPage } from '@/features/mvp/mvp-page';
import { GithubPage } from '@/features/github/github-page';
import { ApiPage } from '@/features/apis/api-page';
import { DiagramPage } from '@/features/diagrams/diagram-page';
import { PitchPage } from '@/features/pitch/pitch-page';
import { DemoPage } from '@/features/demo/demo-page';
import { SubmissionPage } from '@/features/submission/submission-page';
import { ReadinessPage } from '@/features/readiness/readiness-page';
import { RetroPage } from '@/features/retro/retro-page';
import { PrepPage } from '@/features/prep/prep-page';
import { CrowdCheckPage } from '@/features/prep/crowd-check-page';
import { ToolDirectoryPage } from '@/features/prep/tool-directory-page';
import { SettingsPage, SettingsIndexRedirect } from '@/features/settings/settings-page';
import { ProfileSection } from '@/features/settings/sections/profile-section';
import { AppearanceSection } from '@/features/settings/sections/appearance-section';
import { NotificationsSection } from '@/features/settings/sections/notifications-section';
import { IntegrationsSection } from '@/features/settings/sections/integrations-section';
import { AiKeysSection } from '@/features/settings/sections/ai-keys-section';
import { PrivacySection } from '@/features/settings/sections/privacy-section';
import { BillingSection } from '@/features/settings/sections/billing-section';
// Phase 6b
import { NotificationsPage } from '@/features/notifications/notifications-page';
import { MentorPage } from '@/features/mentor/mentor-page';
import { SpeedModePage } from '@/features/speed-mode/speed-mode-page';
import {
  NotFoundPage,
  ForbiddenPage,
  ServerErrorPage,
  OfflinePage,
  MaintenancePage,
} from '@/features/system-pages/system-pages';
import { SocialDashboard } from '@/features/prototypes/social-dashboard';
import { CalendarDashboard } from '@/features/prototypes/calendar-dashboard';

const router = createBrowserRouter([
  // ── Prototypes ────────────────────────────────────────────────
  { path: '/prototypes/social', element: <SocialDashboard /> },
  { path: '/prototypes/calendar', element: <CalendarDashboard /> },
  
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
      { path: 'rooms', element: <PlaceholderPage title="My rooms" /> },
      { path: 'playbooks', element: <PlaybookBrowsePage /> },
      { path: 'playbooks/:slug', element: <PlaybookDetailPage /> },
      { path: 'tools', element: <ToolDirectoryPage /> },
      { path: 'portfolio', element: <PlaceholderPage title="Portfolio" /> },
      {
        path: 'settings',
        element: <SettingsPage />,
        children: [
          { index: true, element: <SettingsIndexRedirect /> },
          { path: 'profile',       element: <ProfileSection /> },
          { path: 'appearance',    element: <AppearanceSection /> },
          { path: 'notifications', element: <NotificationsSection /> },
          { path: 'integrations',  element: <IntegrationsSection /> },
          { path: 'ai-keys',       element: <AiKeysSection /> },
          { path: 'privacy',       element: <PrivacySection /> },
          { path: 'billing',       element: <BillingSection /> },
        ],
      },
      // S29: full-page notifications (OQ-3: entry point unresolved)
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
      { path: 'prep', element: <PrepPage /> },
      { path: 'crowd-check', element: <CrowdCheckPage /> },
      { path: 'ideate', element: <IdeatePage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: 'board', element: <BoardPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'mvp', element: <MvpPage /> },
      { path: 'github', element: <GithubPage /> },
      { path: 'apis', element: <ApiPage /> },
      { path: 'diagrams', element: <DiagramPage /> },
      { path: 'pitch', element: <PitchPage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'submit', element: <SubmissionPage /> },
      { path: 'readiness', element: <ReadinessPage /> },
      { path: 'retro', element: <RetroPage /> },
      // S29 per-room notifications
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  // S30 Mentor view — external route, token placeholder (OQ-6)
  {
    path: '/mentor/:token',
    element: <MentorPage />,
  },
  // S31 Speed Mode — content inside existing shell
  {
    path: '/speed-mode',
    element: <SpeedModeLayout />,
    children: [
      { index: true, element: <SpeedModePage /> },
      { path: ':roomId', element: <SpeedModePage /> },
    ],
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
