/**
 * Sidebar state — expanded/collapsed, context (workspace vs room)
 */
import { create } from 'zustand';

export type SidebarDefault = 'expanded' | 'collapsed';

interface SidebarState {
  isCollapsed: boolean;
  sidebarDefault: SidebarDefault;
  /** 'workspace' or 'room' context determines nav items and bottom slot */
  context: 'workspace' | 'room';
  /** Current room name (when in room context) */
  roomName: string | null;
  /** Current active nav item path */
  activePath: string;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setSidebarDefault: (val: SidebarDefault) => void;
  setContext: (ctx: 'workspace' | 'room', roomName?: string) => void;
  setActivePath: (path: string) => void;
}

const getStoredSidebarDefault = (): SidebarDefault => {
  if (typeof window === 'undefined') return 'expanded';
  try {
    const val = localStorage.getItem('sidebar_default');
    if (val === 'expanded' || val === 'collapsed') return val;
  } catch {}
  return 'expanded';
};

const initialDefault = getStoredSidebarDefault();

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarDefault: initialDefault,
  isCollapsed: initialDefault === 'collapsed',
  context: 'workspace',
  roomName: null,
  activePath: '/home',

  toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  setSidebarDefault: (val) => {
    try {
      localStorage.setItem('sidebar_default', val);
    } catch {}
    set({ sidebarDefault: val, isCollapsed: val === 'collapsed' });
  },
  setContext: (ctx, roomName) =>
    set({ context: ctx, roomName: roomName ?? null }),
  setActivePath: (path) => set({ activePath: path }),
}));
