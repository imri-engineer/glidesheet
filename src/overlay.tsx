import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
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
      sheetRef,
      progressiveOverlay,
      progressiveOverlayMaxOpacity,
      progressiveOverlayFadeStart,
      progressiveOverlayFadeEnd,
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

    // ── Progressive overlay ──
    // Opacity follows the sheet's real on-screen position EVERY frame — during the
    // drag AND during snap-point/close transitions — by reading getBoundingClientRect
    // in a RAF loop (same approach as <FloatingBar>). Driving it from the React
    // `dragProgress` state only worked while the finger moved: once released, the
    // sheet animated via CSS transition with no onDrag firing, so the overlay froze
    // and snapped instead of tracking the motion. The RAF loop fixes that.
    useEffect(() => {
      if (!progressiveOverlay) return;
      const el = overlayRef.current;
      if (!el) return;

      if (!isOpen) {
        el.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        el.style.pointerEvents = 'none';
        return;
      }

      // Resolve fade thresholds (ratio of screen height, 0–1).
      // Override via props (number ratio OR 'NNNpx'); otherwise derive from snaps:
      //   start = lowest visible snap (+2% so it's transparent at rest)
      //   end   = highest snap
      const lowSnap = hasSnapPoints ? getFirstSnapPercent(snapPoints!) : 0;
      const highSnap = hasSnapPoints ? getLastSnapPercent(snapPoints!) : 1;
      const minPercent =
        progressiveOverlayFadeStart !== undefined
          ? toRatio(progressiveOverlayFadeStart)
          : lowSnap + 0.02;
      const maxPercent =
        progressiveOverlayFadeEnd !== undefined ? toRatio(progressiveOverlayFadeEnd) : highSnap;

      let rafId = 0;
      const update = () => {
        const sheet = sheetRef.current;
        if (sheet) {
          const sheetTop = sheet.getBoundingClientRect().top;
          const viewportHeight = window.innerHeight;
          const progress = Math.max(0, Math.min(1, (viewportHeight - sheetTop) / viewportHeight));

          let opacity: number;
          if (progress <= minPercent) {
            opacity = 0;
          } else if (progress >= maxPercent) {
            opacity = progressiveOverlayMaxOpacity;
          } else {
            opacity =
              ((progress - minPercent) / (maxPercent - minPercent)) * progressiveOverlayMaxOpacity;
          }

          // Force element opacity to 1: the snap-point CSS rule sets opacity:0 on
          // [data-snap-points='true'], which would hide our background-color fade.
          // In progressive mode the visible darkness comes from background-color
          // alpha only, so the element itself must stay fully opaque.
          el.style.opacity = '1';
          el.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
          el.style.pointerEvents = opacity > 0 ? 'auto' : 'none';
        }
        rafId = requestAnimationFrame(update);
      };
      rafId = requestAnimationFrame(update);

      return () => cancelAnimationFrame(rafId);
    }, [
      progressiveOverlay,
      isOpen,
      hasSnapPoints,
      snapPoints,
      progressiveOverlayMaxOpacity,
      progressiveOverlayFadeStart,
      progressiveOverlayFadeEnd,
      overlayRef,
      sheetRef,
    ]);

    if (!modal && !progressiveOverlay) return null;

    const progressiveBaseStyle: CSSProperties | undefined = progressiveOverlay
      ? { backgroundColor: 'rgba(0, 0, 0, 0)', transition: 'none', pointerEvents: 'none' }
      : undefined;

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
        style={{ ...style, ...progressiveBaseStyle }}
        {...props}
      />
    );
  },
);

// Lowest visible snap point as a screen-height ratio (skips 0 / closed).
function getFirstSnapPercent(snapPoints: (number | string)[]): number {
  for (const sp of snapPoints) {
    const ratio = toRatio(sp);
    if (ratio > 0) return ratio;
  }
  return 0.3;
}

// Highest snap point as a screen-height ratio.
function getLastSnapPercent(snapPoints: (number | string)[]): number {
  let max = 0;
  for (const sp of snapPoints) {
    const ratio = toRatio(sp);
    if (ratio > max) max = ratio;
  }
  return max > 0 ? max : 1;
}

// Normalise a snap value to a 0–1 ratio of screen height.
// number → ratio as-is; string → fixed CSS px (e.g. '340px') divided by viewport.
function toRatio(value: number | string): number {
  if (typeof value === 'number') return value;
  const px = parseFloat(value);
  return Number.isNaN(px) ? 0 : px / window.innerHeight;
}
