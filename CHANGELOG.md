# Changelog

## 0.6.0

### Added
- **`gapFade` on `FloatingBar`** — paints a gradient in the gap between the bar and the
  sheet, so content scrolling underneath dissolves into the sheet instead of being cut
  off at a hard edge. The layer spans from the top of the bar down to the sheet (so it
  also covers the area *behind* the bar, which is narrower than the viewport) and sits
  below the bar, which stays crisp on top. It tracks the bar frame-for-frame and fades
  out with it as the sheet rises.
  - `--glidesheet-gap-fade-color` (default: `Canvas`) — set it to the sheet's own
    background, e.g. `style={{ '--glidesheet-gap-fade-color': 'var(--surface)' }}`.
  - `--glidesheet-gap-fade-top-opacity` (default: `15%`) — the gradient's top keeps this
    much tint rather than reaching full transparency, so there is no hard "nothing" edge.

  Note the name: `fadeStartPercent`/`fadeEndPercent` fade the **bar**; `gapFade` fades
  the **gap**.

### Fixed
- **`FloatingBar` no longer flashes one bar-height too low on its first frame.** The
  bar's height was measured by a state setter on the ref callback, which only runs after
  the first paint — so the initial `top` was computed with `barHeight = 0`. It is now
  measured from the node inside the RAF loop, where the node is already laid out. As a
  side effect the height is re-read every frame, so a bar whose content changes height
  (wrapping, a swapped toolbar) now repositions instead of keeping a stale height.

## 0.5.8

### Fixed
- **Horizontal scrolling inside a sheet no longer blocked on touch devices.** The
  non-passive `touchmove` guard on the sheet resolved the touched scroll container by
  looking at vertical overflow only. A horizontally scrollable row (`overflow-x: auto`,
  no vertical overflow) was therefore treated as non-scrollable and every `touchmove`
  was `preventDefault()`-ed, killing the native horizontal scroll. The guard now also
  detects horizontal scrollers, and — when no vertical scroller arbitrates the gesture —
  leaves horizontal scrollers and `[data-glidesheet-no-drag]` areas to the browser.
  Vertical drag/scroll behaviour is unchanged.

## 0.5.6 (2026-06-22)

### Changes
- **Grab bar handle pill size** — the default handle pill is now `40×5px` (was `45×5px`): narrower pill.

## 0.5.5 (2026-06-22)

### Changes
- **Grab bar handle pill size** — the default handle pill is now `45×5px` (was `50×4px`): slightly narrower and a touch thicker.

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
