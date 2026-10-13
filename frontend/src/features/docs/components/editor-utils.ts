export type Format = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';

export const EASE = [0.16, 1, 0.3, 1] as const;
export const EXIT = { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as const;
export const SETTLE = 250;

export const ARRIVE_MS: Record<Format, number> = {
  bold: 220,
  italic: 220,
  underline: 260,
  strikethrough: 260,
  code: 220,
};

export const LEAVE_MS: Record<Format, number> = {
  bold: 160,
  italic: 160,
  underline: 180,
  strikethrough: 180,
  code: 160,
};

export const SHORTCUTS: Partial<Record<string, Format>> = { b: 'bold', i: 'italic', u: 'underline' };

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const rewrites = new WeakMap<Element, number>();

export function offsetsOf(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const from = (container: Node, offset: number) => {
    const span = document.createRange();
    span.setStart(root, 0);
    span.setEnd(container, offset);
    return span.toString().length;
  };
  return {
    start: from(range.startContainer, range.startOffset),
    end: from(range.endContainer, range.endOffset),
  };
}

export function restore(root: HTMLElement, offsets: { start: number; end: number } | null) {
  if (!offsets) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let seen = 0;
  let started = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = (node as Text).length;
    if (!started && offsets.start <= seen + length) {
      range.setStart(node, offsets.start - seen);
      started = true;
    }
    if (started && offsets.end <= seen + length) {
      range.setEnd(node, offsets.end - seen);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    seen += length;
  }
}

export function keepSelection(root: HTMLElement, rebuild: () => void) {
  const offsets = offsetsOf(root);
  rebuild();
  rewrites.set(root, performance.now());
  restore(root, offsets);
}

export function markOf(node: Node, format: Format, root: HTMLElement) {
  const mark = node.parentElement?.closest<HTMLElement>(
    `.editor-mark[data-format="${format}"]:not([data-leaving])`
  );
  return mark && root.contains(mark) ? mark : null;
}

export function textWithin(range: Range, root: HTMLElement, partly = false) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (!text.length) continue;

    const inside = partly
      ? range.intersectsNode(text) &&
        !(range.startContainer === text && range.startOffset === text.length) &&
        !(range.endContainer === text && range.endOffset === 0)
      : range.comparePoint(text, 0) === 0 && range.comparePoint(text, text.length) === 0;
    if (inside) nodes.push(text);
  }
  return nodes;
}

export function splitText(range: Range, root: HTMLElement) {
  const { startContainer: start, startOffset, endContainer: end, endOffset } = range;
  if (end instanceof Text && endOffset < end.length) end.splitText(endOffset);
  if (start instanceof Text && startOffset > 0 && startOffset < start.length) {
    const tail = start.splitText(startOffset);
    range.setStart(tail, 0);
    if (end === start) range.setEnd(tail, tail.length);
  }
  return textWithin(range, root);
}

export function formatsOf(range: Range, root: HTMLElement) {
  const nodes = textWithin(range, root, true);
  const FORMAT_NAMES: Format[] = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
  return new Set(
    FORMAT_NAMES.filter(
      (format) => nodes.length > 0 && nodes.every((node) => markOf(node, format, root))
    )
  );
}

export function unwrap(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  parent.removeChild(element);
}

export function textsIn(element: Element) {
  const texts: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    if ((node as Text).length) texts.push(node as Text);
  return texts;
}

export function markRuns(nodes: Text[], format: Format) {
  const covered = new Set<Node>(nodes);
  const units: Node[] = [];
  for (const node of nodes) {
    let unit: Node = node;
    for (
      let parent = unit.parentElement;
      parent?.matches('.editor-mark, .editor-word') &&
      textsIn(parent).every((text) => covered.has(text));
      parent = unit.parentElement
    )
      unit = parent;
    if (units.at(-1) !== unit) units.push(unit);
  }
  const marks: HTMLElement[] = [];
  let run: Node[] = [];
  const close = () => {
    const first = run[0];
    if (!first) return;
    const mark = document.createElement('span');
    mark.className = 'editor-mark';
    mark.dataset.format = format;
    first.parentNode?.insertBefore(mark, first);
    for (const u of run) mark.appendChild(u);
    marks.push(mark);
    run = [];
  };
  for (const u of units) {
    if (run.length && run.at(-1)?.nextSibling !== u) close();
    run.push(u);
  }
  close();
  return marks;
}

