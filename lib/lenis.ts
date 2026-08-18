import type Lenis from "lenis";

/**
 * Set by SmoothScroll while it's mounted. Anything that needs to scroll
 * programmatically (e.g. PageTransition's same-route scroll-to-top) must go
 * through `lenis.scrollTo` rather than `window.scrollTo` — Lenis re-asserts
 * its own virtual position every frame, so a raw scrollTo call gets fought
 * and snapped back.
 */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
    instance = lenis;
}

export function getLenis() {
    return instance;
}
