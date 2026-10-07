import { create } from 'zustand';
import type { CurrentUserDto } from './api';

interface AuthState {
  user: CurrentUserDto | null;
  setUser: (user: CurrentUserDto | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
