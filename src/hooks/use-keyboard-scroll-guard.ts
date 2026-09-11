import { useEffect, type RefObject } from 'react';
import { isInput } from '../utils/dom';

/** Window after a focus / keyboard resize during which a non-finger scroll is undone. */
const ARMED_MS = 1500;

/**
 * Non-modal sheets on iOS: when an input inside the sheet gets focus, WebKit
 * scrolls the DOCUMENT by the keyboard height to reveal it, and the whole fixed
 * sheet rides up with the page. Modal sheets never hit this — the body lock
 * already parks the input off-screen at focus and resets the window scroll.
 * This does the same for non-modal sheets, without locking the page:
 *  - at focus, the input is moved off-screen for one frame so WebKit has
 *    nothing to reveal (react-aria's trick);
 *  - for a short window after focus and after each keyboard resize, a scroll
 *    not driven by a finger puts the window back where it was.
 */
export function useKeyboardScrollGuard({
  sheetRef,
  isOpen,
  enabled,
}: {
  sheetRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!isOpen || !enabled || typeof window === 'undefined') return;

    let pinnedY: number | null = null;
    let armedUntil = 0;
    let touching = false;

    const arm = () => {
      armedUntil = Date.now() + ARMED_MS;
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
    };
    const onScroll = () => {
      if (pinnedY === null || touching || Date.now() > armedUntil) return;
      if (window.scrollY !== pinnedY) window.scrollTo(0, pinnedY);
    };
    const onViewportResize = () => {
      if (pinnedY !== null) arm();
    };
    const onFocus = (e: FocusEvent) => {
      const target = e.target;
      const sheet = sheetRef.current;
      if (!sheet || !(target instanceof HTMLElement) || !isInput(target) || !sheet.contains(target)) return;
      pinnedY = window.scrollY;
      arm();
      target.style.transform = 'translateY(-2000px)';
      requestAnimationFrame(() => {
        target.style.transform = '';
      });
    };
    const onBlur = () => {
      pinnedY = null;
    };

    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.visualViewport?.addEventListener('resize', onViewportResize);
    return () => {
      document.removeEventListener('focus', onFocus, true);
      document.removeEventListener('blur', onBlur, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.visualViewport?.removeEventListener('resize', onViewportResize);
    };
  }, [isOpen, enabled, sheetRef]);
}
