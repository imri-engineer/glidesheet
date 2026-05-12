import { Root } from './bottom-sheet';
import { NestedRoot } from './nested-root';
import { Content } from './content';
import { Overlay } from './overlay';
import { Handle } from './handle';
import { Portal } from './portal';
import { Trigger } from './trigger';
import { Close } from './close';
import { Title } from './title';
import { Description } from './description';
import { FloatingBar } from './floating-bar';
import { Footer } from './footer';

export const BottomSheet = {
  Root,
  NestedRoot,
  Content,
  Overlay,
  Handle,
  Portal,
  Trigger,
  Close,
  Title,
  Description,
  FloatingBar,
  Footer,
};

export { useBottomSheet } from './hooks/use-bottom-sheet';
export type { UseBottomSheetReturn } from './hooks/use-bottom-sheet';
export type { BottomSheetRootProps, SnapPoint } from './types';
