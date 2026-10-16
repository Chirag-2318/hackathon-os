export interface CustomLinkDto {
  label: string;
  url: string;
}

export interface PortfolioSettingsDto {
  isPublic: boolean;
  slug?: string;
  bio?: string;
  customLinks: CustomLinkDto[];
}

export interface UserProfileDto {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  avatarType?: string;
  avatarPreset?: number;
  provider?: string;
  githubLogin?: string;
  joinedAt: string;
  bio?: string;
  customLinks: CustomLinkDto[];
  builderLine?: string;
}

export interface PortfolioStatsDto {
  hackathonsJoined: number;
  projectsShipped: number;
  tasksCompleted: number;
  teamsLed: number;
  teammatesCount: number;
  streakDays: number;
  totalBuildDays: number;
}

export interface TeamMemberSummaryDto {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  avatarType?: string;
  avatarPreset?: number;
  role?: string;
}

export interface ProjectLinksDto {
  demoUrl?: string;
  videoUrl?: string;
  deckUrl?: string;
  repoUrl?: string;
  liveUrl?: string;
  submissionUrl?: string;
}

export interface ContributionDto {
  tasksCompleted: number;
  ideasAccepted: number;
  commitsCount: number;
  additions: number;
  deletions: number;
  taskSummaries: string[];
}

export interface AwardDto {
  id: string;
  name: string;
  detail?: string;
}

export interface CaseStudyDetailDto {
  problem?: string;
  whatWeBuilt?: string;
  techStack: string[];
  myContribution: ContributionDto;
  team: TeamMemberSummaryDto[];
  links: ProjectLinksDto;
  outcome?: string;
  awards: AwardDto[];
}

export interface ProjectCardDto {
  roomId: string;
  name: string;
  hackathonName: string;
  dates: string;
  role: string;
  pitch: string;
  techStack: string[];
  team: TeamMemberSummaryDto[];
  links: ProjectLinksDto;
  pinned: boolean;
  pinOrder: number;
  visible: boolean;
  coverImageUrl?: string;
  status: string;
  caseStudy: CaseStudyDetailDto;
}

export interface PassportStampDto {
  roomId: string;
  name: string;
  eventName: string;
  dates: string;
  role: string;
  furthestStage: string;
  isSubmitted: boolean;
  outcome?: string;
  pinned: boolean;
  visible: boolean;
  caseStudy: CaseStudyDetailDto;
}

export interface DailyActivityDto {
  date: string;
  count: number;
  tasksCount: number;
  commitsCount: number;
  ideasCount: number;
  docsCount: number;
}

export interface BusiestDayDto {
  date: string;
  count: number;
  roomName?: string;
}

export interface ActivityHeatmapDto {
  days: DailyActivityDto[];
  busiestDay?: BusiestDayDto;
  totalActions: number;
}

export interface StackItemDto {
  name: string;
  category: string;
  projectCount: number;
  projectNames: string[];
}

export interface RoleFingerprintDto {
  builderTasks: number;
  leaderActions: number;
  productIdeas: number;
  pitchPresence: number;
  total: number;
}

export interface CollaboratorDto {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  avatarType?: string;
  avatarPreset?: number;
  sharedHackathonsCount: number;
  publicPortfolio: boolean;
}

export interface MilestoneDto {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  target: number;
  icon: string;
}

export interface FullPortfolioResponse {
  profile: UserProfileDto;
  settings: PortfolioSettingsDto;
  stats: PortfolioStatsDto;
  featuredProjects: ProjectCardDto[];
  timelineStamps: PassportStampDto[];
  heatmap: ActivityHeatmapDto;
  stackConstellation: StackItemDto[];
  roleFingerprint: RoleFingerprintDto;
  collaborators: CollaboratorDto[];
  milestones: MilestoneDto[];
  isOwner: boolean;
}

export interface UpdateSettingsRequest {
  isPublic?: boolean;
  slug?: string;
  bio?: string;
  customLinks?: CustomLinkDto[];
}

export interface UpdateProjectCurationRequest {
  pinned?: boolean;
  pinOrder?: number;
  visible?: boolean;
}
