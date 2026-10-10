/**
 * featureFlags.ts — Frontend feature gating & module visibility.
 * Modules in HIDDEN_MODULES are completely omitted from navigation, links, and overviews.
 * Re-enabling a module is a one-line change to this array.
 */

export const HIDDEN_MODULES = ["prep", "crowd-check", "schedule"] as const;

export type HiddenModule = typeof HIDDEN_MODULES[number];

export function isModuleHidden(moduleId: string): boolean {
  return (HIDDEN_MODULES as readonly string[]).includes(moduleId);
}
