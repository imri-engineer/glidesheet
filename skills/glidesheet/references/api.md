# GlideSheet API Reference

## Exports

```tsx
import { BottomSheet, useBottomSheet } from 'glidesheet';
import type { BottomSheetRootProps, SnapPoint, UseBottomSheetReturn } from 'glidesheet';
```

## Types

```typescript
type SnapPoint = number | string;
```

## BottomSheet.Root

State management container. No DOM output.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Uncontrolled initial state |
| `onOpenChange` | `(open: boolean) => void` | — | Called when open state changes |
| `snapPoints` | `SnapPoint[]` | — | Snap positions: fractions 0-1 or pixel strings (`"200px"`) |
| `activeSnapPoint` | `SnapPoint \| null` | — | Controlled active snap point |
| `onActiveSnapPointChange` | `(snap: SnapPoint \| null) => void` | — | Called when snap point changes |
| `snapToSequentialPoint` | `boolean` | `false` | Only snap to adjacent points |
| `fadeFromIndex` | `number` | last index | Snap index where overlay starts fading in |
| `modal` | `boolean` | `true` | Enable overlay, focus trap, body lock |
| `dismissible` | `boolean` | `true` | Allow close by drag, ESC, or overlay click |
| `handleOnly` | `boolean` | `false` | Restrict drag to Handle only |
| `floating` | `boolean` | `false` | Floating mode (detached from edges) |
| `closeThreshold` | `number` | `0.25` | Drag fraction of height to trigger close |
| `scrollLockTimeout` | `number` | `50` | Scroll lock timeout in ms |
| `noBodyStyles` | `boolean` | `false` | Skip body style modifications |
| `container` | `HTMLElement \| null` | `document.body` | Portal target |
| `repositionInputs` | `boolean` | `true` | Reposition inputs on iOS keyboard open |
| `progressiveOverlay` | `boolean` | `false` | Overlay opacity follows drag progress |
| `progressiveOverlayMaxOpacity` | `number` | `0.35` | Max opacity in progressive mode |
| `onDrag` | `(event: PointerEvent, percentageDragged: number) => void` | — | Called during drag |
| `onDragStart` | `() => void` | — | Called when drag starts |
| `onDragEnd` | `() => void` | — | Called when drag ends |
| `onRelease` | `(event: PointerEvent, open: boolean) => void` | — | Called on pointer release |
| `onAnimationEnd` | `(open: boolean) => void` | — | Called after animation completes (via transitionend) |
| `onClose` | `() => void` | — | Called when sheet closes |

## BottomSheet.NestedRoot

Same props as `Root`. Use for nested sheets inside a parent sheet's `Content`. Automatically handles stacking scale effect.

## BottomSheet.Content

Renders `<div role="dialog">`. Accepts all `HTMLAttributes<HTMLDivElement>`.

Data attributes set automatically:
- `data-glidesheet` — always present
- `data-state="open" | "closed"`
- `data-snap-points="true" | "false"`
- `data-floating="true" | "false"`
- `data-animate="true" | "false"`

## BottomSheet.Overlay

Renders `<div>` with semi-transparent backdrop. Only renders in modal mode. Click closes the sheet.

Data attributes:
- `data-glidesheet-overlay`
- `data-state="open" | "closed"`
- `data-snap-points="true" | "false"`
- `data-progressive="true"` (when progressive overlay is enabled)

## BottomSheet.Handle

Renders `<div>` with a pill-shaped drag indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `preventCycle` | `boolean` | `false` | Disable tap-to-cycle snap points |
| `children` | `ReactNode` | pill indicator | Custom handle content |

Data attribute: `data-glidesheet-handle`

## BottomSheet.Portal

Renders children into a React portal.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `container` | `HTMLElement \| null` | Root's container | Override portal target |
| `forceMount` | `boolean` | `false` | Keep mounted when sheet is closed |

## BottomSheet.Trigger

Renders `<button>`. Opens the sheet on click. Sets `aria-haspopup="dialog"` and `aria-expanded`.

## BottomSheet.Close

Renders `<button>`. Closes the sheet on click.

## BottomSheet.Title

Renders `<h2>`. Linked to Content via `aria-labelledby`. Required for accessibility.

## BottomSheet.Description

Renders `<p>`. Linked to Content via `aria-describedby`.

## BottomSheet.Footer

Renders `<div>`. Non-scrollable area pinned at the bottom of the sheet. Data attribute: `data-glidesheet-footer`.

## BottomSheet.FloatingBar

Renders `<div>` that floats above the sheet and fades as the sheet expands.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Bar content (required) |
| `gap` | `number` | `16` | Distance in px between bar bottom and sheet top |
| `hideWhileDragging` | `boolean` | `false` | Hide bar during active drag |
| `fadeStartPercent` | `number` | `50` | Sheet height % where fade begins |
| `fadeEndPercent` | `number` | `65` | Sheet height % where bar is fully hidden |

Data attribute: `data-glidesheet-floating-bar`. Place as sibling of `Content` inside `Portal`.

## useBottomSheet()

Hook to access sheet state from any descendant of `Root`.

```typescript
interface UseBottomSheetReturn {
  isOpen: boolean;
  isDragging: boolean;
  isFullyOpen: boolean;
  isMinimized: boolean;
  isClosed: boolean;
  activeSnapPoint: SnapPoint | null | undefined;
  activeSnapPointIndex: number | null;
  snapPoints: SnapPoint[] | undefined;
  modal: boolean;
  floating: boolean;
  close: () => void;
  open: () => void;
  snapTo: (snapPoint: SnapPoint) => void;
}
```

- `isFullyOpen` — `true` when at the last (highest) snap point.
- `isMinimized` — `true` when at the first (lowest) snap point. Always `false` without snap points.
- `snapTo(point)` — Navigate to a specific snap point value (must exist in `snapPoints` array).

## CSS Custom Properties

```css
--glidesheet-z-index: 50;
--glidesheet-floating-radius: 1rem;
--glidesheet-floating-offset: 0.625rem;
--glidesheet-handle-radius: 1.5rem;
--glidesheet-handle-bg: inherit;
--glidesheet-handle-pill-bg: rgba(0, 0, 0, 0.25);
```

## Data Attributes (for styling)

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `data-glidesheet` | Content | Target the sheet |
| `data-state` | Content, Overlay | `"open"` or `"closed"` |
| `data-snap-points` | Content, Overlay | `"true"` or `"false"` |
| `data-floating` | Content | `"true"` or `"false"` |
| `data-glidesheet-overlay` | Overlay | Target the overlay |
| `data-glidesheet-handle` | Handle | Target the handle |
| `data-glidesheet-footer` | Footer | Target the footer |
| `data-glidesheet-floating-bar` | FloatingBar | Target the floating bar |
| `data-glidesheet-no-drag` | Any element | Opt out of sheet drag |
