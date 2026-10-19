import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiAction } from '@/features/ai-gate';
import { fetchRehearsalCoach, type CoachFeedback } from '../api/pitch-kit-api';
import { toast } from 'sonner';

export interface RehearsalCoachPanelProps {
  roomId: string;
  rehearsalId: string;
  initialCoach: CoachFeedback | null;
  roomAiAllowed?: boolean;
}

export function RehearsalCoachPanel({
  roomId,
  rehearsalId,
  initialCoach,
  roomAiAllowed = true,
}: RehearsalCoachPanelProps) {
  const [coach, setCoach] = useState<CoachFeedback | null>(initialCoach);
  const [loading, setLoading] = useState(false);
  const { guard, tooltip, isAvailable } = useAiAction({ aiAllowed: roomAiAllowed });

  const handleGetCoach = () => {
    guard(async () => {
      setLoading(true);
      try {
        const feedback = await fetchRehearsalCoach(roomId, rehearsalId);
        setCoach(feedback);
        toast.success('Coach feedback ready.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to fetch coach feedback');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="border border-border rounded-xl bg-card p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="font-display text-xl font-normal text-foreground">
            Coach feedback
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Blunt, evidence-backed evaluation focused on pace, fillers, and clarity.
          </p>
        </div>

        {!coach && (
          <Button
            size="sm"
            onClick={handleGetCoach}
            disabled={loading || !isAvailable}
            title={tooltip}
            className="text-xs font-medium"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Get blunt feedback
          </Button>
        )}
      </div>

      {coach ? (
        <div className="space-y-6 text-xs">
          {/* What worked */}
          {coach.worked?.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> What worked
              </span>
              <ul className="space-y-1.5 pl-5 list-disc text-foreground/90 leading-relaxed">
                {coach.worked.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fix items */}
          {coach.fix?.length > 0 && (
            <div className="space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> What needs fixing
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coach.fix.map((item, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg p-3.5 bg-background space-y-1.5"
                  >
                    <div className="font-medium text-foreground">{item.issue}</div>
                    <div className="text-muted-foreground leading-relaxed">
                      <strong className="text-foreground/80 font-normal">Evidence:</strong> {item.evidence}
                    </div>
                    <div className="text-foreground/90 font-mono text-[11px] bg-muted/30 p-2 rounded mt-1">
                      <strong className="text-foreground block mb-0.5">Drill:</strong> {item.drill}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* One Drill */}
          {coach.oneDrill && (
            <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Recommended single drill
              </span>
              <p className="text-xs text-foreground leading-relaxed font-medium">
                {coach.oneDrill}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Click &quot;Get blunt feedback&quot; to have the AI coach review your pacing and transcript against the confirmed rubric.
        </div>
      )}
    </div>
  );
}
