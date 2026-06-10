import { useCallback, useEffect, useMemo, useState } from 'react';
import { set } from '../utils/style-cache';
import { TRANSITIONS, VELOCITY_THRESHOLD } from '../constants';
import { useControllableState } from './use-controllable-state';
import type { SnapPoint } from '../types';

export function useSnapPoints({
  activeSnapPointProp,
  setActiveSnapPointProp,
  snapPoints,
  sheetRef,
  overlayRef,
  fadeFromIndex,
  onSnapPointChange,
  container,
  snapToSequentialPoint,
  progressiveOverlay,
}: {
  activeSnapPointProp?: SnapPoint | null;
  setActiveSnapPointProp?: (sp: SnapPoint | null) => void;
  snapPoints?: SnapPoint[];
  fadeFromIndex?: number;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  onSnapPointChange: (activeSnapPointIndex: number) => void;
  container?: HTMLElement | null;
  snapToSequentialPoint?: boolean;
  progressiveOverlay?: boolean;
}) {
  const [activeSnapPoint, setActiveSnapPoint] = useControllableState<SnapPoint | null>({
    prop: activeSnapPointProp,
    defaultProp: snapPoints?.[0],
    onChange: setActiveSnapPointProp,
  });

  const [windowDimensions, setWindowDimensions] = useState(
    typeof window !== 'undefined'
      ? { innerWidth: window.innerWidth, innerHeight: window.innerHeight }
      : undefined,
  );

  useEffect(() => {
    function onResize() {
      setWindowDimensions({ innerWidth: window.innerWidth, innerHeight: window.innerHeight });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isLastSnapPoint = useMemo(
    () => activeSnapPoint === snapPoints?.[snapPoints.length - 1] || null,
    [snapPoints, activeSnapPoint],
  );

  const activeSnapPointIndex = useMemo(
    () => snapPoints?.findIndex((sp) => sp === activeSnapPoint) ?? null,
    [snapPoints, activeSnapPoint],
  );

  const shouldFade =
    (snapPoints &&
      snapPoints.length > 0 &&
      (fadeFromIndex || fadeFromIndex === 0) &&
      !Number.isNaN(fadeFromIndex) &&
      snapPoints[fadeFromIndex] === activeSnapPoint) ||
    !snapPoints;

  const snapPointsOffset = useMemo(() => {
    const containerHeight = container
      ? container.getBoundingClientRect().height
      : typeof window !== 'undefined'
        ? window.innerHeight
        : 0;

    return (
      snapPoints?.map((sp) => {
        const isPx = typeof sp === 'string';
        const height = isPx ? parseInt(sp, 10) : windowDimensions ? (sp as number) * containerHeight : 0;
        return windowDimensions ? containerHeight - height : height;
      }) ?? []
    );
  }, [snapPoints, windowDimensions, container]);

  const activeSnapPointOffset = useMemo(
    () => (activeSnapPointIndex !== null ? snapPointsOffset?.[activeSnapPointIndex] : null),
    [snapPointsOffset, activeSnapPointIndex],
  );

  const snapToPoint = useCallback(
    (dimension: number) => {
      const newIndex = snapPointsOffset?.findIndex((d) => d === dimension) ?? null;
      onSnapPointChange(newIndex);

      set(sheetRef.current, {
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        transform: `translate3d(0, ${dimension}px, 0)`,
      });

      // In progressive mode the overlay is driven by the RAF loop in overlay.tsx
      // (it tracks the sheet's real position frame-by-frame, including during this
      // snap transition). Forcing a binary opacity 0/1 here would fight it and make
      // the overlay jump. So skip all overlay DOM writes when progressive.
      if (!progressiveOverlay) {
        if (
          snapPointsOffset &&
          newIndex !== snapPointsOffset.length - 1 &&
          fadeFromIndex !== undefined &&
          newIndex !== fadeFromIndex &&
          newIndex !== null &&
          newIndex < fadeFromIndex
        ) {
          set(overlayRef.current, {
            transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
            opacity: '0',
          });
        } else {
          set(overlayRef.current, {
            transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
            opacity: '1',
          });
        }
      }

      setActiveSnapPoint(snapPoints?.[Math.max(newIndex ?? 0, 0)]);
    },
    [
      sheetRef.current,
      snapPoints,
      snapPointsOffset,
      fadeFromIndex,
      overlayRef,
      setActiveSnapPoint,
      progressiveOverlay,
    ],
  );

  useEffect(() => {
    if (activeSnapPoint || activeSnapPointProp) {
      const newIndex =
        snapPoints?.findIndex((sp) => sp === activeSnapPointProp || sp === activeSnapPoint) ?? -1;
      if (snapPointsOffset && newIndex !== -1 && typeof snapPointsOffset[newIndex] === 'number') {
        snapToPoint(snapPointsOffset[newIndex] as number);
      }
    }
  }, [activeSnapPoint, activeSnapPointProp, snapPoints, snapPointsOffset, snapToPoint]);

  function onRelease({
    draggedDistance,
    closeDrawer,
    velocity,
    dismissible,
  }: {
    draggedDistance: number;
    closeDrawer: () => void;
    velocity: number;
    dismissible: boolean;
  }) {
    if (fadeFromIndex === undefined) return;

    const currentPosition = (activeSnapPointOffset ?? 0) - draggedDistance;
    const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
    const isFirst = activeSnapPointIndex === 0;
    const hasDraggedUp = draggedDistance > 0;

    if (isOverlaySnapPoint && !progressiveOverlay) {
      set(overlayRef.current, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }

    if (!snapToSequentialPoint && velocity > 2 && !hasDraggedUp) {
      if (dismissible) closeDrawer();
      else snapToPoint(snapPointsOffset[0]);
      return;
    }

    if (!snapToSequentialPoint && velocity > 2 && hasDraggedUp && snapPointsOffset && snapPoints) {
      snapToPoint(snapPointsOffset[snapPoints.length - 1] as number);
      return;
    }

    const closestSnapPoint = snapPointsOffset?.reduce((prev, curr) => {
      if (typeof prev !== 'number' || typeof curr !== 'number') return prev;
      return Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev;
    });

    const dim = window.innerHeight;
    if (velocity > VELOCITY_THRESHOLD && Math.abs(draggedDistance) < dim * 0.4) {
      const dragDirection = hasDraggedUp ? 1 : -1;

      if (dragDirection > 0 && isLastSnapPoint && snapPoints) {
        snapToPoint(snapPointsOffset[snapPoints.length - 1]);
        return;
      }

      if (isFirst && dragDirection < 0 && dismissible) {
        closeDrawer();
        return;
      }

      if (activeSnapPointIndex === null) return;
      snapToPoint(snapPointsOffset[activeSnapPointIndex + dragDirection]);
      return;
    }

    snapToPoint(closestSnapPoint as number);
  }

  function onDrag({ draggedDistance }: { draggedDistance: number }) {
    if (activeSnapPointOffset === null) return;
    const newValue = activeSnapPointOffset - draggedDistance;

    const maxOffset = snapPointsOffset[snapPointsOffset.length - 1];
    const minOffset = snapPointsOffset[0];

    // Don't exceed fully open (top) or first snap point (bottom)
    if (newValue < maxOffset || newValue > minOffset) return;

    set(sheetRef.current, {
      transform: `translate3d(0, ${newValue}px, 0)`,
    });
  }

  function getPercentageDragged(absDraggedDistance: number, isDraggingDown: boolean) {
    if (
      !snapPoints ||
      typeof activeSnapPointIndex !== 'number' ||
      !snapPointsOffset ||
      fadeFromIndex === undefined
    )
      return null;

    const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
    const isOverlaySnapPointOrHigher = activeSnapPointIndex >= fadeFromIndex;

    if (isOverlaySnapPointOrHigher && isDraggingDown) return 0;
    if (isOverlaySnapPoint && !isDraggingDown) return 1;
    if (!shouldFade && !isOverlaySnapPoint) return null;

    const targetIndex = isOverlaySnapPoint ? activeSnapPointIndex + 1 : activeSnapPointIndex - 1;
    const snapPointDistance = isOverlaySnapPoint
      ? snapPointsOffset[targetIndex] - snapPointsOffset[targetIndex - 1]
      : snapPointsOffset[targetIndex + 1] - snapPointsOffset[targetIndex];

    const percentageDragged = absDraggedDistance / Math.abs(snapPointDistance);
    return isOverlaySnapPoint ? 1 - percentageDragged : percentageDragged;
  }

  return {
    isLastSnapPoint,
    activeSnapPoint,
    shouldFade,
    getPercentageDragged,
    setActiveSnapPoint,
    activeSnapPointIndex,
    onRelease,
    onDrag,
    snapPointsOffset,
  };
}
