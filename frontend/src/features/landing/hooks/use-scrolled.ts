/**
 * useScrolled — returns true when the page has scrolled past the threshold.
 * React only re-renders when the boolean actually changes.
 */
import { useState, useEffect } from 'react';

export function useScrolled(threshold = 80): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const check = () => setScrolled(window.scrollY > threshold);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [threshold]);

  return scrolled;
}
