import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { portfolioService } from '@/services/portfolioService';
import type { FullPortfolioResponse, ProjectCardDto, PassportStampDto, UpdateSettingsRequest } from './types';
import { IdentityHero } from './components/identity-hero';
import { StatStrip } from './components/stat-strip';
import { FeaturedProjects } from './components/featured-projects';
import { PassportTimeline } from './components/passport-timeline';
import { ActivityHeatmap } from './components/activity-heatmap';
import { StackConstellation } from './components/stack-constellation';
import { RoleFingerprint } from './components/role-fingerprint';
import { BuiltWith } from './components/built-with';
import { MilestonesRow } from './components/milestones-row';
import { GhostPassport } from './components/ghost-passport';
import { CaseStudyDrawer } from './components/case-study-drawer';
import { PortfolioExportModal } from './components/portfolio-export-modal';

export const PortfolioPage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const isPublicRoute = Boolean(username);

  const [data, setData] = useState<FullPortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<ProjectCardDto | PassportStampDto | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const loadPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isPublicRoute && username
        ? await portfolioService.fetchPublicPortfolio(username)
        : await portfolioService.fetchMyPortfolio();
      setData(res);

      // Set document title for passport / public showcase
      if (res?.profile?.name) {
        document.title = `${res.profile.name} — Builder Passport | Hackathon OS`;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load portfolio passport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [username]);

  const handleUpdateBio = async (bio: string) => {
    if (!data) return;
    try {
      const updated = await portfolioService.updatePortfolioSettings({ bio });
      setData({
        ...data,
        settings: updated,
        profile: { ...data.profile, bio: updated.bio },
      });
    } catch (err) {
      console.error('Failed to update bio', err);
    }
  };

  const handleUpdateSettings = async (patch: Partial<UpdateSettingsRequest>) => {
    if (!data) return;
    try {
      const updated = await portfolioService.updatePortfolioSettings(patch);
      setData({
        ...data,
        settings: updated,
        profile: {
          ...data.profile,
          customLinks: updated.customLinks,
        },
      });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const handleTogglePin = async (roomId: string, currentPinned: boolean) => {
    if (!data) return;
    try {
      await portfolioService.updateProjectCuration(roomId, { pinned: !currentPinned });
      // Optimistic update
      const updateProject = (p: ProjectCardDto) =>
        p.roomId === roomId ? { ...p, pinned: !currentPinned } : p;
      setData({
        ...data,
        featuredProjects: data.featuredProjects.map(updateProject),
      });
    } catch (err) {
      console.error('Failed to update pin', err);
    }
  };

  const handleToggleVisibility = async (roomId: string, currentVisible: boolean) => {
    if (!data) return;
    try {
      await portfolioService.updateProjectCuration(roomId, { visible: !currentVisible });
      const updateProject = (p: ProjectCardDto) =>
        p.roomId === roomId ? { ...p, visible: !currentVisible } : p;
      setData({
        ...data,
        featuredProjects: data.featuredProjects.map(updateProject),
      });
    } catch (err) {
      console.error('Failed to update visibility', err);
    }
  };

  // Loading State: Skeleton matching layout
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 animate-pulse">
        <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
          <div className="h-16 w-16 rounded-full bg-neutral-800" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded bg-neutral-800" />
            <div className="h-3 w-64 rounded bg-neutral-800/60" />
          </div>
        </div>
        <div className="h-12 w-full rounded bg-neutral-900/60 border border-neutral-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 rounded bg-neutral-900/40 border border-neutral-800" />
          <div className="h-64 rounded bg-neutral-900/40 border border-neutral-800" />
        </div>
      </div>
    );
  }

  // Error State: Inline retry
  if (error || !data) {
    return (
      <div className="mx-auto max-w-md py-16 px-4 text-center space-y-4">
        <div className="flex justify-center text-red-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h3 className="text-base font-semibold text-neutral-100">Unable to load passport</h3>
        <p className="text-xs text-neutral-400 leading-relaxed">{error || 'An unexpected error occurred.'}</p>
        <button
          onClick={loadPortfolio}
          className="inline-flex items-center gap-2 rounded bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  const hasRooms = data.stats.hackathonsJoined > 0;

  return (
    <div className="mx-auto max-w-5xl min-h-screen text-foreground">
      {/* 1. Identity Hero */}
      <IdentityHero
        profile={data.profile}
        settings={data.settings}
        isOwner={data.isOwner}
        onUpdateBio={handleUpdateBio}
        onUpdateSettings={handleUpdateSettings}
        onExport={() => setShowExportModal(true)}
      />

      {/* Zero rooms state: Ghost passport */}
      {!hasRooms ? (
        <GhostPassport />
      ) : (
        <>
          {/* 2. Stat Strip */}
          <StatStrip stats={data.stats} />

          {/* 3. Featured Projects Case Studies */}
          <FeaturedProjects
            projects={data.featuredProjects}
            isOwner={data.isOwner}
            onSelectProject={setSelectedProject}
            onTogglePin={data.isOwner ? handleTogglePin : undefined}
            onToggleVisibility={data.isOwner ? handleToggleVisibility : undefined}
          />

          {/* 4. Hackathon Passport Timeline */}
          <PassportTimeline
            stamps={data.timelineStamps}
            onSelectStamp={setSelectedProject}
          />

          {/* 5. Activity Heatmap */}
          <ActivityHeatmap heatmap={data.heatmap} />

          {/* 6. Stack Constellation */}
          <StackConstellation stack={data.stackConstellation} />

          {/* 7. Contribution Fingerprint */}
          <RoleFingerprint fingerprint={data.roleFingerprint} />

          {/* 8. Built With (Teammates) */}
          <BuiltWith collaborators={data.collaborators} />

          {/* 9. Milestones */}
          <MilestonesRow milestones={data.milestones} />
        </>
      )}

      {/* Side Case Study Drawer Modal */}
      <CaseStudyDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Export / Print Passport Card Modal */}
      {showExportModal && (
        <PortfolioExportModal
          data={data}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
