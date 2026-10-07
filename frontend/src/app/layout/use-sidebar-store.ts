/**
 * Sidebar state — expanded/collapsed, context (workspace vs room)
 */
import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  /** 'workspace' or 'room' context determines nav items and bottom slot */
  context: 'workspace' | 'room';
  /** Current room name (when in room context) */
  roomName: string | null;
  /** Current active nav item path */
  activePath: string;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setContext: (ctx: 'workspace' | 'room', roomName?: string) => void;
  setActivePath: (path: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  context: 'workspace',
  roomName: null,
  activePath: '/home',

  toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  setContext: (ctx, roomName) =>
    set({ context: ctx, roomName: roomName ?? null }),
  setActivePath: (path) => set({ activePath: path }),
}));
