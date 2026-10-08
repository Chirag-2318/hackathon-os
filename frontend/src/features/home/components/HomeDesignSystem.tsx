import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock, ChevronDown, CheckSquare, Play, LayoutList, Check, Video, Edit, FileText } from 'lucide-react';

// ── A) TagChip ──────────────────────────────────────────────────────────
export type TagColor = 'purple' | 'green' | 'red' | 'amber' | 'blue' | 'neutral';

interface TagChipProps {
  label: string;
  color: TagColor;
  icon?: React.ReactNode;
  className?: string;
}

export function TagChip({ label, color, icon, className }: TagChipProps) {
  const colorStyles = {
    purple: 'bg-[var(--color-home-chip-purple-bg)] text-[var(--color-home-chip-purple-fg)]',
    green: 'bg-[var(--color-home-chip-green-bg)] text-[var(--color-home-chip-green-fg)]',
    red: 'bg-[var(--color-home-chip-red-bg)] text-[var(--color-home-chip-red-fg)]',
    amber: 'bg-[var(--color-home-chip-amber-bg)] text-[var(--color-home-chip-amber-fg)]',
    blue: 'bg-[var(--color-home-chip-blue-bg)] text-[var(--color-home-chip-blue-fg)]',
    neutral: 'bg-[var(--color-home-chip-neutral-bg)] text-[var(--color-home-chip-neutral-fg)]',
  };

  return (
    <div
      className={cn(
        'h-[28px] rounded-[var(--radius-home-tag)] px-2.5 flex items-center justify-center gap-1.5 shrink-0',
        colorStyles[color],
        className
      )}
    >
      {icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
      <span className="uppercase text-[13px] font-[600] tracking-[0.02em] leading-none mb-0.5">
        {label}
      </span>
    </div>
  );
}

// ── B) TimeChip ─────────────────────────────────────────────────────────
interface TimeChipProps {
  timeRemaining?: string; // e.g., "in 4h 30m". If omitted, renders icon-only.
  urgent?: boolean;       // Turns amber
}

export function TimeChip({ timeRemaining, urgent }: TimeChipProps) {
  const isIconOnly = !timeRemaining;
  return (
    <div
      className={cn(
        'h-[28px] rounded-[var(--radius-home-time)] flex items-center justify-center shrink-0',
        isIconOnly ? 'w-[28px]' : 'px-3 gap-1.5',
        urgent
          ? 'bg-[var(--color-home-chip-amber-bg)] text-[var(--color-home-chip-amber-fg)]'
          : 'bg-[var(--color-home-chip-neutral-bg)] text-[var(--color-home-chip-neutral-fg)]'
      )}
    >
      <Clock className="w-4 h-4" strokeWidth={2.5} />
      {!isIconOnly && (
        <span className="text-[13px] font-[500] leading-none mb-[1px] tabular-nums">
          {timeRemaining}
        </span>
      )}
    </div>
  );
}

// ── C) Checkbox ─────────────────────────────────────────────────────────
interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ checked, onChange, className }: CheckboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (checked) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 220);
      return () => clearTimeout(timer);
    }
  }, [checked]);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'w-6 h-6 shrink-0 rounded-[var(--radius-home-checkbox)] border flex items-center justify-center transition-all duration-[var(--ease-home)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-home-accent)]',
        checked
          ? 'bg-[var(--color-home-text-primary)] border-[var(--color-home-text-primary)]'
          : 'bg-[#F1F1F1] border-[#E4E4E4] hover:border-[#CCCCCC]',
        isAnimating && 'scale-105', // simple CSS scale pop
        className
      )}
      style={{
        transitionDuration: '220ms',
        transitionTimingFunction: 'var(--ease-home)'
      }}
    >
      {checked && (
        <svg
          viewBox="0 0 14 10"
          fill="none"
          className="w-3.5 h-2.5 text-white stroke-current stroke-2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: '20',
            strokeDashoffset: isAnimating ? '20' : '0',
            transition: 'stroke-dashoffset 220ms var(--ease-home)'
          }}
        >
          <polyline points="1.5 5 5 8.5 12.5 1.5" />
        </svg>
      )}
    </button>
  );
}

// ── D) InlineHighlight ──────────────────────────────────────────────────
interface InlineHighlightProps {
  children: React.ReactNode;
  asLink?: boolean;
  href?: string;
}

