export function getTranslateY(element: HTMLElement): number | null {
  if (!element) return null;

  const style = window.getComputedStyle(element);
  const transform =
    style.transform || (style as any).webkitTransform || (style as any).mozTransform;
  if (!transform) return null;

  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) return parseFloat(mat[1].split(', ')[13]);

  mat = transform.match(/^matrix\((.+)\)$/);
  return mat ? parseFloat(mat[1].split(', ')[5]) : null;
}

export function isScrollable(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
}

export function getScrollParent(node: Element | null): Element {
  let current = node;
  while (current) {
    if (current instanceof HTMLElement && isScrollable(current)) return current;
    current = current.parentElement;
  }
  return document.documentElement;
}

export function isInput(target: Element): boolean {
  return (
    (target instanceof HTMLInputElement &&
      !['button', 'checkbox', 'radio', 'range', 'reset', 'submit', 'image', 'file', 'hidden', 'color'].includes(
        target.type,
      )) ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function isInView(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (!window.visualViewport) return false;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.visualViewport.height - 40 &&
    rect.right <= window.visualViewport.width
  );
}

export function assignStyle(
  element: HTMLElement | null | undefined,
  style: Partial<CSSStyleDeclaration>,
): () => void {
  if (!element) return () => {};
  const prevStyle = element.style.cssText;
  Object.assign(element.style, style);
  return () => {
    element.style.cssText = prevStyle;
  };
}

export function chain<T extends (...args: any[]) => any>(...fns: (T | undefined)[]) {
  return (...args: Parameters<T>) => {
    for (const fn of fns) {
      if (typeof fn === 'function') fn(...args);
    }
  };
}

// A `[data-glidesheet-drag]` zone (e.g. a sticky header living inside the scroller)
// always drags the sheet, even when its scroller is scrolled — unless a nested
// `[data-glidesheet-no-drag]` area sits between the target and the zone.
export function isInDragZone(target: Element | null): boolean {
  const zone = target?.closest?.('[data-glidesheet-drag]');
  if (!zone) return false;
  const noDrag = target!.closest('[data-glidesheet-no-drag]');
  return !noDrag || !zone.contains(noDrag);
}
