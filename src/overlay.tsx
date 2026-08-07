import { forwardRef, useCallback, useMemo, type CSSProperties, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';
import { useComposedRefs } from './hooks/use-composed-refs';
import { TRANSITIONS } from './constants';

export const Overlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Overlay({ style, ...props }, ref) {
    const {
      overlayRef,
      snapPoints,
      shouldFade,
      isOpen,
      modal,
      shouldAnimate,
      onRelease,
      closeSheet,
      dismissible,
      progressiveOverlay,
      progressiveOverlayMaxOpacity,
      dragProgress,
      isDragging,
      activeSnapPoint,
    } = useSheetContext();
    const composedRef = useComposedRefs(ref, overlayRef);
    const hasSnapPoints = snapPoints && snapPoints.length > 0;

    const handleMouseUp = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => onRelease(event),
      [onRelease],
    );

    const handleClick = useCallback(() => {
      if (dismissible) closeSheet();
    }, [dismissible, closeSheet]);

    if (!modal && !progressiveOverlay) return null;

    // Progressive overlay: opacity based on drag progress
    const progressiveStyle = useMemo((): CSSProperties | undefined => {
      if (!progressiveOverlay) return undefined;

      if (!isOpen) {
        return {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          pointerEvents: 'none' as const,
        };
      }

      const firstSnapPercent = hasSnapPoints
        ? getFirstSnapPercent(snapPoints!)
        : 0;

      const minPercent = firstSnapPercent + 0.02;
      const maxPercent = minPercent + 0.45;

      // While dragging, darkness tracks the finger (dragProgress, no easing).
      // At rest, dragProgress is stale (frozen at the release point, before the
      // sheet finishes its animated snap) — derive the progress from the ACTIVE
      // snap position instead, and ease towards it in sync with the sheet.
      // Also covers programmatic snaps (no drag at all).
      const restProgress =
        activeSnapPoint != null ? snapPointPercent(activeSnapPoint) : dragProgress;
      const effectiveProgress = isDragging ? dragProgress : restProgress;

      let opacity: number;
      if (effectiveProgress <= minPercent) {
        opacity = 0;
      } else if (effectiveProgress >= maxPercent) {
        opacity = progressiveOverlayMaxOpacity;
      } else {
        const progress = (effectiveProgress - minPercent) / (maxPercent - minPercent);
        opacity = progress * progressiveOverlayMaxOpacity;
      }

      return {
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        transition: isDragging
          ? 'none'
          : `background-color ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        pointerEvents: (opacity > 0 ? 'auto' : 'none') as 'auto' | 'none',
      };
    }, [progressiveOverlay, isOpen, dragProgress, isDragging, activeSnapPoint, progressiveOverlayMaxOpacity, hasSnapPoints, snapPoints]);

    return (
      <div
        ref={composedRef}
        data-glidesheet-overlay=""
        data-state={isOpen ? 'open' : 'closed'}
        data-snap-points={isOpen && hasSnapPoints ? 'true' : 'false'}
        data-snap-points-overlay={isOpen && shouldFade ? 'true' : 'false'}
        data-animate={shouldAnimate?.current ? 'true' : 'false'}
        data-progressive={progressiveOverlay ? 'true' : 'false'}
        onPointerUp={handleMouseUp}
        onClick={handleClick}
        style={{ ...style, ...progressiveStyle }}
        {...props}
      />
    );
  },
);

function snapPointPercent(sp: number | string): number {
  if (typeof sp === 'number') return sp;
  const px = parseFloat(sp);
  return Number.isFinite(px) ? px / window.innerHeight : 0;
}

function getFirstSnapPercent(snapPoints: (number | string)[]): number {
  for (const sp of snapPoints) {
    if (typeof sp === 'number' && sp > 0) return sp;
    if (typeof sp === 'string') {
      const px = parseFloat(sp);
      if (px > 0) return px / window.innerHeight;
    }
  }
  return 0.3;
}
