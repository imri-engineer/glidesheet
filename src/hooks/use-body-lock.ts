import { useEffect, useLayoutEffect } from 'react';
import { isIOS } from '../utils/browser';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

let preventScrollCount = 0;
let restore: (() => void) | null = null;

export function useBodyLock({
  isOpen,
  modal,
  noBodyStyles,
}: {
  isOpen: boolean;
  modal: boolean;
  noBodyStyles: boolean;
}) {
  // Prevent Chrome pull-to-refresh whenever a sheet is open (modal or not)
  useIsomorphicLayoutEffect(() => {
    if (!isOpen || noBodyStyles) return;
    const original = document.documentElement.style.overscrollBehavior;
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.documentElement.style.overscrollBehavior = original;
    };
  }, [isOpen, noBodyStyles]);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !modal || noBodyStyles) return;

    preventScrollCount++;
    if (preventScrollCount === 1) {
      restore = isIOS() ? preventScrollMobileSafari() : preventScrollDesktop();
    }

    return () => {
      preventScrollCount--;
      if (preventScrollCount === 0) {
        restore?.();
        restore = null;
      }
    };
  }, [isOpen, modal, noBodyStyles]);
}

function preventScrollDesktop(): () => void {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const originalOverflow = document.body.style.overflow;
  const originalPaddingRight = document.body.style.paddingRight;
  const originalOverscroll = document.documentElement.style.overscrollBehavior;

  document.body.style.overflow = 'hidden';
  document.documentElement.style.overscrollBehavior = 'none';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
    document.documentElement.style.overscrollBehavior = originalOverscroll;
  };
}

function preventScrollMobileSafari(): () => void {
  let scrollable: Element;
  let lastY = 0;

  const onTouchStart = (e: TouchEvent) => {
    scrollable = getScrollParent(e.target as Element);
    if (scrollable === document.documentElement || scrollable === document.body) return;
    lastY = e.changedTouches[0].pageY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!scrollable || scrollable === document.documentElement || scrollable === document.body) {
      e.preventDefault();
      return;
    }

    const y = e.changedTouches[0].pageY;
    const scrollTop = scrollable.scrollTop;
    const bottom = scrollable.scrollHeight - scrollable.clientHeight;

    if (bottom === 0) return;
    if ((scrollTop <= 0 && y > lastY) || (scrollTop >= bottom && y < lastY)) {
      e.preventDefault();
    }
    lastY = y;
  };

  const onTouchEnd = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (isTextInput(target) && target !== document.activeElement) {
      e.preventDefault();
      target.style.transform = 'translateY(-2000px)';
      target.focus();
      requestAnimationFrame(() => {
        target.style.transform = '';
      });
    }
  };

  const onFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (!isTextInput(target)) return;

    target.style.transform = 'translateY(-2000px)';
    requestAnimationFrame(() => {
      target.style.transform = '';
      if (window.visualViewport) {
        if (window.visualViewport.height < window.innerHeight) {
          requestAnimationFrame(() => scrollIntoView(target));
        } else {
          window.visualViewport.addEventListener('resize', () => scrollIntoView(target), { once: true });
        }
      }
    });
  };

  const onWindowScroll = () => {
    window.scrollTo(0, 0);
  };

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const origPadding = document.documentElement.style.paddingRight;
  document.documentElement.style.paddingRight = `${scrollbarWidth}px`;

  const scrollX = window.pageXOffset;
  const scrollY = window.pageYOffset;
  window.scrollTo(0, 0);

  document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  document.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
  document.addEventListener('focus', onFocus, true);
  window.addEventListener('scroll', onWindowScroll);

  return () => {
    document.documentElement.style.paddingRight = origPadding;
    document.removeEventListener('touchstart', onTouchStart, true);
    document.removeEventListener('touchmove', onTouchMove, true);
    document.removeEventListener('touchend', onTouchEnd, true);
    document.removeEventListener('focus', onFocus, true);
    window.removeEventListener('scroll', onWindowScroll);
    window.scrollTo(scrollX, scrollY);
  };
}

const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox', 'radio', 'range', 'color', 'file', 'image', 'button', 'submit', 'reset', 'hidden',
]);

function isTextInput(target: Element): boolean {
  return (
    (target instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(target.type)) ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function isScrollableEl(node: Element): boolean {
  const style = window.getComputedStyle(node);
  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
}

function getScrollParent(node: Element): Element {
  let current: Element | null = node;
  if (current && isScrollableEl(current)) current = current.parentElement;
  while (current && !isScrollableEl(current)) current = current.parentElement;
  return current || document.scrollingElement || document.documentElement;
}

function scrollIntoView(target: Element) {
  const root = document.scrollingElement || document.documentElement;
  let current: Element | null = target;
  while (current && current !== root) {
    const scrollable = getScrollParent(current);
    if (scrollable !== document.documentElement && scrollable !== document.body && scrollable !== current) {
      const scrollableTop = scrollable.getBoundingClientRect().top;
      const targetBottom = target.getBoundingClientRect().bottom;
      const keyboardHeight = scrollable.getBoundingClientRect().bottom + 24;

      if (targetBottom > keyboardHeight) {
        scrollable.scrollTop += target.getBoundingClientRect().top - scrollableTop;
      }
    }
    current = scrollable.parentElement;
  }
}
