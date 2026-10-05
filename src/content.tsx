import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';
import { useComposedRefs } from './hooks/use-composed-refs';
import { isInDragZone } from './utils/dom';

// In a `[data-glidesheet-no-drag]` area, a swipe whose angle (from the X axis)
// is ≤ this stays in the area (e.g. a horizontal carousel); steeper → the sheet
// drags. Customisable per element via `--glidesheet-no-drag-h-angle` (degrees).
const DEFAULT_NO_DRAG_H_ANGLE = 65;

function noDragHAngle(el: HTMLElement | null): number {
  if (!el) return DEFAULT_NO_DRAG_H_ANGLE;
  const raw = getComputedStyle(el).getPropertyValue('--glidesheet-no-drag-h-angle').trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : DEFAULT_NO_DRAG_H_ANGLE;
}

export const Content = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Content(
  { style, children, ...rest },
  ref,
) {
  const {
    sheetRef,
    onPress,
    onRelease,
    onDrag,
    snapPointsOffset,
    activeSnapPointIndex,
    modal,
    isOpen,
    snapPoints,
    container,
    handleOnly,
    shouldAnimate,
    titleId,
    descriptionId,
    floating,
  } = useSheetContext();

  const [delayedSnapPoints, setDelayedSnapPoints] = useState(false);
  const composedRef = useComposedRefs(ref, sheetRef);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastKnownPointerEventRef = useRef<React.PointerEvent<HTMLDivElement> | null>(null);
  const wasBeyondThePointRef = useRef(false);
  // In a no-drag area, the gesture is arbitrated by direction: horizontal keeps
  // the area (carousel), vertical hands the drag to the sheet. Locked per gesture.
  const noDragAxisRef = useRef<'undecided' | 'horizontal' | 'vertical' | null>(null);
  const hasSnapPoints = snapPoints && snapPoints.length > 0;

  const isDeltaInDirection = (delta: { x: number; y: number }, threshold = 0) => {
    if (wasBeyondThePointRef.current) return true;

    const deltaY = Math.abs(delta.y);
    const deltaX = Math.abs(delta.x);
    const isDeltaX = deltaX > deltaY;
    const isReverseDirection = delta.y < 0;

    if (!isReverseDirection && deltaY >= 0 && deltaY <= threshold) {
      return !isDeltaX;
    }

    wasBeyondThePointRef.current = true;
    return true;
  };

  useEffect(() => {
    if (!hasSnapPoints) return;
    setDelayedSnapPoints(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDelayedSnapPoints(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [hasSnapPoints]);

  // The sheet itself is never a scroller. Engines without `overflow: clip`
  // (WebKit < 16) still treat the `hidden` box as scrollable and scroll it on
  // input focus to reveal the field above the keyboard — undo that.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop !== 0) el.scrollTop = 0;
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [sheetRef]);

  // Prevent native touch scroll so pointer events can drive sheet drag.
  // In vertically scrollable areas: allow scroll, but preventDefault when at top pulling down.
  // In horizontally scrollable areas (and no-drag areas): never preventDefault — the sheet
  // does not drag there, so the native scroll must be left alone.
  // In non-scrollable areas: always preventDefault.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    let startY = 0;
    let scrollableEl: HTMLElement | null = null;
    let isFreeScroll = false;

    const findVerticalScrollable = (target: EventTarget | null): HTMLElement | null => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight) {
          const cs = window.getComputedStyle(node);
          if (/(auto|scroll)/.test(cs.overflowY)) return node;
        }
        node = node.parentElement;
      }
      return null;
    };

    const findHorizontalScrollable = (target: EventTarget | null): HTMLElement | null => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        if (node.scrollWidth > node.clientWidth) {
          const cs = window.getComputedStyle(node);
          if (/(auto|scroll)/.test(cs.overflowX)) return node;
        }
        node = node.parentElement;
      }
      return null;
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      const target = e.target as HTMLElement | null;
      // A drag zone owns the gesture: no native scroll behind it.
      scrollableEl = isInDragZone(target) ? null : findVerticalScrollable(e.target);
      // A no-drag area owns its gesture unconditionally — even nested inside a
      // vertical scroller — so the browser must never cancel its touchmove (that
      // was swallowing the first pixels of a carousel swipe). A horizontal
      // scroller is free too, but only when no vertical scroller sits above it.
      isFreeScroll =
        (!isInDragZone(target) && !!target?.closest?.('[data-glidesheet-no-drag]')) ||
        (!scrollableEl && !!findHorizontalScrollable(target));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.cancelable) return;
      if (isFreeScroll) return;

      if (!scrollableEl) {
        e.preventDefault();
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      const atTop = scrollableEl.scrollTop <= 0;

      if (atTop && deltaY > 0) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [sheetRef]);

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement> | null) {
    pointerStartRef.current = null;
    wasBeyondThePointRef.current = false;
    noDragAxisRef.current = null;
    onRelease(event);
  }

  const computedStyle: CSSProperties =
    snapPointsOffset && snapPointsOffset.length > 0
      ? ({
          '--snap-point-height': `${snapPointsOffset[activeSnapPointIndex ?? 0]!}px`,
          ...style,
        } as CSSProperties)
      : (style ?? {});

  return (
    <div
      {...rest}
      ref={composedRef}
      role="dialog"
      aria-modal={modal}
      aria-labelledby={titleId || undefined}
      aria-describedby={descriptionId || undefined}
      data-glidesheet=""
      data-state={isOpen ? 'open' : 'closed'}
      data-delayed-snap-points={delayedSnapPoints ? 'true' : 'false'}
      data-snap-points={hasSnapPoints ? 'true' : 'false'}
      data-custom-container={container ? 'true' : 'false'}
      data-animate={shouldAnimate?.current ? 'true' : 'false'}
      data-floating={floating ? 'true' : 'false'}
      style={computedStyle}
      onPointerDown={(event) => {
        if (handleOnly) return;
        rest.onPointerDown?.(event);

        const target = event.target as HTMLElement;

        pointerStartRef.current = { x: event.pageX, y: event.pageY };

        // In a no-drag area (e.g. a horizontal carousel), DON'T press yet: pressing
        // captures the pointer, which starves the carousel of its own events. We
        // arbitrate by direction in onPointerMove and only press (retroactively)
        // if the swipe turns out vertical. A horizontal swipe never touches the sheet.
        if (isInDragZone(target)) {
          noDragAxisRef.current = null;
          onPress(event);
          return;
        }
        if (target.closest('[data-glidesheet-no-drag]')) {
          noDragAxisRef.current = 'undecided';
          return;
        }
        noDragAxisRef.current = null;

        let node: HTMLElement | null = target;
        while (node && node !== sheetRef.current) {
          if (node.scrollHeight > node.clientHeight) {
            const cs = window.getComputedStyle(node);
            if (/(auto|scroll)/.test(cs.overflowY) && node.scrollTop > 0) {
              return;
            }
          }
          node = node.parentElement;
        }

        onPress(event);
      }}
      onPointerMove={(event) => {
        lastKnownPointerEventRef.current = event;
        if (handleOnly) return;
        rest.onPointerMove?.(event);
        if (!pointerStartRef.current) return;

        const yPosition = event.pageY - pointerStartRef.current.y;
        const xPosition = event.pageX - pointerStartRef.current.x;
        const swipeStartThreshold = event.pointerType === 'touch' ? 10 : 2;
        const delta = { x: xPosition, y: yPosition };

        // No-drag area: not pressed yet. Arbitrate by direction once the gesture
        // clears the threshold. Horizontal → the carousel keeps it (the sheet was
        // never pressed, so it can't move). Vertical → press NOW to hand the drag
        // to the sheet, then fall through to the normal drag path.
        if (noDragAxisRef.current !== null) {
          if (noDragAxisRef.current === 'undecided') {
            const adx = Math.abs(xPosition);
            const ady = Math.abs(yPosition);
            if (Math.max(adx, ady) < swipeStartThreshold) return;
            const angle = (Math.atan2(ady, adx) * 180) / Math.PI; // 0 = horizontal
            const horizontal = angle <= noDragHAngle(event.currentTarget as HTMLElement);
            noDragAxisRef.current = horizontal ? 'horizontal' : 'vertical';
            if (!horizontal) {
              // Retroactive press: start the sheet drag from here.
              onPress(event);
            }
          }
          if (noDragAxisRef.current === 'horizontal') return; // carousel keeps the gesture
        }

        const isAllowedToSwipe = isDeltaInDirection(delta, swipeStartThreshold);
        if (isAllowedToSwipe) {
          onDrag(event);
        } else if (Math.abs(xPosition) > swipeStartThreshold || Math.abs(yPosition) > swipeStartThreshold) {
          pointerStartRef.current = null;
        }
      }}
      onPointerUp={(event) => {
        rest.onPointerUp?.(event);
        handlePointerUp(event);
      }}
      onPointerLeave={(event) => {
        rest.onPointerLeave?.(event);
        handlePointerUp(lastKnownPointerEventRef.current);
      }}
      onPointerCancel={(event) => {
        // Un flick rapide peut finir en pointercancel (jamais de pointerup) :
        // sans release, isDragging reste bloqué et l'overlay progressif fige.
        rest.onPointerCancel?.(event);
        handlePointerUp(lastKnownPointerEventRef.current ?? event);
      }}
      onContextMenu={(event) => {
        rest.onContextMenu?.(event);
        if (lastKnownPointerEventRef.current) handlePointerUp(lastKnownPointerEventRef.current);
      }}
    >
      {children}
      {!floating && <div data-glidesheet-extension="" aria-hidden="true" />}
    </div>
  );
});
