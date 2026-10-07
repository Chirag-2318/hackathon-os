import { ProgressRing } from '@/components/primitives/progress-ring';
import { Button } from '@/components/ui/button';

export interface SourceTextPanelProps {
  sourceText: string;
  extractedSpans: { id: string; startIndex: number; endIndex: number }[];
  confirmedCount: number;
  totalExtracts: number;
  onConfirmAll?: () => void;
  isLeader?: boolean;
}

export function SourceTextPanel({
  sourceText,
  extractedSpans,
  confirmedCount,
  totalExtracts,
  onConfirmAll,
  isLeader,
}: SourceTextPanelProps) {
  // Sort spans by start index to properly chunk the string
  const sortedSpans = [...extractedSpans].sort((a, b) => a.startIndex - b.startIndex);

  const chunks: React.ReactNode[] = [];
  let currentIndex = 0;

  sortedSpans.forEach((span) => {
    // Add unhighlighted text before the span
    if (span.startIndex > currentIndex) {
      chunks.push(
        <span key={`text-${currentIndex}`}>
          {sourceText.slice(currentIndex, span.startIndex)}
        </span>
      );
    }

    // Add highlighted text
    chunks.push(
      <mark
        key={span.id}
        id={span.id}
        className="bg-pastel-sky/30 text-ink rounded px-1 transition-colors"
      >
        {sourceText.slice(span.startIndex, span.endIndex)}
      </mark>
    );

    currentIndex = span.endIndex;
  });

  // Add any remaining text
  if (currentIndex < sourceText.length) {
    chunks.push(
      <span key={`text-${currentIndex}`}>
        {sourceText.slice(currentIndex)}
      </span>
    );
  }

  const progressPercent = totalExtracts > 0 ? (confirmedCount / totalExtracts) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-surface-base rounded-lg border border-stroke-base shadow-sm">
      <div className="flex-1 overflow-y-auto p-6 whitespace-pre-wrap text-body text-ink leading-relaxed">
        {chunks}
      </div>
      
      <div className="shrink-0 p-4 border-t border-stroke-base flex items-center justify-between bg-surface-raised rounded-b-lg">
        <div className="flex items-center gap-4">
          <ProgressRing 
            size="sm" 
            value={progressPercent}
            showLabel={false}
          />
          <div className="text-body font-medium text-ink">
            {confirmedCount}/{totalExtracts} confirmed
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={onConfirmAll}
          disabled={!isLeader || confirmedCount === totalExtracts}
        >
          Confirm all
        </Button>
      </div>
    </div>
  );
}