export function InlineHighlight({ children, asLink, href }: InlineHighlightProps) {
  const className = "text-[var(--color-home-accent)] font-[500] hover:underline cursor-pointer";
  if (asLink) {
    return <a href={href || '#'} className={className}>{children}</a>;
  }
  return <span className={className}>{children}</span>;
}

// ── E) TrayCard ─────────────────────────────────────────────────────────
interface TrayCardProps {
  children: React.ReactNode; // Content inside the white panel
  footerLeftLabel: string;
  footerRightLabel: string;
  footerRightValue: string;
  progressPercent: number; // 0-100
  className?: string;
}

export function TrayCard({
  children,
  footerLeftLabel,
  footerRightLabel,
  footerRightValue,
  progressPercent,
  className
}: TrayCardProps) {
  // SVG Ring calculation
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={cn("bg-[var(--color-home-tray)] rounded-[var(--radius-home-tray)] p-1.5 flex flex-col", className)}>
      {/* Inner White Panel */}
      <div className="bg-white rounded-[var(--radius-home-panel)] shadow-[var(--shadow-home-card)] relative z-10 flex-1">
        {children}
      </div>
      
      {/* Footer Bar */}
      <div className="h-[56px] px-4 flex items-center justify-between z-0">
        <div className="flex items-center gap-2 text-[var(--color-home-text-secondary)]">
          <div className="w-[28px] h-[28px] rounded-[8px] bg-[#E4E4E4] flex items-center justify-center text-[13px] font-[500]">
            /
          </div>
          <span className="text-[14px]">{footerLeftLabel}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-[14px] text-[var(--color-home-text-secondary)]">
            {footerRightLabel} <span className="font-[600] text-[var(--color-home-text-primary)]">{footerRightValue}</span>
          </div>
          
          <div className="relative w-[28px] h-[28px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 28 28">
              <circle
                cx="14" cy="14" r={radius}
                stroke="#DEDEDE"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="14" cy="14" r={radius}
                stroke="var(--color-home-accent)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── F) Dropdown ─────────────────────────────────────────────────────────
interface DropdownProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  className?: string;
}

