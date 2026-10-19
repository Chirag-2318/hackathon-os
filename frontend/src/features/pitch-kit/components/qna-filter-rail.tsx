import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QnaFilterRailProps {
  search: string;
  onSearchChange: (val: string) => void;
  criteria: string[];
  selectedCriterion: string | null;
  onSelectCriterion: (val: string | null) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  owners: string[];
  selectedOwner: string;
  onSelectOwner: (val: string) => void;
  selectedMastery: string;
  onSelectMastery: (val: string) => void;
  selectedSource: string;
  onSelectSource: (val: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function QnaFilterRail({
  search,
  onSearchChange,
  criteria,
  selectedCriterion,
  onSelectCriterion,
  categories,
  selectedCategory,
  onSelectCategory,
  owners,
  selectedOwner,
  onSelectOwner,
  selectedMastery,
  onSelectMastery,
  selectedSource,
  onSelectSource,
  onClearFilters,
  hasActiveFilters,
}: QnaFilterRailProps) {
  return (
    <div className="w-full lg:w-60 shrink-0 space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search defense..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 text-xs font-mono h-8"
        />
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            Rubric Criterion
          </label>
          <select
            value={selectedCriterion || 'ALL'}
            onChange={(e) => onSelectCriterion(e.target.value === 'ALL' ? null : e.target.value)}
            className="w-full border border-input rounded-md bg-background px-2 py-1 text-xs font-mono"
          >
            <option value="ALL">All Criteria</option>
            {criteria.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full border border-input rounded-md bg-background px-2 py-1 text-xs font-mono"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            Owner
          </label>
          <select
            value={selectedOwner}
            onChange={(e) => onSelectOwner(e.target.value)}
            className="w-full border border-input rounded-md bg-background px-2 py-1 text-xs font-mono"
          >
            <option value="ALL">All Owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                @{o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            My Mastery
          </label>
          <select
            value={selectedMastery}
            onChange={(e) => onSelectMastery(e.target.value)}
            className="w-full border border-input rounded-md bg-background px-2 py-1 text-xs font-mono"
          >
            <option value="ALL">All Levels</option>
            <option value="0">Unseen</option>
            <option value="1">Missed</option>
            <option value="2">Shaky</option>
            <option value="3">Solid</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            Source
          </label>
          <select
            value={selectedSource}
            onChange={(e) => onSelectSource(e.target.value)}
            className="w-full border border-input rounded-md bg-background px-2 py-1 text-xs font-mono"
          >
            <option value="ALL">All Sources</option>
            <option value="DOC">Document (QNA.md)</option>
            <option value="AI">AI Draft</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="w-full text-xs font-mono h-7 text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
