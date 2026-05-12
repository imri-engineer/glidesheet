import type { RefObject, ReactNode, PointerEvent as ReactPointerEvent } from 'react';

export type SnapPoint = number | string;

export interface BottomSheetRootProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  snapPoints?: SnapPoint[];
  activeSnapPoint?: SnapPoint | null;
  onActiveSnapPointChange?: (snapPoint: SnapPoint | null) => void;
  fadeFromIndex?: number;
  snapToSequentialPoint?: boolean;
  closeThreshold?: number;
  modal?: boolean;
  dismissible?: boolean;
  handleOnly?: boolean;
  nested?: boolean;
  scrollLockTimeout?: number;
  noBodyStyles?: boolean;
  container?: HTMLElement | null;
  onDrag?: (event: ReactPointerEvent, percentageDragged: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onRelease?: (event: ReactPointerEvent, open: boolean) => void;
  onAnimationEnd?: (open: boolean) => void;
  onClose?: () => void;
  repositionInputs?: boolean;
  floating?: boolean;
  progressiveOverlay?: boolean;
  progressiveOverlayMaxOpacity?: number;
}

export interface SheetContextValue {
  sheetRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  isDragging: boolean;
  modal: boolean;
  dismissible: boolean;
  handleOnly: boolean;
  nested: boolean;
  snapPoints: SnapPoint[] | undefined;
  activeSnapPoint: SnapPoint | null | undefined;
  activeSnapPointIndex: number | null;
  snapPointsOffset: number[];
  shouldFade: boolean;
  shouldAnimate: RefObject<boolean>;
  keyboardIsOpen: RefObject<boolean>;
  container: HTMLElement | null | undefined;
  hasBeenOpened: boolean;
  isLastSnapPoint: boolean | null;
  closeThreshold: number;
  scrollLockTimeout: number;
  fadeFromIndex: number | undefined;
  onPress: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDrag: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onRelease: (event: ReactPointerEvent<HTMLDivElement> | null) => void;
  closeSheet: () => void;
  openSheet: () => void;
  setActiveSnapPoint: (sp: SnapPoint | null) => void;
  onNestedDrag: (event: ReactPointerEvent, percentageDragged: number) => void;
  onNestedOpenChange: (open: boolean) => void;
  onNestedRelease: (event: ReactPointerEvent, open: boolean) => void;
  titleId: string;
  descriptionId: string;
  setTitleId: (id: string) => void;
  setDescriptionId: (id: string) => void;
  repositionInputs: boolean;
  floating: boolean;
  progressiveOverlay: boolean;
  progressiveOverlayMaxOpacity: number;
  dragProgress: number;
}
