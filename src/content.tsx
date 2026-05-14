import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';
import { useComposedRefs } from './hooks/use-composed-refs';

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

  // Prevent native touch scroll so pointer events can drive sheet drag.
  // In scrollable areas: allow scroll, but preventDefault when at top pulling down.
  // In non-scrollable areas: always preventDefault.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    let startY = 0;
    let scrollableEl: HTMLElement | null = null;

    const findScrollable = (target: EventTarget | null): HTMLElement | null => {
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

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      scrollableEl = findScrollable(e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.cancelable) return;

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
        pointerStartRef.current = { x: event.pageX, y: event.pageY };

        const target = event.target as HTMLElement;
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
