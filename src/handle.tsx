import { forwardRef, useRef, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';

const LONG_PRESS_TIMEOUT = 250;
const DOUBLE_TAP_TIMEOUT = 120;

export type HandleProps = HTMLAttributes<HTMLDivElement> & {
  preventCycle?: boolean;
};

export const Handle = forwardRef<HTMLDivElement, HandleProps>(function Handle(
  { preventCycle = false, children, ...rest },
  ref,
) {
  const {
    closeSheet,
    isDragging,
    snapPoints,
    activeSnapPoint,
    setActiveSnapPoint,
    dismissible,
    handleOnly,
    isOpen,
    onPress,
    onDrag,
  } = useSheetContext();

  const closeTimeoutIdRef = useRef<number | null>(null);
  const shouldCancelRef = useRef(false);

  function handleStartCycle() {
    if (shouldCancelRef.current) {
      handleCancelInteraction();
      return;
    }
    window.setTimeout(() => handleCycleSnapPoints(), DOUBLE_TAP_TIMEOUT);
  }

  function handleCycleSnapPoints() {
    if (isDragging || preventCycle || shouldCancelRef.current) {
      handleCancelInteraction();
      return;
    }
    handleCancelInteraction();

    if (!snapPoints || snapPoints.length === 0) {
      if (dismissible) closeSheet();
      return;
    }

    const isLast = activeSnapPoint === snapPoints[snapPoints.length - 1];
    if (isLast && dismissible) {
      closeSheet();
      return;
    }

    const currentIndex = snapPoints.findIndex((p) => p === activeSnapPoint);
    if (currentIndex === -1) return;
    setActiveSnapPoint(snapPoints[currentIndex + 1]);
  }

  function handleStartInteraction() {
    closeTimeoutIdRef.current = window.setTimeout(() => {
      shouldCancelRef.current = true;
    }, LONG_PRESS_TIMEOUT);
  }

  function handleCancelInteraction() {
    if (closeTimeoutIdRef.current) window.clearTimeout(closeTimeoutIdRef.current);
    shouldCancelRef.current = false;
  }

  return (
    <div
      onClick={handleStartCycle}
      onPointerCancel={handleCancelInteraction}
      onPointerDown={(e) => {
        if (handleOnly) onPress(e);
        handleStartInteraction();
      }}
      onPointerMove={(e) => {
        if (handleOnly) onDrag(e);
      }}
      ref={ref}
      data-glidesheet-handle=""
      data-glidesheet-drag=""
      data-visible={isOpen ? 'true' : 'false'}
      aria-hidden="true"
      {...rest}
    >
      <span data-glidesheet-handle-hitarea="" aria-hidden="true">
        {children}
      </span>
    </div>
  );
});
