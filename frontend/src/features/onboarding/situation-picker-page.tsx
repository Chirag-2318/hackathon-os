import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from 'cn';
import { Clock, Zap, Compass } from 'lucide-react';

type SituationChoice = 'prep' | 'speed' | 'explore' | null;

export function SituationPickerPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SituationChoice>(null);

  const handleContinue = () => {
    if (selected === 'prep') {
      navigate(`${ROUTES.CREATE_ROOM}?mode=standard`);
    } else if (selected === 'speed') {
      navigate(`${ROUTES.CREATE_ROOM}?mode=speed`);
    } else if (selected === 'explore') {
      navigate(ROUTES.PLAYBOOKS);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] max-w-[900px] mx-auto px-6 py-12">
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-h1 text-ink-strong mb-3">Welcome back</h1>
        <p className="text-body text-ink-muted">We'll set up the right room for you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        {/* Card 1: Prep */}
        <Card
          data-slot="situation-card"
          role="button"
          tabIndex={0}
          onClick={() => setSelected('prep')}
          onKeyDown={(e) => e.key === 'Enter' && setSelected('prep')}
          className={cn(
            'flex flex-col items-center text-center p-8 cursor-pointer transition-all duration-200 border-2',
            selected === 'prep'
              ? 'border-lav-600 bg-surface shadow-e2 scale-[1.02]'
              : selected !== null
              ? 'border-transparent bg-surface opacity-50 scale-[0.98] hover:opacity-80'
              : 'border-border/50 bg-surface hover:border-border-strong hover:shadow-sm'
          )}
        >
          <div className="size-16 rounded-full bg-pastel-blue/20 flex items-center justify-center mb-6">
            <Clock className="size-8 text-pastel-blue" />
          </div>
          <h3 className="text-h4 text-ink-strong mb-2">Event hasn't started</h3>
          <p className="text-sm text-ink-muted">Set up your room now and prepare your team.</p>
        </Card>

        {/* Card 2: Speed Mode */}
        <Card
          data-slot="situation-card"
          role="button"
          tabIndex={0}
          onClick={() => setSelected('speed')}
          onKeyDown={(e) => e.key === 'Enter' && setSelected('speed')}
          className={cn(
            'flex flex-col items-center text-center p-8 cursor-pointer transition-all duration-200 border-2',
            selected === 'speed'
              ? 'border-lav-600 bg-surface shadow-e2 scale-[1.02]'
              : selected !== null
              ? 'border-transparent bg-surface opacity-50 scale-[0.98] hover:opacity-80'
              : 'border-border/50 bg-surface hover:border-border-strong hover:shadow-sm'
          )}
        >
          <div className="size-16 rounded-full bg-pastel-yellow/20 flex items-center justify-center mb-6">
            <Zap className="size-8 text-pastel-yellow" />
          </div>
          <h3 className="text-h4 text-ink-strong mb-2">Event is live</h3>
          <p className="text-sm text-ink-muted">Get into your room fast and start building.</p>
        </Card>

        {/* Card 3: Explore */}
        <Card
          data-slot="situation-card"
          role="button"
          tabIndex={0}
          onClick={() => setSelected('explore')}
          onKeyDown={(e) => e.key === 'Enter' && setSelected('explore')}
          className={cn(
            'flex flex-col items-center text-center p-8 cursor-pointer transition-all duration-200 border-2',
            selected === 'explore'
              ? 'border-lav-600 bg-surface shadow-e2 scale-[1.02]'
              : selected !== null
              ? 'border-transparent bg-surface opacity-50 scale-[0.98] hover:opacity-80'
              : 'border-border/50 bg-surface hover:border-border-strong hover:shadow-sm'
          )}
        >
          <div className="size-16 rounded-full bg-pastel-green/20 flex items-center justify-center mb-6">
            <Compass className="size-8 text-pastel-green" />
          </div>
          <h3 className="text-h4 text-ink-strong mb-2">Just exploring</h3>
          <p className="text-sm text-ink-muted">Browse playbooks and see what's possible.</p>
        </Card>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <Button size="lg" disabled={!selected} onClick={handleContinue} className="min-w-[200px]">
          Continue
        </Button>
      </div>
    </div>
  );
}
