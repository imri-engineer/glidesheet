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

  // Prevent overscroll bounce when at scroll boundaries
  // When scrollTop=0 and pulling down, preventDefault to let our drag handler take over
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    let startY = 0;
    let scrollableEl: HTMLElement | null = null;

    const findScrollableParent = (target: EventTarget | null): HTMLElement | null => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight) {
          const style = window.getComputedStyle(node);
          if (/(auto|scroll)/.test(style.overflowY)) return node;
        }
        node = node.parentElement;
      }
      return null;
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      scrollableEl = findScrollableParent(e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!scrollableEl) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      const atTop = scrollableEl.scrollTop <= 0;
      const atBottom = scrollableEl.scrollTop + scrollableEl.offsetHeight >= scrollableEl.scrollHeight;

      // Pulling down while at top → prevent scroll, let drag handle it
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

        // Don't capture pointer if touching inside a scrollable element that is not at top
        const target = event.target as HTMLElement;
        let node: HTMLElement | null = target;
        while (node && node !== sheetRef.current) {
          if (node.scrollHeight > node.clientHeight) {
            const style = window.getComputedStyle(node);
            if (/(auto|scroll)/.test(style.overflowY) && node.scrollTop > 1) {
              return;
            }
          }
          node = node.parentElement;
        }

        pointerStartRef.current = { x: event.pageX, y: event.pageY };
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
      onPointerOut={(event) => {
        rest.onPointerOut?.(event);
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