export function isolate(mark: HTMLElement, first: Node, last: Node) {
  const head = document.createRange();
  head.setStart(mark, 0);
  head.setEndBefore(first);
  if (!head.collapsed) {
    const piece = mark.cloneNode(false) as HTMLElement;
    piece.appendChild(head.extractContents());
    if (piece.textContent) mark.parentNode?.insertBefore(piece, mark);
  }
  const tail = document.createRange();
  tail.setStartAfter(last);
  tail.setEnd(mark, mark.childNodes.length);
  if (!tail.collapsed) {
    const piece = mark.cloneNode(false) as HTMLElement;
    piece.appendChild(tail.extractContents());
    if (piece.textContent) mark.parentNode?.insertBefore(piece, mark.nextSibling);
  }
}

export function slantWords(mark: HTMLElement) {
  const walker = document.createTreeWalker(mark, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node as Text);
  for (const text of texts) {
    const parts = text.data.split(/(\s+)/).filter(Boolean);
    if (parts.length === 1 && /\s/.test(parts[0] ?? '')) continue;
    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }
      const word = document.createElement('span');
      word.className = 'editor-word';
      word.textContent = part;
      fragment.appendChild(word);
    }
    text.parentNode?.replaceChild(fragment, text);
  }
}

export function unslantWords(mark: HTMLElement) {
  for (const word of mark.querySelectorAll('.editor-word')) unwrap(word);
  mark.normalize();
}

export function boldSpacing(mark: HTMLElement) {
  const text = mark.textContent ?? '';
  if (!text.length) return 0;
  const probe = document.createElement('span');
  probe.textContent = text;
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-weight:400';
  mark.parentNode?.insertBefore(probe, mark.nextSibling);
  const regular = probe.getBoundingClientRect().width;
  probe.style.fontWeight = '700';
  const bold = probe.getBoundingClientRect().width;
  probe.parentNode?.removeChild(probe);
  return (bold - regular) / text.length;
}

export function drawInTurn(marks: HTMLElement[], format: Format) {
  if (marks.length < 2 || (format !== 'underline' && format !== 'strikethrough')) return;
  const widths = marks.map((mark) =>
    [...mark.getClientRects()].reduce((sum, box) => sum + box.width, 0)
  );
  const total = widths.reduce((sum, width) => sum + width, 0) || 1;
  let before = 0;
  marks.forEach((mark, index) => {
    const width = widths[index] ?? 0;
    mark.style.transitionDelay = `${String((ARRIVE_MS[format] * before) / total)}ms`;
    mark.style.transitionDuration = `${String((ARRIVE_MS[format] * width) / total)}ms`;
    mark.style.transitionTimingFunction = 'linear';
    before += width;
  });
}

export function arrive(mark: HTMLElement, format: Format, instant: boolean) {
  const ms = reducedMotion() || instant ? 0 : ARRIVE_MS[format];
  if (!instant) {
    mark.dataset.instant = '';
    window.requestAnimationFrame(() => delete mark.dataset.instant);
  }
  if (format === 'bold')
    mark.style.setProperty('--editor-bold-spacing', `${String(boldSpacing(mark))}px`);
  if (format === 'italic') slantWords(mark);
  void mark.offsetWidth;
  mark.dataset.on = '';
  window.setTimeout(() => {
    mark.style.removeProperty('transition-delay');
    mark.style.removeProperty('transition-duration');
    mark.style.removeProperty('transition-timing-function');
  }, ms + 50);
}

export function leave(mark: HTMLElement, format: Format, root: HTMLElement, instant: boolean) {
  const ms = reducedMotion() || instant ? 0 : LEAVE_MS[format];
  mark.dataset.leaving = '';
  void mark.offsetWidth;
  delete mark.dataset.on;
  window.setTimeout(() => {
    if (!mark.isConnected) return;
    keepSelection(root, () => {
      if (format === 'italic') unslantWords(mark);
      const parent = mark.parentNode;
      unwrap(mark);
      parent?.normalize();
    });
  }, ms + 50);
}
