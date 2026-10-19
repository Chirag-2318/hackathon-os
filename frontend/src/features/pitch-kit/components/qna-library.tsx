import React, { useState, useMemo } from 'react';
import { Copy, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { QnaItem } from '../api/qna-api';
import { QnaCustomItemDialog } from './qna-custom-item-dialog';
import { QnaAiMorePopover } from './qna-ai-more-popover';
import { QnaFilterRail } from './qna-filter-rail';
import { toast } from 'sonner';

interface QnaLibraryProps {
  roomId: string;
  items: QnaItem[];
  criteria: string[];
  roomAiAllowed: boolean;
  selectedCriterionFilter?: string | null;
  onSelectCriterionFilter?: (crit: string | null) => void;
  onOpenQuestion: (item: QnaItem) => void;
  onRefresh: () => void;
}

export function QnaLibrary({
  roomId,
  items,
  criteria,
  roomAiAllowed,
  selectedCriterionFilter,
  onSelectCriterionFilter,
  onOpenQuestion,
  onRefresh,
}: QnaLibraryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [masteryFilter, setMasteryFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.ownerHandle) set.add(i.ownerHandle);
    });
    return Array.from(set).sort();
  }, [items]);

  const hasActiveFilters = Boolean(
    search || selectedCriterionFilter || categoryFilter !== 'ALL' || ownerFilter !== 'ALL' || masteryFilter !== 'ALL' || sourceFilter !== 'ALL'
  );

  const handleClearFilters = () => {
    setSearch('');
    onSelectCriterionFilter?.(null);
    setCategoryFilter('ALL');
    setOwnerFilter('ALL');
    setMasteryFilter('ALL');
    setSourceFilter('ALL');
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesQ = item.question?.toLowerCase().includes(q);
        const matchesA = item.answer?.toLowerCase().includes(q);
        const matchesProof = item.proof?.toLowerCase().includes(q);
        if (!matchesQ && !matchesA && !matchesProof) return false;
      }
      if (selectedCriterionFilter && item.criterion !== selectedCriterionFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (ownerFilter !== 'ALL' && item.ownerHandle !== ownerFilter) return false;
      if (masteryFilter !== 'ALL' && item.myMastery !== parseInt(masteryFilter, 10)) return false;
      if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
      return true;
    });
  }, [items, search, selectedCriterionFilter, categoryFilter, ownerFilter, masteryFilter, sourceFilter]);

  const grouped = useMemo(() => {
    const general = filteredItems.filter((i) => i.kind === 'QUESTION');
    const code = filteredItems.filter((i) => i.kind === 'CODE');
    const truth = filteredItems.filter((i) => i.kind === 'TRUTH');
    const ask = filteredItems.filter((i) => i.kind === 'ASK');
    return { general, code, truth, ask };
  }, [filteredItems]);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Question copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMasteryDots = (mastery: number) => {
    const colors = [
      mastery === 0 ? 'bg-muted-foreground' : 'bg-muted-foreground/30',
      mastery === 1 ? 'bg-rose-500' : 'bg-muted-foreground/30',
      mastery === 2 ? 'bg-amber-500' : 'bg-muted-foreground/30',
      mastery === 3 ? 'bg-emerald-500' : 'bg-muted-foreground/30',
    ];
    return (
      <div className="flex items-center gap-1.5" title={`Mastery: ${['Unseen', 'Missed', 'Shaky', 'Solid'][mastery]}`}>
        {colors.map((c, i) => (
          <span key={i} className={cn('h-1.5 w-1.5 rounded-full transition-colors', c)} />
        ))}
      </div>
    );
  };

  const renderQuestionRow = (item: QnaItem) => (
    <div
      key={item.id}
      onClick={() => onOpenQuestion(item)}
      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-start justify-between gap-4 group"
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.source === 'AI' && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              AI draft
            </span>
          )}
          <h4 className="font-display text-lg sm:text-[20px] leading-snug font-normal text-foreground group-hover:text-primary transition-colors">
            {item.question}
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          {item.criterion && <span>{item.criterion}</span>}
          {item.category && <span>· {item.category}</span>}
          {item.ownerHandle && (
            <span className="flex items-center gap-1 ml-1 text-foreground">
              <UserAvatar user={{ username: item.ownerHandle, name: item.ownerHandle }} size={16} />
              @{item.ownerHandle}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1 shrink-0">
        {renderMasteryDots(item.myMastery)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <QnaFilterRail
        search={search}
        onSearchChange={setSearch}
        criteria={criteria}
        selectedCriterion={selectedCriterionFilter || null}
        onSelectCriterion={(c) => onSelectCriterionFilter?.(c)}
        categories={categories}
        selectedCategory={categoryFilter}
        onSelectCategory={setCategoryFilter}
        owners={owners}
        selectedOwner={ownerFilter}
        onSelectOwner={setOwnerFilter}
        selectedMastery={masteryFilter}
        onSelectMastery={setMasteryFilter}
        selectedSource={sourceFilter}
        onSelectSource={setSourceFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="flex-1 w-full space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground">
            {filteredItems.length} question{filteredItems.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <QnaAiMorePopover
              roomId={roomId}
              roomAiAllowed={roomAiAllowed}
              criteria={criteria}
              onGenerated={onRefresh}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCustomDialogOpen(true)}
              className="text-xs font-mono h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add a question
            </Button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-border rounded-lg">
            <p className="text-xs font-mono text-muted-foreground">No questions match your current filters.</p>
            <Button variant="link" size="sm" className="text-xs font-mono" onClick={handleClearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.general.length > 0 && (
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card/40">
                {grouped.general.map(renderQuestionRow)}
              </div>
            )}

            {grouped.code.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-1">
                  Code defense
                </h3>
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card/40">
                  {grouped.code.map(renderQuestionRow)}
                </div>
              </div>
            )}

            {grouped.truth.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-1">
                  Hard truths
                </h3>
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card/40">
                  {grouped.truth.map(renderQuestionRow)}
                </div>
              </div>
            )}

            {grouped.ask.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-1">
                  Questions to ask the judges
                </h3>
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card/40">
                  {grouped.ask.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenQuestion(item)}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <h4 className="font-display text-lg sm:text-[20px] font-normal text-foreground group-hover:text-primary transition-colors flex-1">
                        {item.question}
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs font-mono shrink-0"
                        onClick={(e) => handleCopy(e, item.question, item.id)}
                        title="Copy question"
                      >
                        {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <QnaCustomItemDialog
        roomId={roomId}
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onCreated={onRefresh}
        criteria={criteria}
      />
    </div>
  );
}
