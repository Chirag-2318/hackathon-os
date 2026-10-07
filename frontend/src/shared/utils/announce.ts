/**
 * Live-region announcement utility
 * Source: animations.md §3.3
 *
 * Creates/updates an aria-live region for screen reader announcements.
 * Used for: "Idea locked", "Plan validated", "Submitted", etc.
 * Meaningful motion has a text/live-region equivalent.
 */

const REGION_ID = 'hackos-live-announcements';

function getOrCreateRegion(): HTMLElement {
  let region = document.getElementById(REGION_ID);
  if (!region) {
    region = document.createElement('div');
    region.id = REGION_ID;
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    // Visually hidden but accessible to screen readers
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(region);
  }
  return region;
}

/**
 * Announce a message to screen readers via a live region.
 *
 * @param message - The text to announce
 * @param priority - 'polite' (default) waits for a pause; 'assertive' interrupts
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const region = getOrCreateRegion();
  region.setAttribute('aria-live', priority);

  // Clear and re-set to trigger the announcement
  region.textContent = '';
  // Force a reflow so the screen reader sees the change
  void region.offsetHeight;
  region.textContent = message;
}

/**
 * Clear the announcement region.
 */
export function clearAnnouncement(): void {
  const region = document.getElementById(REGION_ID);
  if (region) {
    region.textContent = '';
  }
}
