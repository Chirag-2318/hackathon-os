import * as React from 'react';
import { useParams } from 'react-router-dom';
import { fetchMvpStudio, type MvpStudioData } from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { RealityLedger } from './components/reality-ledger';
import { CoreFlow } from './components/core-flow';
import { Lightbulb, Zap, AlertTriangle } from 'lucide-react';

export function MvpPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [data, setData] = React.useState<MvpStudioData | null>(null);

  React.useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    fetchMvpStudio(roomId).then((res) => {
      if (mounted) setData(res);
    });
    return () => {
      mounted = false;
    };
  }, [roomId]);

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const handleToggleChecklist = (id: string, isPassed: boolean) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        healthChecklist: prev.healthChecklist.map((c) =>
          c.id === id ? { ...c, isPassed } : c
        ),
      };
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface-sunken overflow-y-auto">
      {/* Header */}
      <header className="px-6 py-8 bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black mb-4">MVP Studio</h1>
          <div className="p-6 r-card bg-lav-50/50 border border-lav-100">
            <h2 className="text-sm font-bold text-lav-900 mb-2">Identity Sentence</h2>
            <p className="text-xl font-medium text-ink leading-relaxed">
              {data.identitySentence}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Core Flow */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Core Flow</h2>
            <CoreFlow steps={data.coreFlow} />
          </section>

          {/* Value Props Row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="r-card bg-surface p-5 space-y-3">
              <div className="h-10 w-10 rounded-full bg-peach-100 text-peach-900 flex items-center justify-center">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="font-bold">Differentiation</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {data.differentiation}
              </p>
            </div>
            
            <div className="r-card bg-surface p-5 space-y-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <h3 className="font-bold">Wow Moment</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {data.wowMoment}
              </p>
            </div>

            <div className="r-card bg-surface p-5 space-y-3">
              <div className="h-10 w-10 rounded-full bg-coral-100 text-coral-900 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold">What breaks first?</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {data.breaksFirst}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Reality Ledger */}
            <section className="space-y-4">
              <RealityLedger items={data.realityLedger} />
            </section>

            {/* Pre-flight Checklist */}
            <section className="space-y-4">
              <div className="r-card bg-surface overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-border bg-surface-raised">
                  <h3 className="text-lg font-bold">Pre-flight Checklist</h3>
                  <p className="text-sm text-ink-muted">Must pass before shipping</p>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2 bg-surface">
                  {data.healthChecklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-3 r-control cursor-pointer hover:bg-surface-sunken transition-colors group"
                    >
                      <Checkbox
                        checked={item.isPassed}
                        onCheckedChange={(checked) => handleToggleChecklist(item.id, !!checked)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 transition-colors"
                      />
                      <span
                        className={cn(
                          'text-sm font-semibold transition-colors',
                          item.isPassed ? 'text-ink-muted line-through' : 'text-ink'
                        )}
                      >
                        {item.question}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
