---
name: glidesheet
description: >
  Build performant bottom sheets with GlideSheet — a zero-dependency React
  compound component library with native scroll-to-drag, snap points, nested
  sheets, floating mode, and full accessibility. Use this skill when writing,
  debugging, or composing bottom sheet UI with GlideSheet.
license: MIT
metadata:
  author: imri-engineer
  version: "0.3"
---

# GlideSheet

GlideSheet is a React bottom sheet library (~9KB gzipped, zero runtime dependencies) that solves the scroll-to-drag transition — when scrollable content reaches the top, pulling down drags the sheet instead of bouncing.

## Installation

```bash
npm install glidesheet
```

Always import both the component and the stylesheet:

```tsx
import { BottomSheet } from 'glidesheet';
import 'glidesheet/style.css';
```

## Component Structure

GlideSheet uses the compound component pattern. The minimal setup is:

```tsx
<BottomSheet.Root open={open} onOpenChange={setOpen}>
  <BottomSheet.Portal>
    <BottomSheet.Overlay />
    <BottomSheet.Content>
      <BottomSheet.Handle />
      <BottomSheet.Title className="sr-only">Sheet Title</BottomSheet.Title>
      {children}
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

### Required structure rules

- `Root` wraps everything and manages state.
- `Portal` must wrap `Overlay` and `Content`. It renders into `document.body` by default.
- `Content` is the visible sheet (`role="dialog"`). All visual styling goes here via `className`.
- `Title` is required for accessibility (`aria-labelledby`). Use `className="sr-only"` to hide visually.
- `Handle` provides the drag affordance. Place it as the first child of `Content`.
- `Overlay` only renders in modal mode (`modal={true}`, the default). Omit it for non-modal.

### Optional subcomponents

- `Description` — Accessible description (`aria-describedby`).
- `Footer` — Non-scrollable area pinned at the bottom, ideal for action buttons.
- `FloatingBar` — Element that hovers above the sheet and fades on expand. Place it as a sibling of `Content` inside `Portal`.
- `Close` — Button that closes the sheet.
- `Trigger` — Button that opens the sheet (sets `aria-haspopup="dialog"`).
- `NestedRoot` — Use instead of `Root` for sheets inside sheets.

## Snap Points

Values can be fractions (0-1 for viewport height %) or pixel strings (`"200px"`).

```tsx
<BottomSheet.Root
  snapPoints={[0.25, 0.5, 1]}
  activeSnapPoint={snap}
  onActiveSnapPointChange={setSnap}
>
```

- `0` means closed position.
- `snapToSequentialPoint={true}` restricts drag to adjacent snap points only.
- `fadeFromIndex` controls which snap point starts showing the overlay.
- The handle taps cycle through snap points (disable with `preventCycle` on Handle).

## Modes

### Modal (default)

Renders overlay, traps focus, locks body scroll, closes on ESC/overlay click.

### Non-modal

```tsx
<BottomSheet.Root modal={false}>
```

No overlay, no focus trap, no body lock. Page behind stays interactive.

### Floating

```tsx
<BottomSheet.Root floating>
```

Detached from edges with rounded corners. Customize via CSS:

```css
--glidesheet-floating-radius: 1rem;
--glidesheet-floating-offset: 0.625rem;
```

## Scrollable Content

The scroll-to-drag transition is automatic. Structure scrollable content like this:

```tsx
<BottomSheet.Content className="my-sheet">
  <BottomSheet.Handle />
  <div style={{ overflowY: 'auto', flex: 1 }}>
    {/* scrollable content */}
  </div>
  <BottomSheet.Footer>
    <button>Action</button>
  </BottomSheet.Footer>
</BottomSheet.Content>
```

Opt out specific elements from drag with `data-glidesheet-no-drag`:

```tsx
<div data-glidesheet-no-drag>This won't trigger sheet drag</div>
```

## useBottomSheet Hook

Access sheet state from any descendant of `Root`:

```tsx
const { isOpen, isDragging, isFullyOpen, isMinimized, close, open, snapTo } = useBottomSheet();
```

## Styling

GlideSheet ships minimal structural CSS. All visual appearance (background, shadow, border-radius, padding) is your responsibility via `className` or `style` on `Content`.

### CSS custom properties

```css
--glidesheet-z-index: 50;
--glidesheet-floating-radius: 1rem;
--glidesheet-floating-offset: 0.625rem;
--glidesheet-handle-radius: 1.5rem;
--glidesheet-handle-bg: inherit;
--glidesheet-handle-pill-bg: rgba(0, 0, 0, 0.25);
```

### Data attributes for conditional styling

| Attribute | Values | Element |
|-----------|--------|---------|
| `data-glidesheet` | — | Content |
| `data-state` | `"open"` / `"closed"` | Content, Overlay |
| `data-snap-points` | `"true"` / `"false"` | Content, Overlay |
| `data-floating` | `"true"` / `"false"` | Content |

## Common Pitfalls

- **Missing `import 'glidesheet/style.css'`** — The sheet won't animate or position correctly without the base CSS.
- **Styling on Root instead of Content** — `Root` is a context provider with no DOM output. Put `className` on `Content`.
- **Overlay in non-modal** — `Overlay` only renders when `modal={true}`. Omit it for non-modal sheets.
- **Missing Title** — Always include `Title` for accessibility. Use `sr-only` to hide it visually.
- **onAnimationEnd timing** — GlideSheet fires `onAnimationEnd` via `transitionend`, not `setTimeout`. It's reliable — use it for cleanup, unmounting portals, or state resets.

## Reference

See `references/api.md` for the complete props reference and `references/patterns.md` for advanced patterns (nested sheets, progressive overlay, floating bar, controlled snap points).
