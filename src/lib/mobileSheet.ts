// src/lib/mobileSheet.ts
//
// The phone layout's single-sheet contract.
//
// Below the breakpoint every inspector on this site — filters, a record list, a
// news list — occupies the same slot above the bottom toolbar, and exactly one
// of them is open at a time. That is the whole point: the alternative is several
// independently-positioned floating surfaces, and keeping them from covering
// each other takes a growing set of hand-written rules ("expanding the banner
// hides the news card", "a selected marker hides the filters card"). Every new
// surface needs a rule against every existing one.
//
// Here there is one variable. Opening B closes A because there is nowhere else
// for A to be.
//
// WHAT OWNS WHAT
//
//   MobileToolbar owns `activeSheet` and is the only thing that writes it. It
//   announces every change on `document` as SHEET_EVENT.
//
//   Each panel owns its own visibility. It listens for SHEET_EVENT and shows
//   itself when named, hides itself otherwise — it does NOT get shown or hidden
//   by the toolbar reaching into its DOM. Panels have desktop behaviour of their
//   own (a right rail, a pull-tab, an expanding banner) and that stays theirs;
//   the toolbar has no opinion about any width above the breakpoint.
//
//   The geometry is CSS, not script: `.mobile-sheet` in global.css positions
//   whichever panel is showing. Panels keep their own `display`, so nothing here
//   fights a panel's own hidden/shown mechanism.
//
//   A panel that wants its own close button adds `data-sheet-close` to it. The
//   toolbar closes whatever is open when a click lands inside such an element,
//   so a panel never needs a handle on the controller — which is what keeps this
//   contract to one event in each direction.
//
// A detail panel opened by SELECTING something on the map (rather than by a tab)
// is deliberately not one of these: it is taller than a tab sheet and it is what
// the reader just asked for. Coordinate it through its own selection event —
// the toolbar closes its sheets when a selection arrives, and clears the
// selection when a tab is tapped. That is the one cross-surface rule left, and
// it is stated once.

/** Dispatched on `document` whenever the open sheet changes. */
export const SHEET_EVENT = "mobilesheetchange";

/** The panels that dock into the toolbar's sheet slot. Name your own. */
export type SheetId = "filters" | "records" | "news";

export interface SheetChangeDetail {
  /** The sheet now open, or null if none is. */
  open: SheetId | null;
}

/**
 * The one breakpoint.
 *
 * A media query rather than a `window.innerWidth` comparison because the CSS
 * decides this too — `.mobile-sheet` positions the panel and `md:hidden` shows
 * and hides the toolbar — and a script that disagreed with the stylesheet would
 * show a panel the CSS had not placed anywhere.
 *
 * Written in this odd negated form, and not as `(max-width: 767px)`, so that it
 * is the EXACT complement of Tailwind's `md:` (`min-width: 48rem`) rather than
 * merely a close one. Viewport widths are fractional under browser zoom and on
 * scaled displays: at 767.5px a `max-width: 767px` rule and `md:` are both
 * false, which would leave a sheet with neither its phone geometry nor its
 * desktop utilities. `not all and (…)` cannot have a gap, because it is
 * negation. Tailwind's own `max-md:` variant compiles to the same thing.
 *
 * MUST match the media query on `.mobile-sheet` in global.css exactly.
 */
const MOBILE_QUERY = "not all and (min-width: 48rem)";

export function isMobile(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Subscribe to sheet changes. Returns its own unsubscribe, so callers can push
 * it straight onto the cleanups array every island keeps.
 */
export function onSheetChange(handler: (open: SheetId | null) => void): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<SheetChangeDetail>).detail?.open ?? null);
  };
  document.addEventListener(SHEET_EVENT, listener);
  return () => document.removeEventListener(SHEET_EVENT, listener);
}
