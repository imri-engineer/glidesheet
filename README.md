<p align="center">
  <img src="logo.png" alt="GlideSheet" width="200" />
</p>

<h1 align="center">GlideSheet</h1>

<p align="center">
  A performant React bottom sheet with reliable scroll-vs-drag detection.
  <br />
  Zero dependencies. ~45KB. Built with Bun.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/glidesheet"><img src="https://img.shields.io/npm/v/glidesheet.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/glidesheet"><img src="https://img.shields.io/npm/dm/glidesheet.svg" alt="npm downloads" /></a>
  <a href="https://github.com/imri-engineer/glidesheet/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/glidesheet.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/react-18%20%7C%2019-blue" alt="React 18 | 19" />
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="zero dependencies" />
</p>

---

## Why GlideSheet?

Bottom sheets on the web don't feel native. The core challenge is the **scroll-to-drag transition** — when scrollable content reaches the top and you keep pulling down, the sheet should follow your finger and slide down. Most libraries fail at this, resulting in rubber-band bouncing, jerky transitions, or the sheet ignoring the gesture entirely.

Other common pain points with existing solutions:
- **Heavy dependencies** that conflict with your UI library
- **`pointer-events: none`** leaking to the body in non-modal mode
- **`position: fixed`** hacks on the body that break iOS layouts
- **Unreliable animation callbacks** that fire too early or not at all

GlideSheet was built to solve these problems. It focuses on one direction (bottom), ships zero runtime dependencies, and makes the scroll-to-drag transition feel native.

## Features

- **Reliable scroll-to-drag** — When scrollable content hits the top, the sheet follows your finger
- **Snap points** — Fraction (0-1) or pixel values (`"185px"`)
- **Sequential snapping** — Optional `snapToSequentialPoint` for step-by-step navigation
- **Controlled & uncontrolled** — Works both ways
- **Modal & non-modal** — No `pointer-events: none` leak in non-modal mode
- **Nested sheets** — Stacking with scale effect
- **Floating mode** — Detached from edges with rounded corners
- **Focus trap** — Modal only, with focus restore on close
- **ESC to close** — Built-in keyboard support
- **iOS keyboard handling** — Via `visualViewport` API, no `position: fixed` hack
- **`onAnimationEnd`** — Fires reliably via `transitionend` (not `setTimeout`)
- **`useBottomSheet()` hook** — Access state from any child component
- **Zero dependencies** — Only React as peer dependency
- **React 18 + 19** compatible
- **~45KB ESM** bundle

## Installation

```bash
npm install glidesheet
# or
pnpm add glidesheet
# or
bun add glidesheet
```

## Quick Start

```tsx
import { BottomSheet } from 'glidesheet';
import 'glidesheet/style.css';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>

      <BottomSheet.Root open={open} onOpenChange={setOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content className="my-sheet">
            <BottomSheet.Handle />
            <BottomSheet.Title className="sr-only">My Sheet</BottomSheet.Title>
            <h2>Hello from GlideSheet</h2>
            <p>Drag me down to close.</p>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.Root>
    </>
  );
}
```

## With Snap Points

