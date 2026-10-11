/**
 * Manages browser localStorage versioning.
 * On mismatch, purges all 'hos:*' keys except the theme preference.
 */
const STORAGE_VERSION_KEY = 'hos:storage-version';
const CURRENT_STORAGE_VERSION = '6';

export function initStorageVersion(): void {
  try {
    const current = localStorage.getItem(STORAGE_VERSION_KEY);
    if (current !== CURRENT_STORAGE_VERSION) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hos:') && !key.includes('theme')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    }
  } catch {
    // Ignore environments where localStorage is restricted
  }
}
