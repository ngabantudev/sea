// src/lib/domReady.ts
//
// Every client island boots the same way: run init now if the document is
// already parsed, otherwise on DOMContentLoaded, and again on `astro:page-load`.
// That is eight lines copy-pasted into each one otherwise.
//
// ON `astro:page-load`: a site with no <ClientRouter /> dispatches nothing, so
// the second registration is dormant. It stays, and islands stay idempotent,
// because it costs one listener and it is the difference between adding view
// transitions being a one-line change and being a hunt through every island for
// state that survived a navigation it should not have. Treat it as a standing
// invariant to keep, not as a live code path — and do not reason about current
// behaviour from it.

/**
 * Runs `init` once the document is parsed, and again after every Astro
 * navigation, should the site ever gain them. Init functions must therefore be
 * idempotent: re-query your own elements and drop your previous listeners.
 */
export function onReady(init: () => void): void {
  document.addEventListener("astro:page-load", init);
  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
}
