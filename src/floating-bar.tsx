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
  /**
   * Paint a gradient in the gap between the bar and the sheet, fading upward
   * from the sheet's colour to transparent — so content scrolling under the bar
   * dissolves instead of being cut off.
   *
   * NOTE: distinct from `fadeStartPercent`/`fadeEndPercent`, which fade the BAR
   * itself as the sheet rises.
   *
   * The colour comes from `--glidesheet-gap-fade-color` (default: `Canvas`);
   * set it to the sheet's own background:
   *   <BottomSheet.FloatingBar gapFade style={{ '--glidesheet-gap-fade-color': 'var(--surface-0-1)' }} />
   *
   * The top of the gradient never reaches full transparency — it keeps
   * `--glidesheet-gap-fade-top-opacity` (default `15%`) of the colour, so the
   * layer has no hard "nothing" edge. Raise it for a denser fade.
   */
  gapFade?: boolean;
}

export const FloatingBar = forwardRef<HTMLDivElement, FloatingBarProps>(function FloatingBar(
  {
    children,
    gap = DEFAULT_GAP,
    hideWhileDragging = false,
    fadeStartPercent = FADE_START,
    fadeEndPercent = FADE_END,
    gapFade = false,
    style,
    ...rest
  },
  ref,
) {
  const { isOpen, sheetRef } = useSheetContext();
  const [position, setPosition] = useState({ top: 0, opacity: 0, visible: false, sheetTop: 0 });
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  // Measured inside the RAF loop from this node, NOT via a state setter on the
  // ref callback: the callback only fires AFTER the first paint, so the height
  // would be 0 for one frame and the bar would flash a bar-height too low.
  const barRef = useRef<HTMLDivElement | null>(null);

  const composedRef = useCallback(
    (node: HTMLDivElement | null) => {
      barRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // RAF loop — track sheet position every frame (during drag AND transitions)
  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: 0, opacity: 0, visible: false, sheetTop: 0 });
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

      // Measured every frame: the bar's height can change with its content
      // (wrapping, a swapped toolbar), and on the first frame the node is
      // already laid out — so no 0-height flash.
      const barHeight = barRef.current?.offsetHeight ?? 0;
      const topPos = sheetTop - gap - barHeight + slideOffset;

      setPosition({
        top: topPos,
        opacity: fadeOpacity,
        visible: fadeOpacity > 0,
        sheetTop,
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
  }, [isOpen, sheetRef, gap, fadeStartPercent, fadeEndPercent]);

  if (!isOpen || !position.visible) return null;
  if (hideWhileDragging && isDraggingRef.current) return null;

  return (
    <>
      {/* Gap layer — spans from the TOP of the bar down to the sheet, so the
          gradient dissolves content behind the bar too, not just in the gap
          below it. Geometry derives from the same values as `top` above, so it
          tracks the bar frame-for-frame.
          zIndex: BELOW the bar (+1) but above the sheet, so the bar stays crisp
          on top of the fade. */}
      {gapFade && (
        <div
          data-glidesheet-floating-bar-gap=""
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            height: `${Math.max(0, position.sheetTop - position.top)}px`,
            left: 0,
            right: 0,
            zIndex: 'var(--glidesheet-z-index, 50)',
            opacity: position.opacity,
            pointerEvents: 'none',
            // Full colour at the sheet edge, fading upward. No stop on the
            // colour — `color 35%` would keep it OPAQUE up to 35% (a solid band).
            //
            // The top does NOT fall to `transparent`: it keeps
            // `--glidesheet-gap-fade-top-opacity` of tint, so the layer has no
            // hard "nothing" edge. (`transparent` = rgba(0,0,0,0), i.e. BLACK
            // transparent → fading to it greys the midpoint; color-mix stays on
            // the sheet's own hue.)
            backgroundImage:
              'linear-gradient(to top, var(--glidesheet-gap-fade-color, Canvas), color-mix(in srgb, var(--glidesheet-gap-fade-color, Canvas) var(--glidesheet-gap-fade-top-opacity, 15%), transparent))',
          }}
        />
      )}
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
    </>
  );
});
