/**
 * Dev-only contrast checker utility.
 * Excluded from production builds via import.meta.env.DEV guard.
 * Runs when URL contains ?contrast=1.
 */

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(str: string): RgbaColor {
  str = str.trim().toLowerCase();
  if (str === 'transparent' || !str) return { r: 0, g: 0, b: 0, a: 0 };
  const rgbaMatch = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    return {
      r: parseFloat(rgbaMatch[1]),
      g: parseFloat(rgbaMatch[2]),
      b: parseFloat(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function compositeColors(fg: RgbaColor, bg: RgbaColor): RgbaColor {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
  return { r, g, b, a };
}

function getLuminance(c: RgbaColor): number {
  const srgb = [c.r / 255, c.g / 255, c.b / 255];
  const linear = srgb.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function getContrastRatio(fg: RgbaColor, bg: RgbaColor): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getEffectiveBackground(el: HTMLElement, isDark: boolean): RgbaColor {
  let current: HTMLElement | null = el;
  let bgLayers: RgbaColor[] = [];

  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const bg = parseColor(style.backgroundColor);
    if (bg.a > 0) {
      bgLayers.unshift(bg); // bottom layers first
      if (bg.a === 1) break;
    }
    current = current.parentElement;
  }

  // Base canvas default: #0E0E10 for dark, #FFFFFF for light
  let baseColor: RgbaColor = isDark ? { r: 14, g: 14, b: 16, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  let effective = baseColor;
  for (const layer of bgLayers) {
    effective = compositeColors(layer, effective);
  }
  return effective;
}

function getSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  const parts: string[] = [];
  let curr: HTMLElement | null = el;
  while (curr && curr !== document.body && parts.length < 3) {
    let name = curr.tagName.toLowerCase();
    if (curr.className && typeof curr.className === 'string') {
      const firstClass = curr.className.split(/\s+/).filter(Boolean)[0];
      if (firstClass && !firstClass.includes(':') && !firstClass.includes('/')) {
        name += `.${firstClass}`;
      }
    }
    parts.unshift(name);
    curr = curr.parentElement;
  }
  return parts.join(' > ');
}

export function runContrastCheck(): void {
  if (!import.meta.env.DEV) return;
  if (!window.location.search.includes('contrast=1')) return;

  const isDark = document.documentElement.classList.contains('dark');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      if (!el.offsetParent && el.tagName !== 'BODY') return NodeFilter.FILTER_SKIP;
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'svg', 'noscript', 'canvas', 'img'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const results: any[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    // Check direct text content
    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() || '')
      .join(' ');

    if (!directText) continue;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      continue;
    }

    const fg = parseColor(style.color);
    if (fg.a === 0) continue;

    const effectiveBg = getEffectiveBackground(el, isDark);
    const finalFg = fg.a < 1 ? compositeColors(fg, effectiveBg) : fg;
    const ratio = getContrastRatio(finalFg, effectiveBg);

    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight) || 400;
    const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    const threshold = isLarge ? 3.0 : 4.5;

    if (ratio < threshold) {
      results.push({
        Selector: getSelector(el),
        Text: directText.slice(0, 30),
        'FG Color': `rgb(${Math.round(finalFg.r)}, ${Math.round(finalFg.g)}, ${Math.round(finalFg.b)})`,
        'BG Color': `rgb(${Math.round(effectiveBg.r)}, ${Math.round(effectiveBg.g)}, ${Math.round(effectiveBg.b)})`,
        'Font Size': `${Math.round(fontSize)}px`,
        Ratio: ratio.toFixed(2),
        Required: `${threshold}:1`,
      });
    }
  }

  if (results.length > 0) {
    console.warn(`[Contrast Checker] Found ${results.length} low-contrast elements (Theme: ${isDark ? 'dark' : 'light'}):`);
    console.table(results);
  } else {
    console.log(`[Contrast Checker] All visible elements pass AA contrast! (Theme: ${isDark ? 'dark' : 'light'})`);
  }
}

export function initContrastChecker(): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;

  // Initial check
  setTimeout(runContrastCheck, 500);

  // Re-run on route changes
  window.addEventListener('popstate', () => {
    setTimeout(runContrastCheck, 300);
  });

  const origPush = window.history.pushState;
  window.history.pushState = function (...args) {
    const res = origPush.apply(this, args);
    setTimeout(runContrastCheck, 300);
    return res;
  };

  const origReplace = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const res = origReplace.apply(this, args);
    setTimeout(runContrastCheck, 300);
    return res;
  };
}
