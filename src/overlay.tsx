import { forwardRef, useCallback, useMemo, type CSSProperties, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';
import { useComposedRefs } from './hooks/use-composed-refs';

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

    if (!modal) return null;

    // Progressive overlay: opacity based on drag progress
    const progressiveStyle = useMemo((): CSSProperties | undefined => {
      if (!progressiveOverlay) return undefined;

      const firstSnapPercent = hasSnapPoints
        ? getFirstSnapPercent(snapPoints!)
        : 0;

      const minPercent = firstSnapPercent + 0.02;
      const maxPercent = minPercent + 0.45;

      let opacity: number;
      if (dragProgress <= minPercent) {
        opacity = 0;
      } else if (dragProgress >= maxPercent) {
        opacity = progressiveOverlayMaxOpacity;
      } else {
        const progress = (dragProgress - minPercent) / (maxPercent - minPercent);
        opacity = progress * progressiveOverlayMaxOpacity;
      }

      return {
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        transition: 'none',
      };
    }, [progressiveOverlay, dragProgress, progressiveOverlayMaxOpacity, hasSnapPoints, snapPoints]);

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
