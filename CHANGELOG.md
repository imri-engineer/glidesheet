# Changelog

## 0.5.4 (2026-06-10)

### Fixes
- **Progressive overlay broken with snap points** — the progressive overlay was driven by a React `dragProgress` state updated only inside `onDrag`. Once the finger was released, the sheet animated to its snap point via CSS transition with no `onDrag` firing, so the overlay froze and jumped instead of tracking the motion (and at the lowest snap it could darken/steal scroll). The overlay is now driven by a `requestAnimationFrame` loop that reads the sheet's real on-screen position every frame — during the drag AND during snap/close transitions, in both directions — mirroring `<FloatingBar>`. While transparent the overlay keeps `pointer-events: none` so clicks/scroll pass through to the content behind (essential for non-modal sheets). All legacy overlay opacity writes in `useDrag`/`useSnapPoints` and the snap-point CSS opacity rule are now bypassed in progressive mode so the two systems no longer fight.

### Features
- **`progressiveOverlayFadeStart` / `progressiveOverlayFadeEnd` props** — control where the progressive overlay starts and finishes darkening. Each accepts a `number` (ratio of screen height, 0–1) or a `string` (fixed CSS px, e.g. `'340px'`), like `snapPoints`. Defaults: start = lowest visible snap point (so the overlay is transparent at rest), end = highest snap point.

## 0.5.3 (2026-06-10)

### Fixes
- **Grab bar handle not theme-aware** — the handle pill's default colour was hard-coded to `rgba(0, 0, 0, 0.25)` (black), which is invisible/low-contrast in dark mode. The default now derives from the sheet's text colour via `color-mix(in srgb, currentColor 25%, transparent)`, so it stays visible in both light and dark themes with no consumer config. Because it follows `currentColor` (not the OS `color-scheme`), it tracks whatever theme system the host app uses — CSS class, data-attribute, or media query. The `--glidesheet-handle-pill-bg` override still takes precedence for a fixed colour.

## 0.5.2 (2026-06-10)

### Fixes
- **Overlay flash on drag-to-close** — when dragging a non-snap-point sheet down to close it, the overlay briefly jumped back to full opacity for one frame before fading out (visible flash/flicker). Cause: the overlay's inline `opacity` is lowered live during the drag, but the close was driven by `@keyframes glidesheet-fadeOut` (which has no `from` and ignores the current inline value), so the browser re-rendered the overlay at its base opacity before animating to 0. The overlay now fades out via a plain `opacity` transition that starts from its current value — continuous, no flash (matches Vaul's behaviour). The `glidesheet-dragging` class is now also applied to the overlay so its transition is suppressed during the drag (1:1 finger tracking). Removed the now-unused `glidesheet-fadeOut` keyframe.

## 0.5.1 (2026-05-14)

### Fixes
- **iOS scroll regression** — restore scroll check in `onPointerDown` to prevent `setPointerCapture` from stealing touch control when inside a scrollable element not at top; `pointerStartRef` is still set so drag can activate if user scrolls back to top
- **Progressive overlay blocking clicks** — add `pointer-events: none` to progressive overlay when the sheet is closed or when opacity is 0, preventing it from intercepting clicks on elements behind the sheet

## 0.5.0 (2026-05-14)

### Fixes
- **Desktop/Android drag** — replaced `onPointerOut` with `onPointerLeave` on Content to prevent false drag interruptions caused by pointer events bubbling from child elements
- **Android/responsive touch drag** — removed aggressive scroll check from `onPointerDown` that blocked drag initiation on non-scrollable areas (handle, header); scroll-vs-drag decision is now handled by `shouldDrag()` during `onDrag`, matching Vaul's approach
- **Touch scroll prevention** — new `touchmove` listener on Content that `preventDefault`s on non-scrollable areas (handle, header, title) while preserving native scroll in scrollable children; when inside a scrollable child at `scrollTop=0` pulling down, also prevents default to let the sheet drag take over
- **Handle touch-action** — changed from `pan-y` to `none` so the browser doesn't intercept touch gestures on the handle as native scroll
- **touchmove cancelable check** — guard `preventDefault()` with `e.cancelable` to suppress `[Intervention] Ignored attempt to cancel a touchmove event with cancelable=false` warnings

### Tests
- Added `pointer-drag.test.tsx` with 7 tests covering pointer event handling, touch scroll prevention, and `cancelable=false` edge case

## 0.4.0 (2026-05-12)

### Features
- **AI agent skill** — ships a skill for Claude Code, Cursor, Copilot, Gemini CLI, etc. Install via `npx skills add imri-engineer/glidesheet`
- **Handle redesign** — grab bar style matching native bottom sheet patterns

## 0.3.0 (2026-05-12)

### Features
- **Progressive overlay** — opacity based on drag position (`progressiveOverlay` prop)
- **FloatingBar component** — positioned above sheet with auto slide-down via RAF loop
- **useBottomSheet hook** — public hook exposing `isOpen`, `isDragging`, `isFullyOpen`, `isMinimized`, `close()`, `open()`, `snapTo()`
- **Drag lifecycle callbacks** — `onDragStart`, `onDragEnd` props on Root
- **NestedRoot component** — for nested sheets with stacking effect

### Fixes
- **Scroll behavior** — smooth native scroll, sheet only drags when content is at top
- **No close when scrolled** — skip pointer capture when touching scrolled content (`scrollTop > 1`)
- **Prevent Chrome pull-to-refresh** — `overscroll-behavior: none` on `<html>` when sheet is open
- **Always resetDrawer on release** — prevent sheet from getting stuck after small drag
- **swipeAmount === 0 check** — was `!swipeAmount` which blocked on 0
- **Close animation** — restore CSS transition before closing so slide-down plays
- **Snap points enter animation** — reset `delayedSnapPoints` on each mount for proper transition
- **Portal unmount** — returns null when closed, delayed unmount for exit animation
- **Positioning** — `bottom: 0; left: 0; right: 0` instead of `inset: 0`
- **Removed touch-action: none** — allows native scroll momentum
- **Removed overscroll-behavior: none on children** — was killing scroll momentum
- **Removed scrollBehavior: auto on html** — was forcing instant scroll inside sheets

### Refactor
- Extracted `use-drag.ts`, `use-keyboard.ts`, `use-nested.ts` from Root
- Root reduced to ~200 lines (was ~500)
- Reduced hooks: 3 useState, 13 useRef, 5 useEffect (was 5/14/6)

### Breaking Changes
- None — API is backward compatible with 0.2.x

## 0.2.0 (2026-05-11)

### Features
- Initial release
- Compound component API: `BottomSheet.Root`, `Content`, `Overlay`, `Handle`, `Portal`, `Trigger`, `Close`, `Title`, `Description`
- Snap points (fraction + px), `snapToSequentialPoint`
- Controlled and uncontrolled open state
- Modal and non-modal modes
- Body lock: `overflow: hidden` (desktop) + iOS Safari touch prevention
- Focus trap (modal only) + focus restore on close
- ESC key to close
- `onAnimationEnd` via `transitionend` (fixes Vaul #520)
- Safe area extension via real element (fixes Vaul #573)
- Floating mode support
- Zero runtime dependencies
- React 18 + 19 compatible
- 27 unit tests via Bun + happy-dom + RTL
