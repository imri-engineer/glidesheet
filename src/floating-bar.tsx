import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useSheetContext } from './context';

const DEFAULT_GAP = 16;
const FADE_START = 50;
const FADE_END = 65;

export interface FloatingBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: number;
  hideWhileDragging?: boolean;
  fadeStartPercent?: number;
  fadeEndPercent?: number;
}

export const FloatingBar = forwardRef<HTMLDivElement, FloatingBarProps>(function FloatingBar(
  {
    children,
    gap = DEFAULT_GAP,
    hideWhileDragging = false,
    fadeStartPercent = FADE_START,
    fadeEndPercent = FADE_END,
    style,
    ...rest
  },
  ref,
) {
  const { isOpen, sheetRef } = useSheetContext();
  const [barHeight, setBarHeight] = useState(0);
  const [position, setPosition] = useState({ top: 0, opacity: 0, visible: false });
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setBarHeight(node.offsetHeight);
  }, []);

  const composedRef = useCallback(
    (node: HTMLDivElement | null) => {
      measureRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref, measureRef],
  );

  // RAF loop — track sheet position every frame (during drag AND transitions)
  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: 0, opacity: 0, visible: false });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const update = () => {
      const sheet = sheetRef.current;
      if (!sheet) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      const sheetTop = sheet.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const screenPercent = ((viewportHeight - sheetTop) / viewportHeight) * 100;

      let fadeOpacity: number;
      let slideOffset: number;

      if (screenPercent <= fadeStartPercent) {
        fadeOpacity = 1;
        slideOffset = 0;
      } else if (screenPercent >= fadeEndPercent) {
        fadeOpacity = 0;
        slideOffset = 40;
      } else {
        const progress = (screenPercent - fadeStartPercent) / (fadeEndPercent - fadeStartPercent);
        fadeOpacity = 1 - progress;
        slideOffset = progress * 40;
      }

      const topPos = sheetTop - gap - barHeight + slideOffset;

      setPosition({
        top: topPos,
        opacity: fadeOpacity,
        visible: fadeOpacity > 0,
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    // Track dragging via pointer events on document
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-glidesheet]') || target.closest('[data-glidesheet-handle]')) {
        isDraggingRef.current = true;
      }
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [isOpen, sheetRef, gap, barHeight, fadeStartPercent, fadeEndPercent]);

  if (!isOpen || !position.visible) return null;
  if (hideWhileDragging && isDraggingRef.current) return null;

  return (
    <div
      ref={composedRef}
      data-glidesheet-floating-bar=""
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'calc(var(--glidesheet-z-index, 50) + 1)',
        opacity: position.opacity,
        pointerEvents: position.opacity > 0 ? 'auto' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});
