import { useCallback, useEffect, useRef, useState } from 'react';
import { SheetContext } from './context';
import { useControllableState } from './hooks/use-controllable-state';
import { useSnapPoints } from './hooks/use-snap-points';
import { useBodyLock } from './hooks/use-body-lock';
import { useFocusTrap } from './hooks/use-focus-trap';
import { useDrag } from './hooks/use-drag';
import { useKeyboard } from './hooks/use-keyboard';
import { useNested } from './hooks/use-nested';
import { set, reset } from './utils/style-cache';
import { TRANSITIONS, CLOSE_THRESHOLD, SCROLL_LOCK_TIMEOUT } from './constants';
import type { BottomSheetRootProps } from './types';

export function Root({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
  onDrag: onDragProp,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
  onRelease: onReleaseProp,
  snapPoints,
  closeThreshold = CLOSE_THRESHOLD,
  scrollLockTimeout = SCROLL_LOCK_TIMEOUT,
  dismissible = true,
  handleOnly = false,
  fadeFromIndex = snapPoints && snapPoints.length - 1,
  activeSnapPoint: activeSnapPointProp,
  onActiveSnapPointChange: setActiveSnapPointProp,
  modal = true,
  onClose,
  nested = false,
  noBodyStyles = false,
  snapToSequentialPoint = false,
  repositionInputs = true,
  floating = false,
  progressiveOverlay = false,
  progressiveOverlayMaxOpacity = 0.35,
  onAnimationEnd,
  container = null,
}: BottomSheetRootProps) {
  const [isOpen = false, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    prop: openProp,
    onChange: (o: boolean) => {
      onOpenChange?.(o);
      if (o && !modal && typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          document.body.style.pointerEvents = 'auto';
        });
      }
      if (!o) {
        document.body.style.pointerEvents = 'auto';
      }
    },
  });

  const [titleId, setTitleId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openTime = useRef<Date | null>(null);
  const keyboardIsOpen = useRef(false);
  const shouldAnimate = useRef(!defaultOpen);
  const hasBeenOpened = useRef(false);

  // ── Snap points ──
  const onSnapPointChange = useCallback(
    (activeSnapPointIndex: number) => {
      if (snapPoints && activeSnapPointIndex === snapPointsOffset.length - 1) {
        openTime.current = new Date();
      }
    },
    [],
  );

  const {
    activeSnapPoint,
    activeSnapPointIndex,
    setActiveSnapPoint,
    onRelease: onReleaseSnapPoints,
    snapPointsOffset,
    onDrag: onDragSnapPoints,
    shouldFade,
    getPercentageDragged: getSnapPointsPercentageDragged,
    isLastSnapPoint,
  } = useSnapPoints({
    snapPoints,
    activeSnapPointProp,
    setActiveSnapPointProp,
    sheetRef,
    fadeFromIndex,
    overlayRef,
    onSnapPointChange,
    container,
    snapToSequentialPoint,
  });

  // ── Close/Open ──
  function closeSheet() {
    drag.cancelDrag();
    // Clear all inline styles so CSS data-state="closed" takes over
    if (sheetRef.current) {
      reset(sheetRef.current);
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`;
    }
    if (overlayRef.current && !progressiveOverlay) {
      reset(overlayRef.current);
      overlayRef.current.style.opacity = '';
      overlayRef.current.style.transition = '';
    }
    onClose?.();
    setIsOpen(false);
    // Only reset snap if uncontrolled — controlled consumers manage their own snap state
    if (activeSnapPointProp === undefined) {
      setTimeout(() => {
        if (snapPoints) setActiveSnapPoint(snapPoints[0]);
      }, TRANSITIONS.DURATION * 1000);
    }
  }

  function openSheet() {
    if (!isOpen) {
      // Clear any leftover inline styles from previous drag/close
      if (sheetRef.current) {
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
      }
      hasBeenOpened.current = true;
      setIsOpen(true);
    }
  }

  // ── Drag ──
  const drag = useDrag({
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
  });

  // ── Body lock + Focus ──
  useBodyLock({ isOpen, modal, noBodyStyles });
  useFocusTrap({ isOpen, modal, sheetRef });

  // ── Keyboard ──
  useKeyboard({
    sheetRef,
    isOpen,
    repositionInputs,
    snapPoints,
    snapPointsOffset,
    activeSnapPointIndex,
    keyboardIsOpen,
  });

  // ── Nested ──
  const nested_ = useNested({ sheetRef });

  // ── ESC to close ──
  useEffect(() => {
    if (!isOpen || !dismissible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dismissible]);

  // ── onAnimationEnd via transitionend ──
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !onAnimationEnd) return;
    const handler = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'transform') return;
      onAnimationEnd(isOpen);
    };
    el.addEventListener('transitionend', handler);
    return () => el.removeEventListener('transitionend', handler);
  }, [isOpen, onAnimationEnd]);

  // ── Animate + open state ──
  useEffect(() => {
    window.requestAnimationFrame(() => {
      shouldAnimate.current = true;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    openTime.current = new Date();
    hasBeenOpened.current = true;
    if (!modal) {
      window.requestAnimationFrame(() => {
        document.body.style.pointerEvents = 'auto';
      });
    }
  }, [isOpen, modal]);

  return (
    <SheetContext.Provider
      value={{
        sheetRef,
        overlayRef,
        isOpen,
        isDragging: drag.isDragging,
        modal,
        dismissible,
        handleOnly,
        nested,
        snapPoints,
        activeSnapPoint,
        activeSnapPointIndex,
        snapPointsOffset,
        shouldFade,
        shouldAnimate,
        keyboardIsOpen,
        container,
        hasBeenOpened: hasBeenOpened.current,
        isLastSnapPoint,
        closeThreshold,
        scrollLockTimeout,
        fadeFromIndex,
        onPress: drag.onPress,
        onDrag: drag.onDrag,
        onRelease: drag.onRelease,
        closeSheet,
        openSheet,
        setActiveSnapPoint,
        onNestedDrag: nested_.onNestedDrag,
        onNestedOpenChange: nested_.onNestedOpenChange,
        onNestedRelease: nested_.onNestedRelease,
        titleId,
        descriptionId,
        setTitleId,
        setDescriptionId,
        repositionInputs,
        floating,
        progressiveOverlay,
        progressiveOverlayMaxOpacity,
        dragProgress: drag.dragProgress,
      }}
    >
      {children}
    </SheetContext.Provider>
  );
}
