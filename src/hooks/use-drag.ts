import { useRef, useState, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';
import { set, reset } from '../utils/style-cache';
import { getTranslateY } from '../utils/dom';
import { TRANSITIONS, VELOCITY_THRESHOLD, DRAG_CLASS } from '../constants';
import { isIOS } from '../utils/browser';
import type { SnapPoint } from '../types';

interface UseDragOptions {
  sheetRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  openTime: RefObject<Date | null>;
  isOpen: boolean;
  dismissible: boolean;
  closeThreshold: number;
  scrollLockTimeout: number;
  snapPoints: SnapPoint[] | undefined;
  activeSnapPointIndex: number | null;
  snapPointsOffset: number[];
  shouldFade: boolean;
  fadeFromIndex: number | undefined;
  onDragSnapPoints: (args: { draggedDistance: number }) => void;
  onReleaseSnapPoints: (args: {
    draggedDistance: number;
    closeDrawer: () => void;
    velocity: number;
    dismissible: boolean;
  }) => void;
  getSnapPointsPercentageDragged: (abs: number, isDraggingDown: boolean) => number | null;
  closeSheet: () => void;
  onDragProp?: (event: ReactPointerEvent, percentageDragged: number) => void;
  onReleaseProp?: (event: ReactPointerEvent, open: boolean) => void;
  onDragStartProp?: () => void;
  onDragEndProp?: () => void;
}

export function useDrag({
  sheetRef,
  overlayRef,
  openTime,
  isOpen,
  dismissible,
  closeThreshold,
  scrollLockTimeout,
  snapPoints,
  activeSnapPointIndex,
  snapPointsOffset,
  shouldFade,
  fadeFromIndex,
  onDragSnapPoints,
  onReleaseSnapPoints,
  getSnapPointsPercentageDragged,
  closeSheet,
  onDragProp,
  onReleaseProp,
  onDragStartProp,
  onDragEndProp,
}: UseDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const dragStartTime = useRef<Date | null>(null);
  const lastTimeDragPrevented = useRef<Date | null>(null);
  const isAllowedToDrag = useRef(false);
  const pointerStart = useRef(0);
  const justReleased = useRef(false);
  const drawerHeightRef = useRef(0);

  function shouldDrag(el: EventTarget, isDraggingInDirection: boolean) {
    let element = el as HTMLElement;
    const highlightedText = window.getSelection()?.toString();
    const swipeAmount = sheetRef.current ? getTranslateY(sheetRef.current) : null;
    const date = new Date();

    if (element.tagName === 'SELECT') return false;
    if (element.hasAttribute('data-glidesheet-no-drag') || element.closest('[data-glidesheet-no-drag]'))
      return false;
    if (openTime.current && date.getTime() - openTime.current.getTime() < 500) return false;
    if (swipeAmount !== null && swipeAmount > 0) return true;
    if (highlightedText && highlightedText.length > 0) return false;

    if (
      lastTimeDragPrevented.current &&
      date.getTime() - lastTimeDragPrevented.current.getTime() < scrollLockTimeout &&
      swipeAmount === 0
    ) {
      lastTimeDragPrevented.current = date;
      return false;
    }

    let isAtTopOfScroll = true;
    let tempElement = element;
    while (tempElement) {
      if (tempElement.scrollHeight > tempElement.clientHeight && tempElement.scrollTop > 1) {
        isAtTopOfScroll = false;
        break;
      }
      if (tempElement.getAttribute('role') === 'dialog') break;
      tempElement = tempElement.parentNode as HTMLElement;
    }

    if (isDraggingInDirection && !isAtTopOfScroll) {
      lastTimeDragPrevented.current = date;
      return false;
    }

    while (element) {
      if (element.scrollHeight > element.clientHeight) {
        if (element.scrollTop > 1) {
          lastTimeDragPrevented.current = new Date();
          return false;
        }
        if (element.getAttribute('role') === 'dialog') return true;
      }
      element = element.parentNode as HTMLElement;
    }

    return true;
  }

  function onPress(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dismissible && !snapPoints) return;
    if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) return;

    drawerHeightRef.current = sheetRef.current?.getBoundingClientRect().height || 0;
    setIsDragging(true);
    onDragStartProp?.();
    dragStartTime.current = new Date();

    if (isIOS()) {
      window.addEventListener('touchend', () => (isAllowedToDrag.current = false), { once: true });
    }
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    pointerStart.current = event.pageY;
  }

  function onDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!sheetRef.current || !isDragging) return;

    const draggedDistance = (pointerStart.current - event.pageY) * 1;
    const isDraggingInDirection = draggedDistance > 0;
    const noCloseSnapPointsPreCondition = snapPoints && !dismissible && !isDraggingInDirection;

    if (noCloseSnapPointsPreCondition && activeSnapPointIndex === 0) return;

    const absDraggedDistance = Math.abs(draggedDistance);
    let percentageDragged = absDraggedDistance / drawerHeightRef.current;
    const snapPointPercentageDragged = getSnapPointsPercentageDragged(
      absDraggedDistance,
      isDraggingInDirection,
    );

    if (snapPointPercentageDragged !== null) percentageDragged = snapPointPercentageDragged;
    if (noCloseSnapPointsPreCondition && percentageDragged >= 1) return;
    if (!isAllowedToDrag.current && !shouldDrag(event.target, isDraggingInDirection)) return;

    sheetRef.current.classList.add(DRAG_CLASS);
    isAllowedToDrag.current = true;
    set(sheetRef.current, { transition: 'none' });
    set(overlayRef.current, { transition: 'none' });

    if (snapPoints) {
      onDragSnapPoints({ draggedDistance });
    }

    // Update drag progress (0 = closed, 1 = fully open)
    const sheetTop = sheetRef.current.getBoundingClientRect().top;
    const viewportHeight = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (viewportHeight - sheetTop) / viewportHeight));
    setDragProgress(progress);

    if (isDraggingInDirection && !snapPoints) return;

    const opacityValue = 1 - percentageDragged;
    if (shouldFade || (fadeFromIndex && activeSnapPointIndex === fadeFromIndex - 1)) {
      onDragProp?.(event, percentageDragged);
      set(overlayRef.current, { opacity: `${opacityValue}`, transition: 'none' }, true);
    }

    if (!snapPoints) {
      set(sheetRef.current, { transform: `translate3d(0, ${absDraggedDistance}px, 0)` });
    }
  }

  function resetDrawer() {
    if (!sheetRef.current) return;
    set(sheetRef.current, {
      transform: 'translate3d(0, 0, 0)',
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
    });
    set(overlayRef.current, {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      opacity: '1',
    });
  }

  function cancelDrag() {
    if (!isDragging || !sheetRef.current) return;
    sheetRef.current.classList.remove(DRAG_CLASS);
    isAllowedToDrag.current = false;
    setIsDragging(false);
    onDragEndProp?.();
  }

  function onRelease(event: ReactPointerEvent<HTMLDivElement> | null) {
    if (!isDragging || !sheetRef.current) return;

    sheetRef.current.classList.remove(DRAG_CLASS);
    isAllowedToDrag.current = false;
    setIsDragging(false);
    onDragEndProp?.();

    const swipeAmount = getTranslateY(sheetRef.current);
    if (swipeAmount === null || Number.isNaN(swipeAmount)) {
      resetDrawer();
      return;
    }
    if (!event || dragStartTime.current === null) {
      resetDrawer();
      return;
    }

    const timeTaken = Date.now() - dragStartTime.current.getTime();
    const distMoved = pointerStart.current - event.pageY;
    const velocity = Math.abs(distMoved) / timeTaken;

    if (velocity > 0.05) {
      justReleased.current = true;
      setTimeout(() => {
        justReleased.current = false;
      }, 200);
    }

    if (snapPoints) {
      onReleaseSnapPoints({
        draggedDistance: distMoved,
        closeDrawer: closeSheet,
        velocity,
        dismissible,
      });
      onReleaseProp?.(event, true);
      return;
    }

    if (distMoved > 0) {
      resetDrawer();
      onReleaseProp?.(event, true);
      return;
    }

    if (velocity > VELOCITY_THRESHOLD) {
      closeSheet();
      onReleaseProp?.(event, false);
      return;
    }

    const visibleHeight = Math.min(
      sheetRef.current.getBoundingClientRect().height ?? 0,
      window.innerHeight,
    );
    if (Math.abs(swipeAmount) >= visibleHeight * closeThreshold) {
      closeSheet();
      onReleaseProp?.(event, false);
      return;
    }

    onReleaseProp?.(event, true);
    resetDrawer();
  }

  return {
    isDragging,
    dragProgress,
    onPress,
    onDrag,
    onRelease,
    cancelDrag,
  };
}
