import { cn } from '@/lib/utils';

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const DEFAULT_STROKE = 1.75;

export function HomeIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-home', className)}
      aria-hidden="true"
    >
      <path className="icon-home-roof" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline className="icon-home-door" points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function MyRoomsIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-myrooms', className)}
      aria-hidden="true"
    >
      <g className="sq-back">
        <rect x="7" y="3" width="10" height="10" rx="2.5" fill="var(--nav-icon-bg, var(--shell, #F5F5F5))" stroke="currentColor" />
      </g>
      <g className="stack-icon-group">
        <rect x="4" y="6" width="10" height="10" rx="2.5" fill="var(--nav-icon-bg, var(--shell, #F5F5F5))" stroke="currentColor" />
        <g className="sq-front">
          <rect x="1" y="9" width="10" height="10" rx="2.5" fill="var(--nav-icon-bg, var(--shell, #F5F5F5))" stroke="currentColor" />
        </g>
      </g>
    </svg>
  );
}

export function PlaybooksIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-playbooks', className)}
      aria-hidden="true"
    >
      <g className="icon-tray">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
      </g>
      <g className="icon-arrow">
        <line x1="12" y1="15" x2="12" y2="3" />
      </g>
    </svg>
  );
}

export function ToolDirectoryIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-tooldirectory', className)}
      aria-hidden="true"
    >
      <path
        className="icon-wrench"
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      />
    </svg>
  );
}

export function PortfolioIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-portfolio', className)}
      aria-hidden="true"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path className="icon-handle" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path className="icon-lid" d="M2 13h20" />
    </svg>
  );
}

export function SettingsIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-settings', className)}
      aria-hidden="true"
    >
      <g className="icon-gear">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </g>
    </svg>
  );
}

export function CollapseLeftIcon({ size = 16, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-collapse-left', className)}
      aria-hidden="true"
    >
      <g className="icon-chevron">
        <polyline points="11 17 6 12 11 7" />
        <polyline points="18 17 13 12 18 7" />
      </g>
    </svg>
  );
}

export function CollapseRightIcon({ size = 16, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-collapse-right', className)}
      aria-hidden="true"
    >
      <g className="icon-chevron">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
      </g>
    </svg>
  );
}

export function BackArrowIcon({ size = 16, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-back', className)}
      aria-hidden="true"
    >
      <g className="icon-arrow-line">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </g>
    </svg>
  );
}

export function OverviewIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-overview', className)}
      aria-hidden="true"
    >
      <rect className="tile-tl" x="3" y="3" width="7" height="7" rx="1.5" />
      <rect className="tile-tr" x="14" y="3" width="7" height="7" rx="1.5" />
      <rect className="tile-bl" x="3" y="14" width="7" height="7" rx="1.5" />
      <rect className="tile-br" x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function TeamIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-team', className)}
      aria-hidden="true"
    >
      <g className="avatar-left">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </g>
      <g className="avatar-right">
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </g>
      <g className="avatar-center">
        <circle cx="12" cy="10" r="1.5" fill="currentColor" />
      </g>
    </svg>
  );
}

export function SpeedModeIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-speedmode', className)}
      aria-hidden="true"
    >
      <circle className="glow-ring" cx="12" cy="12" r="10" stroke="var(--brand-from, #2F9BEA)" strokeDasharray="3 3" />
      <polygon className="bolt" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none" />
    </svg>
  );
}

export function PrepIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-prep', className)}
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path className="icon-check" d="m9 14 2 2 4-4" />
    </svg>
  );
}

export function BriefIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-brief', className)}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line className="line-1" x1="8" y1="13" x2="16" y2="13" />
      <line className="line-2" x1="8" y1="17" x2="14" y2="17" />
      <line className="line-3" x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}

export function IdeateIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-ideate', className)}
      aria-hidden="true"
    >
      <g className="rays">
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <line x1="19.07" y1="4.93" x2="17.66" y2="6.34" />
      </g>
      <g className="bulb">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </g>
    </svg>
  );
}

export function CrowdCheckIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-crowdcheck', className)}
      aria-hidden="true"
    >
      <g className="person-back">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </g>
      <g className="person-extra">
        <circle cx="19" cy="8" r="3" />
        <path d="M22 21v-2a3 3 0 0 0-3-3" />
      </g>
    </svg>
  );
}

export function PlanIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-plan', className)}
      aria-hidden="true"
    >
      <circle cx="6" cy="19" r="3" />
      <path className="route-line" strokeDasharray="3 3" d="M9 19h4a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4H9" />
      <g className="end-pin">
        <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M18 11v1" />
      </g>
    </svg>
  );
}

