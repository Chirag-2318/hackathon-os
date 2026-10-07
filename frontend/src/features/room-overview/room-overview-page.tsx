import * as React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useRoomOverview } from './hooks/use-room-overview';
import { ClockStrip } from '@/components/primitives/clock-strip';
import { Skeleton } from '@/components/ui/skeleton';
import { Banner } from '@/components/primitives/banner';

import { KpiRow } from './components/kpi-row';
import { BlockerBanner } from './components/blocker-banner';
import { ProgressVsPlanChart } from './components/progress-vs-plan-chart';
import { ActivityHeatmap } from './components/activity-heatmap';
import { EventDaysCard } from './components/event-days-card';
import { UpcomingCheckpoints } from './components/upcoming-checkpoints';
import { SkillCoverageCard } from './components/skill-coverage-card';
import { MyTasksList } from './components/my-tasks-list';
import { TeamList } from './components/team-list';

export function RoomOverviewPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data, isLoading, error } = useRoomOverview(roomId || '');
  const { setRightRail } = useOutletContext<{ setRightRail: (node: React.ReactNode) => void }>();

  React.useLayoutEffect(() => {
    // Clear the global right rail, since we render it inline now for responsive wrapping
    setRightRail(null);
    return () => setRightRail(null);
  }, [setRightRail]);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-danger">Failed to load room overview data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {data?.clockStrip.lastHour && (
        <Banner variant="info">Last hour. Only verification and submission from here.</Banner>
      )}
      {data?.clockStrip.freezeCrossed && !data?.clockStrip.lastHour && (
        <Banner variant="info">Feature freeze reached. No new tasks can be added.</Banner>
      )}

      {isLoading ? (
        <Skeleton className="w-full h-12" />
      ) : (
        data && (
          <>
            {/* BAND A: Status */}
            <div className="flex flex-col">
              <ClockStrip
                phaseSegments={data.clockStrip.phaseSegments}
                nowPercent={data.clockStrip.nowPercent}
                freezeInText={data.clockStrip.freezeInText}
                submitInText={data.clockStrip.submitInText}
                freezeCrossed={data.clockStrip.freezeCrossed}
                lastHour={data.clockStrip.lastHour}
              />

              <div className="mt-6">
                <KpiRow 
                  checkpointsPassed={data.kpis.checkpointsPassed}
                  tasksOpen={data.kpis.tasksOpen}
                  blockedTasksCount={data.kpis.blockedTasksCount}
                  overallProgress={data.clockStrip.nowPercent}
                  plannedProgress={Math.min(100, data.clockStrip.nowPercent + 5)} // Mocking planned progress logic based on seed data
                  teamMembers={data.teamMembers}
                />
              </div>

              {/* BlockerBanner component */}
              <div className="mt-2">
                <BlockerBanner count={data.kpis.blockedTasksCount} />
              </div>
            </div>

            {/* BAND B: Working detail (Two columns) */}
            <div className="flex flex-col lg:flex-row flex-wrap xl:flex-nowrap items-start gap-6 w-full mt-6">
              
              {/* Left Column */}
              <div className="flex-1 min-w-[320px] flex flex-col gap-6">
                
                {/* Progress */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-h2 text-ink">Progress</h2>
                  <ProgressVsPlanChart data={data.progressChart} />
                </section>

                {/* Activity */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-h2 text-ink">Team activity</h2>
                  <ActivityHeatmap data={data.heatmap} />
                </section>

                {/* My tasks */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-h2 text-ink">My tasks</h2>
                  <MyTasksList tasks={data.myTasks} />
                </section>

                {/* Team */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-h2 text-ink">Team</h2>
                  <TeamList members={data.teamMembers} />
                </section>

              </div>

              {/* Right Rail */}
              <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-6 mt-[44px]"> {/* align with headers of left col */}
                
                {/* Event Days */}
                <EventDaysCard />

                {/* Upcoming Checkpoints */}
                <UpcomingCheckpoints />

                {/* Skill Coverage */}
                <SkillCoverageCard />

              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
