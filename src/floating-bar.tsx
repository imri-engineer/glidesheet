import { forwardRef, useCallback, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useSheetContext } from './context';

const DEFAULT_GAP = 16;
const FADE_START = 0.5;
const FADE_END = 0.65;

export interface FloatingBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: number;
  hideWhileDragging?: boolean;
  fadeStart?: number;
  fadeEnd?: number;
}

export const FloatingBar = forwardRef<HTMLDivElement, FloatingBarProps>(function FloatingBar(
  { children, gap = DEFAULT_GAP, hideWhileDragging = false, fadeStart = FADE_START, fadeEnd = FADE_END, style, ...rest },
  ref,
) {
  const { isOpen, isDragging, dragProgress, sheetRef } = useSheetContext();
  const [barHeight, setBarHeight] = useState(0);

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

  const { fadeOpacity, slideOffset } = useMemo(() => {
    if (dragProgress <= fadeStart) return { fadeOpacity: 1, slideOffset: 0 };
    if (dragProgress >= fadeEnd) return { fadeOpacity: 0, slideOffset: 40 };

    const progress = (dragProgress - fadeStart) / (fadeEnd - fadeStart);
    return { fadeOpacity: 1 - progress, slideOffset: progress * 40 };
  }, [dragProgress, fadeStart, fadeEnd]);

  if (!isOpen || fadeOpacity === 0) return null;
  if (hideWhileDragging && isDragging) return null;

  const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? window.innerHeight;
  const topPosition = sheetTop - gap - barHeight + slideOffset;

  return (
    <div
      ref={composedRef}
      data-glidesheet-floating-bar=""
      style={{
        position: 'fixed',
        top: `${topPosition}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--glidesheet-z-index, 50)',
        opacity: fadeOpacity,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});