export function BoardIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-board', className)}
      aria-hidden="true"
    >
      {/* Column 1 */}
      <rect x="3" y="3" width="7" height="18" rx="2" />
      {/* Column 2 */}
      <rect x="14" y="3" width="7" height="18" rx="2" />
      {/* Moving card from col 1 to col 2 */}
      <rect className="moving-card" x="4.5" y="6" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

export function ScheduleIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-schedule', className)}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <g className="cal-rings">
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
      </g>
      <circle className="date-dot" cx="8" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function MvpStudioIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-mvp', className)}
      aria-hidden="true"
    >
      <g className="rocket">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </g>
      <path className="flame" d="m4.5 19.5-2 2" stroke="currentColor" />
    </svg>
  );
}

export function DocsIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-docs', className)}
      aria-hidden="true"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path className="folder-flap" d="M2 10h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8z" />
    </svg>
  );
}

export function GithubIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-github', className)}
      aria-hidden="true"
    >
      <line x1="6" y1="3" x2="6" y2="21" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
      <circle className="branch-node" cx="18" cy="9" r="3" />
    </svg>
  );
}

export function ApiHubIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-apihub', className)}
      aria-hidden="true"
    >
      <path className="brace-left" d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path className="brace-right" d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
      <circle className="center-dot" cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function DiagramsIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-diagrams', className)}
      aria-hidden="true"
    >
      <rect className="node-1" x="3" y="3" width="6" height="6" rx="1.5" />
      <rect className="node-2" x="15" y="3" width="6" height="6" rx="1.5" />
      <rect className="node-3" x="9" y="15" width="6" height="6" rx="1.5" />
      <path className="connector-line" d="M6 9v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function PitchDeckIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-pitchdeck', className)}
      aria-hidden="true"
    >
      <rect className="screen" x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      {/* Chart bars */}
      <line className="bar-1" x1="6" y1="13" x2="6" y2="10" />
      <line className="bar-2" x1="10" y1="13" x2="10" y2="7" />
      <line className="bar-3" x1="14" y1="13" x2="14" y2="9" />
    </svg>
  );
}

export function RehearseIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-rehearse', className)}
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      {/* Soundwave arcs */}
      <path className="wave-1" d="M17 5a6 6 0 0 1 0 6" />
      <path className="wave-2" d="M19 3a9 9 0 0 1 0 10" />
    </svg>
  );
}

export function QaIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-qa', className)}
      aria-hidden="true"
    >
      <g className="bubble">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </g>
      <g className="qmark">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </g>
    </svg>
  );
}

export function DemoIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-demo', className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon className="play-btn" points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SubmissionIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-submission', className)}
      aria-hidden="true"
    >
      <path className="trail" d="M3 21c3-3 5-6 6-9" strokeDasharray="2 2" />
      <polygon className="plane" points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function ReadinessIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-readiness', className)}
      aria-hidden="true"
    >
      <path d="M12 2v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M20 12h2" />
      <path d="M2 12h2" />
      <path d="M17.66 6.34l1.41-1.41" />
      <path d="M12 6a6 6 0 0 0-6 6v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a6 6 0 0 0-6-6z" />
      <line className="needle" x1="12" y1="12" x2="16" y2="8" strokeWidth={2} />
    </svg>
  );
}

export function RetroIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-retro', className)}
      aria-hidden="true"
    >
      <g className="arrow-loop">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </g>
    </svg>
  );
}

export function InviteIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-invite', className)}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <g className="plus-icon">
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="17" y1="11" x2="23" y2="11" />
      </g>
    </svg>
  );
}

export function GroupChevronIcon({ size = 14, className, strokeWidth = DEFAULT_STROKE, isOpen = false }: IconProps & { isOpen?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon group-chevron', className)}
      data-open={isOpen ? 'true' : 'false'}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function BellIcon({ size = 18, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-bell', className)}
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function SearchIcon({ size = 14, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-search', className)}
      aria-hidden="true"
    >
      <g className="lens-group">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </g>
    </svg>
  );
}

export function LogoutIcon({ size = 16, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-logout', className)}
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <g className="arrow-part">
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </g>
    </svg>
  );
}

export function CopyLinkIcon({ size = 16, className, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('nav-icon nav-icon-copylink', className)}
      aria-hidden="true"
    >
      <path className="link-left" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path className="link-right" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
