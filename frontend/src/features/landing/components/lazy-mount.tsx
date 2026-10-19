import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// Renders its children only once it is close to the screen, and keeps them afterwards. Keeps the page light when
// many heavy children (the product screen copies) are stacked.
export function LazyMount({ children, minHeight = 240, rootMargin = '320px' }: { children: ReactNode; minHeight?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || show) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} className="l-lazy" style={{ minHeight: show ? undefined : minHeight }}>
      {show ? children : null}
    </div>
  );
}