```tsx
<BottomSheet.Root
  open={open}
  onOpenChange={setOpen}
  snapPoints={[0, '200px', 0.5, 1]}
  activeSnapPoint={snap}
  onActiveSnapPointChange={setSnap}
  snapToSequentialPoint
>
  <BottomSheet.Portal>
    <BottomSheet.Content className="my-sheet">
      <BottomSheet.Handle />
      <BottomSheet.Title className="sr-only">Snap Points</BottomSheet.Title>
      {/* Your content */}
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

Snap point values:
- **Numbers 0-1** — Fraction of viewport height (`0.5` = 50%)
- **Strings** — Pixel values (`"200px"` = 200px from bottom)
- **0** — Closed position

## Scrollable Content

GlideSheet handles the scroll-to-drag transition automatically. When your content is scrollable and the user scrolls to the top, pulling down will drag the sheet instead of bouncing the scroll.

```tsx
<BottomSheet.Content className="my-sheet">
  <BottomSheet.Handle />
  <div style={{ overflowY: 'auto', flex: 1 }}>
    {/* Long scrollable content */}
    {items.map(item => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
</BottomSheet.Content>
```

To opt-out specific elements from drag:

```tsx
<div data-glidesheet-no-drag>
  This area won't trigger sheet drag
</div>
```

## Floating Mode

```tsx
<BottomSheet.Root open={open} onOpenChange={setOpen} floating>
  <BottomSheet.Portal>
    <BottomSheet.Content className="my-floating-sheet">
      <BottomSheet.Handle />
      {/* Content */}
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

Customize the floating border radius:

```css
:root {
  --glidesheet-floating-radius: 1.5rem;
}
```

## useBottomSheet Hook

Access sheet state from any child component:

```tsx
import { useBottomSheet } from 'glidesheet';

function MyComponent() {
  const {
    isOpen,
    isDragging,
    isFullyOpen,
    isMinimized,
    isClosed,
    activeSnapPoint,
    activeSnapPointIndex,
    close,
    open,
    snapTo,
  } = useBottomSheet();

  return (
    <button onClick={() => snapTo(1)}>Expand</button>
  );
}
```

## Non-Modal Mode

In non-modal mode, the page behind the sheet remains interactive. No overlay, no focus trap, no `pointer-events: none` on body.

```tsx
<BottomSheet.Root open={open} onOpenChange={setOpen} modal={false}>
  <BottomSheet.Portal>
    <BottomSheet.Content className="my-sheet">
      <BottomSheet.Handle />
      {/* Content */}
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

## Nested Sheets

```tsx
<BottomSheet.Root open={parentOpen} onOpenChange={setParentOpen}>
  <BottomSheet.Portal>
    <BottomSheet.Content>
      <BottomSheet.Handle />
      <p>Parent sheet</p>

      <BottomSheet.NestedRoot open={childOpen} onOpenChange={setChildOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Content>
            <BottomSheet.Handle />
            <p>Child sheet</p>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.NestedRoot>
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

## API Reference

### `<BottomSheet.Root>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Uncontrolled initial state |
| `onOpenChange` | `(open: boolean) => void` | — | Called when open state changes |
| `snapPoints` | `(number \| string)[]` | — | Snap point positions |
| `activeSnapPoint` | `number \| string \| null` | — | Controlled active snap point |
| `onActiveSnapPointChange` | `(snap: number \| string \| null) => void` | — | Called when snap point changes |
| `snapToSequentialPoint` | `boolean` | `false` | Only snap to adjacent points |
| `fadeFromIndex` | `number` | last snap | Index from which overlay fades |
| `modal` | `boolean` | `true` | Enable overlay, focus trap, body lock |
| `dismissible` | `boolean` | `true` | Allow close by drag/ESC/overlay click |
| `handleOnly` | `boolean` | `false` | Only allow drag from Handle |
| `floating` | `boolean` | `false` | Detached floating mode |
| `closeThreshold` | `number` | `0.25` | Fraction of height to trigger close |
| `nested` | `boolean` | `false` | Internal — set by NestedRoot |
| `noBodyStyles` | `boolean` | `false` | Skip body style modifications |
| `container` | `HTMLElement \| null` | `document.body` | Portal container |
| `onDrag` | `(event, percentageDragged) => void` | — | Called during drag |
| `onDragStart` | `() => void` | — | Called when drag starts |
| `onDragEnd` | `() => void` | — | Called when drag ends |
| `onRelease` | `(event, open) => void` | — | Called on pointer release |
| `onAnimationEnd` | `(open: boolean) => void` | — | Called after open/close animation |
| `onClose` | `() => void` | — | Called when sheet closes |

### `<BottomSheet.Content>`

Renders a `<div>` with `role="dialog"`. Accepts all HTML div props. The sheet's visual appearance (background, border-radius, shadow, size) is fully controlled by your className/style.

### `<BottomSheet.Overlay>`

Semi-transparent backdrop. Only renders in modal mode. Click to close.

### `<BottomSheet.Handle>`

Draggable handle bar with tap-to-cycle snap points. Accepts `preventCycle` prop and custom children.

### `<BottomSheet.Portal>`

Renders children into a portal. Accepts `forceMount` to keep mounted when closed. Accepts `container` to override the target.

### `<BottomSheet.Trigger>`

Button that opens the sheet. Sets `aria-haspopup="dialog"` and `aria-expanded`.

### `<BottomSheet.Close>`

Button that closes the sheet.

### `<BottomSheet.Title>`

Accessible title (`<h2>`). Linked to Content via `aria-labelledby`.

### `<BottomSheet.Description>`

Accessible description (`<p>`). Linked to Content via `aria-describedby`.

### `<BottomSheet.NestedRoot>`

Same API as Root, for nested sheets. Automatically handles parent stacking effect.

## CSS Custom Properties

```css
:root {
  --glidesheet-z-index: 50;            /* Sheet z-index */
  --glidesheet-floating-radius: 1rem;  /* Floating mode border radius */
}
```

## Data Attributes

Use these for custom styling:

| Attribute | Values | Element |
|-----------|--------|---------|
| `data-glidesheet` | — | Content |
| `data-state` | `"open"` \| `"closed"` | Content, Overlay |
| `data-snap-points` | `"true"` \| `"false"` | Content, Overlay |
| `data-floating` | `"true"` \| `"false"` | Content |
| `data-glidesheet-overlay` | — | Overlay |
| `data-glidesheet-handle` | — | Handle |
| `data-glidesheet-no-drag` | — | Any child (opt-out from drag) |

## Comparison

| | GlideSheet | Vaul | react-modal-sheet | react-spring-bottom-sheet |
|---|---|---|---|---|
| **Bundle** | ~45KB | ~77KB | ~30KB + Motion | ~25KB + react-spring |
| **Dependencies** | **0** | Radix Dialog | Motion | react-spring, react-use-gesture |
| **Scroll-to-drag** | Native feel | Inconsistent | Manual config | Manual config |
| **Snap points** | Fraction + px | Fraction + px | 0-1 range | Callback-based |
| **Non-modal** | Clean (no side effects) | `pointer-events` leak | Not built-in | `blocking={false}` |
| **Keyboard (iOS)** | `visualViewport` API | `position: fixed` hack | `avoidKeyboard` prop | — |
| **Nested sheets** | Built-in stacking | Built-in | — | — |
| **Floating mode** | Built-in | — | — | — |
| **React 18 + 19** | Yes | Yes | Yes | No (react-spring) |
| **Compound components** | Yes | Yes (Radix-style) | Yes | No (single component) |

## Development

```bash
bun install
bun test          # Run tests
bun run build     # Build for production
bun run lint      # TypeScript check
```

## License

MIT
