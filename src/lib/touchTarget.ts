// src/lib/touchTarget.ts
//
// The 44px mobile touch-target floor, applied to a small round control (an icon
// button, a switch) whose *visible* size should stay smaller than that for
// visual weight — a 44px close button reads heavy next to a modal heading, a
// 44px info glyph would dwarf the search icon it sits beside.
//
// The fix is the same everywhere it applies: keep the drawn box small, grow the
// invisible tappable region around it with a `before:` pseudo-element, and
// collapse that pseudo-element back to the box's own bounds at `sm`+, where a
// mouse or trackpad click has no touch-target floor to satisfy.
//
// Centralized here rather than each call site hand-picking its own inset. In the
// codebase this was extracted from, a review pass found two of three hand-picked
// values did not actually reach 44px — one overshot to 56px, another was
// asymmetric and overshot to 64px on one axis.
//
// PRESETS, NOT A COMPUTED INSET. Tailwind v4's scanner needs complete, literal
// class-name strings present in a file it scans. A string built as
// `before:-inset-[${n}px]` never appears as text anywhere in the source, so it
// silently never ships in the generated CSS. A lookup table of the sizes the
// codebase actually uses keeps every class name literal — grep-able, and visible
// to the scanner — while still giving call sites one correctness-checked source.
// Add a size here rather than reaching for an inline `before:-inset-[...]`.
//
// EVERY PRESET RETURNS `relative`, which the pseudo-element needs something to
// position against. If a call site ALSO needs `position: absolute` for
// page-level floating placement, do NOT add an `absolute` class alongside this:
// `relative` and `absolute` set the same CSS property, and whichever rule
// Tailwind happens to generate later wins regardless of the order the classes
// appear in the string — which silently drops the element to static position.
// (Caught live once.) Set `position: "absolute"` as an INLINE STYLE instead;
// inline styles beat any class, sidestepping the ordering question entirely.

const TOUCH_TARGET_PRESETS: Record<number, string> = {
  // 24px visible (a small info glyph) -> 10px inset each side = 44px.
  24: "relative before:absolute before:-inset-2.5 before:content-[''] sm:before:inset-0",
  // 29px visible (map corner controls, sized to match MapLibre's own
  // NavigationControl buttons) -> 7.5px inset each side = 44px.
  29: "relative before:absolute before:-inset-[7.5px] before:content-[''] sm:before:inset-0",
  // 36px visible (a modal close button, a switch track) -> 4px each side = 44px.
  36: "relative before:absolute before:-inset-1 before:content-[''] sm:before:inset-0",
};

export function touchTargetClass(visiblePx: keyof typeof TOUCH_TARGET_PRESETS): string {
  return TOUCH_TARGET_PRESETS[visiblePx];
}