export function Dropdown({ value, options, onChange, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-[44px] rounded-[var(--radius-home-btn)] border-2 border-[#ECECEC] bg-white px-4 flex items-center gap-2 text-[16px] font-[500] text-[var(--color-home-text-primary)] hover:border-[#D0D0D0] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)]"
      >
        {value}
        <ChevronDown className="w-4 h-4 text-[var(--color-home-text-tertiary)]" />
      </button>
      
      {open && (
        <div className="absolute top-[52px] right-0 bg-white rounded-[var(--radius-home-btn)] shadow-[var(--shadow-home-tooltip)] p-1 z-50 min-w-[160px] border border-[var(--color-home-hairline)]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-[15px] rounded-[8px] transition-colors",
                opt === value 
                  ? "bg-[var(--color-home-tray)] font-[600]" 
                  : "hover:bg-[var(--color-home-tray)] text-[var(--color-home-text-primary)]"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── G) PairedBarRow ─────────────────────────────────────────────────────
export type ChartHue = 'blue' | 'cyan' | 'purple' | 'teal';

interface PairedBarRowProps {
  label: string;
  hue: ChartHue;
  doneValue: number;
  expectedValue: number;
  maxValue: number;
  status: 'working' | 'idle' | 'blocked';
}

export function PairedBarRow({ label, hue, doneValue, expectedValue, maxValue, status }: PairedBarRowProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const donePercent = mounted ? (doneValue / maxValue) * 100 : 0;
  const expectedPercent = mounted ? (expectedValue / maxValue) * 100 : 0;
  
  const statusColors = {
    working: 'bg-[var(--color-home-chip-green-fg)]',
    idle: 'bg-[#D0D0D0]',
    blocked: 'bg-[var(--color-home-chip-red-fg)]'
  };

  const hueTokens = {
    blue: { strong: 'var(--color-home-chart-blue-strong)', pale: 'var(--color-home-chart-blue-pale)' },
    cyan: { strong: 'var(--color-home-chart-cyan-strong)', pale: 'var(--color-home-chart-cyan-pale)' },
    purple: { strong: 'var(--color-home-chart-purple-strong)', pale: 'var(--color-home-chart-purple-pale)' },
    teal: { strong: 'var(--color-home-chart-teal-strong)', pale: 'var(--color-home-chart-teal-pale)' }
  };

  return (
    <div className="flex items-center gap-4 mb-7 last:mb-0 group/row relative">
      {/* Label area */}
      <div className="w-[120px] shrink-0 flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full shrink-0", statusColors[status])} />
        <span className="text-[16px] font-[500] text-[var(--color-home-text-primary)] truncate">
          {label}
        </span>
      </div>
      
      {/* Bars area */}
      <div className="flex-1 relative h-[34px]">
        {/* Expected Bar (bottom) */}
        <div 
          className="absolute left-0 bottom-0 h-[14px] rounded-[5px] transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
          style={{ 
            width: `${expectedPercent}%`,
            backgroundColor: hueTokens[hue].pale 
          }}
        />
        {/* Done Bar (top) */}
        <div 
          className="absolute left-0 top-0 h-[14px] rounded-[5px] transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
          style={{ 
            width: `${donePercent}%`,
            backgroundColor: hueTokens[hue].strong 
          }}
        >
          {/* Hover dot */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-transparent opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}

// ── Checkpoint 1: Temporary Preview ─────────────────────────────────────────

export function DesignPreview() {
  const [checked, setChecked] = useState(false);
  const [dropdownVal, setDropdownVal] = useState('This phase');
  
  return (
    <div className="p-8 max-w-[1180px] mx-auto flex flex-col gap-12 text-[var(--font-inter)]">
      <h1 className="text-2xl font-bold">Checkpoint 1: Design System Preview</h1>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">A) TagChips</h2>
        <div className="flex gap-4 flex-wrap">
          <TagChip label="VIDEO" color="purple" icon={<Video />} />
          <TagChip label="FRONTEND" color="green" icon={<LayoutList />} />
          <TagChip label="SUBMIT" color="red" icon={<CheckSquare />} />
          <TagChip label="DUE SOON" color="amber" />
          <TagChip label="DOCS" color="blue" icon={<FileText />} />
          <TagChip label="18 LEFT" color="neutral" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">B) TimeChips</h2>
        <div className="flex gap-4">
          <TimeChip timeRemaining="in 4h 30m" />
          <TimeChip timeRemaining="in 45m" urgent />
          <TimeChip />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">C) Checkbox</h2>
        <div className="flex gap-4 items-center">
          <Checkbox checked={checked} onChange={setChecked} />
          <span className="text-[15px]">Toggle me</span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">D) InlineHighlight</h2>
        <div className="text-[15px]">
          Please upload the video <InlineHighlight>by 1:30 AM</InlineHighlight> using the script at <InlineHighlight asLink href="#">demo-script.md</InlineHighlight>.
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">E) TrayCard</h2>
        <TrayCard
          footerLeftLabel="Quick actions"
          footerRightLabel="Polish phase:"
          footerRightValue="25%"
          progressPercent={25}
          className="max-w-md"
        >
          <div className="p-6 min-h-[200px]">
            <h3 className="text-[20px] font-[600] mb-4">Your tasks</h3>
            <p className="text-gray-500">Inner white panel content goes here...</p>
          </div>
        </TrayCard>
      </section>

      <section className="space-y-4 relative z-10">
        <h2 className="text-xl font-semibold border-b pb-2">F) Dropdown</h2>
        <Dropdown 
          value={dropdownVal}
          options={['This phase', 'Overall']}
          onChange={setDropdownVal}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">G) PairedBarRow</h2>
        <div className="max-w-md p-6 bg-white rounded-3xl border">
          <PairedBarRow label="Aarav" hue="blue" doneValue={12} expectedValue={10} maxValue={16} status="working" />
          <PairedBarRow label="Priya" hue="cyan" doneValue={9} expectedValue={10} maxValue={16} status="working" />
          <PairedBarRow label="Rohan" hue="purple" doneValue={4} expectedValue={9} maxValue={16} status="blocked" />
          <PairedBarRow label="Sneha" hue="teal" doneValue={11} expectedValue={10} maxValue={16} status="idle" />
        </div>
      </section>
      
    </div>
  );
}
