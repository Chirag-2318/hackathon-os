import { useEffect, useRef, useState } from 'react';

// Measures the box the product screen sits in and works out how much to shrink the screen (drawn at its real
// "design" width) so that it fits that box. The inner screen is given the matching taller height so it fills the box.
export function useFitScale(designWidth: number, minScale: number) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: designWidth, height: 620 });

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, Math.max(minScale, size.width / designWidth));
  return { boxRef, scale, designHeight: Math.ceil(size.height / scale) };
}
