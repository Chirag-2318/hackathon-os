/**
 * S28-4 Integrations sub-section
 * PRD 6a §3, S28-4
 *
 * GitHub (Connected), Google (Not connected), Coming soon tiles (no Connect button).
 * Tile anatomy: name+icon, status chip, CTA.
 * TODO [OQ-4]: Confirm which other integrations appear as coming-soon tiles.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/features/prep/api/settings-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch as Github, Globe, Calendar, MessageSquare, PenTool as FigmaIcon, CheckCircle2 } from 'lucide-react';

// TODO [OQ-4]: Confirm coming-soon tile list with product team.
const COMING_SOON = [
  { name: 'Google Calendar', icon: <Calendar className="size-5 text-ink-muted" /> },
  { name: 'Slack',           icon: <MessageSquare className="size-5 text-ink-muted" /> },
  { name: 'Figma',           icon: <FigmaIcon className="size-5 text-ink-muted" /> },
];

export function IntegrationsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  const { github, google } = data.integrations;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">Integrations</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GitHub tile — Connected */}
        <IntegrationTile
          name="GitHub"
          icon={<Github className="size-5 text-ink" />}
          connected={github.connected}
          onConnect={() => {/* TODO */}}
          onDisconnect={() => {/* TODO */}}
        />

        {/* Google tile — Not connected */}
        <IntegrationTile
          name="Google"
          icon={<Globe className="size-5 text-ink" />}
          connected={google.connected}
          onConnect={() => {/* TODO */}}
          onDisconnect={() => {/* TODO */}}
        />

        {/* Coming soon tiles — no Connect button [PRD §3 S28-4] */}
        {COMING_SOON.map(cs => (
          <div
            key={cs.name}
            className="rounded-card bg-surface border border-border p-5 flex flex-col gap-3 shadow-e0"
          >
            <div className="flex items-center gap-2">
              {cs.icon}
              <h3 className="text-h3 text-ink">{cs.name}</h3>
            </div>
            {/* Coming soon chip — no Connect button */}
            <span
              className="inline-flex items-center self-start px-2 py-0.5 rounded-chip text-label font-semibold text-ink"
              style={{ backgroundColor: '#FDE781' }}
            >
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface IntegrationTileProps {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function IntegrationTile({ name, icon, connected, onConnect, onDisconnect }: IntegrationTileProps) {
  return (
    <div className="rounded-card bg-surface border border-border p-5 flex flex-col gap-4 shadow-e0">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-h3 text-ink">{name}</h3>
      </div>

      {/* Status chip */}
      {connected ? (
        <span
          className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-chip text-label font-semibold text-ink"
          style={{ backgroundColor: '#A5EFBE' }}
        >
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          Connected
        </span>
      ) : (
        <span
          className="inline-flex items-center self-start px-2 py-0.5 rounded-chip text-label font-semibold bg-surface-sunken border border-border-strong text-ink-muted"
        >
          Not connected
        </span>
      )}

      {/* CTA */}
      {connected ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start text-[#A82D2D] border-current hover:bg-[#FBD9D7]"
          onClick={onDisconnect}
        >
          Disconnect
        </Button>
      ) : (
        <Button
          size="sm"
          className="self-start bg-callout text-white hover:bg-callout/90"
          onClick={onConnect}
        >
          Connect
        </Button>
      )}
    </div>
  );
}
