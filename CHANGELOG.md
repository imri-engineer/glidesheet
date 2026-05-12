# Changelog

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
