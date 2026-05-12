# GlideSheet Patterns

## Nested Sheets

Use `NestedRoot` for a sheet inside a sheet. The parent automatically scales down.

```tsx
<BottomSheet.Root open={parentOpen} onOpenChange={setParentOpen}>
  <BottomSheet.Portal>
    <BottomSheet.Overlay />
    <BottomSheet.Content className="parent-sheet">
      <BottomSheet.Handle />
      <BottomSheet.Title className="sr-only">Parent</BottomSheet.Title>
      <p>Parent content</p>

      <button onClick={() => setChildOpen(true)}>Open child</button>

      <BottomSheet.NestedRoot open={childOpen} onOpenChange={setChildOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content className="child-sheet">
            <BottomSheet.Handle />
            <BottomSheet.Title className="sr-only">Child</BottomSheet.Title>
            <p>Child content</p>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.NestedRoot>
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

The child sheet needs its own `Portal`, `Overlay`, and `Content`. The parent scales down by 16px displacement automatically.

## Controlled Snap Points

Full control over snap point state:

```tsx
function ControlledSheet() {
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<SnapPoint | null>(0.25);

  return (
    <BottomSheet.Root
      open={open}
      onOpenChange={setOpen}
      snapPoints={[0.25, 0.5, 1]}
      activeSnapPoint={snap}
      onActiveSnapPointChange={setSnap}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content className="my-sheet">
          <BottomSheet.Handle />
          <BottomSheet.Title className="sr-only">Controlled</BottomSheet.Title>

          <div>Current snap: {snap}</div>
          <button onClick={() => setSnap(1)}>Expand</button>
          <button onClick={() => setSnap(0.25)}>Minimize</button>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}
```

## Sequential Snapping

Force step-by-step navigation between snap points:

```tsx
<BottomSheet.Root
  snapPoints={[0.2, 0.5, 0.8, 1]}
  snapToSequentialPoint
>
```

The user can only drag to the next or previous snap point, never skip one.

## Progressive Overlay

The overlay opacity follows the sheet's drag progress instead of snapping on/off:

```tsx
<BottomSheet.Root
  open={open}
  onOpenChange={setOpen}
  progressiveOverlay
  progressiveOverlayMaxOpacity={0.5}
>
  <BottomSheet.Portal>
    <BottomSheet.Overlay />
    <BottomSheet.Content className="my-sheet">
      <BottomSheet.Handle />
      <BottomSheet.Title className="sr-only">Progressive</BottomSheet.Title>
      {children}
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

The overlay background is controlled by JS — the CSS `background` is set to `transparent` automatically.

## Floating Bar

A floating element above the sheet that fades as the sheet expands. Useful for navigation pills or selection indicators.

```tsx
<BottomSheet.Root open={open} onOpenChange={setOpen}>
  <BottomSheet.Portal>
    <BottomSheet.Overlay />
    <BottomSheet.FloatingBar className="pill-bar" gap={12} fadeStartPercent={40} fadeEndPercent={60}>
      <span>3 items selected</span>
    </BottomSheet.FloatingBar>
    <BottomSheet.Content className="my-sheet">
      <BottomSheet.Handle />
      <BottomSheet.Title className="sr-only">With Floating Bar</BottomSheet.Title>
      {children}
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

`FloatingBar` must be a sibling of `Content` inside `Portal`, not a child of `Content`.

## Footer with Actions

Pin action buttons at the bottom while content scrolls:

```tsx
<BottomSheet.Content className="my-sheet">
  <BottomSheet.Handle />
  <BottomSheet.Title className="sr-only">With Footer</BottomSheet.Title>
  <div style={{ overflowY: 'auto', flex: 1 }}>
    {/* long scrollable content */}
  </div>
  <BottomSheet.Footer className="sheet-footer">
    <button onClick={onCancel}>Cancel</button>
    <button onClick={onConfirm}>Confirm</button>
  </BottomSheet.Footer>
</BottomSheet.Content>
```

The `Content` should use `display: flex; flex-direction: column` so the scrollable area fills available space while `Footer` stays pinned.

## Handle-Only Drag

Restrict dragging to the handle only — useful when content has interactive elements:

```tsx
<BottomSheet.Root handleOnly>
  <BottomSheet.Portal>
    <BottomSheet.Content>
      <BottomSheet.Handle />
      <BottomSheet.Title className="sr-only">Handle Only</BottomSheet.Title>
      <div>
        <input type="text" placeholder="Won't trigger drag" />
        <button>Clicking works normally</button>
      </div>
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

## Non-Dismissible Sheet

Prevent closing by drag, ESC, or overlay click:

```tsx
<BottomSheet.Root dismissible={false}>
```

The sheet can only be closed programmatically via `onOpenChange` or the `close()` method from `useBottomSheet()`.

## Custom Portal Target

Render the sheet into a specific container instead of `document.body`:

```tsx
const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef} style={{ position: 'relative' }}>
  <BottomSheet.Root container={containerRef.current}>
    <BottomSheet.Portal>
      <BottomSheet.Content>
        {/* renders inside containerRef */}
      </BottomSheet.Content>
    </BottomSheet.Portal>
  </BottomSheet.Root>
</div>
```

## Trigger + Close Pattern (Uncontrolled)

For simple cases without external state:

```tsx
<BottomSheet.Root>
  <BottomSheet.Trigger asChild>
    <button>Open sheet</button>
  </BottomSheet.Trigger>
  <BottomSheet.Portal>
    <BottomSheet.Overlay />
    <BottomSheet.Content className="my-sheet">
      <BottomSheet.Handle />
      <BottomSheet.Title>Settings</BottomSheet.Title>
      <p>Content here</p>
      <BottomSheet.Close asChild>
        <button>Done</button>
      </BottomSheet.Close>
    </BottomSheet.Content>
  </BottomSheet.Portal>
</BottomSheet.Root>
```

## Responding to Animation End

Run logic after the open/close animation completes:

```tsx
<BottomSheet.Root
  onAnimationEnd={(open) => {
    if (!open) {
      // sheet fully closed — safe to unmount, reset state, etc.
      resetForm();
    }
  }}
>
```

This fires via `transitionend`, not `setTimeout` — it's reliable even if the animation duration changes.

## Pixel Snap Points

Use pixel values for fixed-height positions:

```tsx
<BottomSheet.Root snapPoints={['100px', '300px', 1]}>
```

Mix freely with fractions. Pixel values are measured from the bottom of the viewport.

## Conditional Overlay with fadeFromIndex

Show the overlay only when the sheet passes a certain snap point:

```tsx
<BottomSheet.Root
  snapPoints={[0.25, 0.5, 1]}
  fadeFromIndex={1}
>
```

The overlay fades in starting from snap index 1 (0.5). At index 0 (0.25), no overlay is visible.
