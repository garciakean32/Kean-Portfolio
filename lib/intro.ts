"use client";

import { getLenis } from "@/lib/lenis";

/**
 * The cinematic open.
 *
 * The hero's first three beats are meant to run with the chrome out of frame
 * and the page frozen — which is only ever right when the visitor has just
 * landed. That decision is made before first paint by the inline script in the
 * root layout: it stamps `data-intro="pending"` on <html> when, and only when,
 * the document being loaded is the home page and motion is wanted at all. The
 * CSS gate in globals.css hangs off the same attribute, so the navbar is
 * already up and out on the very first frame rather than a hydration later.
 *
 * Nothing ever sets the attribute back to "pending". A client-side route to
 * `/` — where the visitor is already reading, scrolling, and using the nav —
 * finds it "off", and the hero simply animates over a live page.
 *
 * Callable more than once for the same load without losing the claim — dev's
 * Strict Mode mounts Hero, tears it down, and mounts it again before the
 * first paint, and the second call has to see the same "yes, this is mine"
 * answer the first one did. Only "off", set once the real run actually
 * finishes (see Hero.tsx's care around calling `endIntro` from that phantom
 * teardown), closes the claim for good.
 */
export function claimIntro() {
    const root = document.documentElement;
    if (root.dataset.intro === "off") return false;

    root.dataset.intro = "running";
    window.scrollTo(0, 0);
    // Belt and suspenders: SmoothScroll checks this same attribute the
    // instant it creates Lenis, which is the actual guarantee — that runs
    // in the same synchronous effect as the creation, so there's no frame
    // where an active-but-not-yet-stopped instance could exist. This can
    // only ever be reaching for one that was somehow already running.
    requestAnimationFrame(() => getLenis()?.stop());
    return true;
}

/**
 * Lets the navbar in early — the instant the portrait starts its own
 * reveal, not the moment the whole sequence finally finishes. Scroll stays
 * locked, the curtains keep sliding, the hero stays lifted above them: this
 * only narrows what the `[data-chrome]` gate in globals.css is watching, an
 * intermediate stop between "running" and "off" rather than a shortcut to
 * either. A no-op outside "running" — before it, there's no bar to let in
 * yet; after it (including once the intro has genuinely ended), there's
 * nothing left for an intermediate state to mean.
 */
export function revealChrome() {
    const root = document.documentElement;
    if (root.dataset.intro !== "running") return;
    root.dataset.intro = "reveal";
}

/**
 * Hands the page back: chrome in, scroll and pointers live. Safe to call more
 * than once and from anywhere, which is the point — every path out of the
 * intro, including the ones where it never ran, ends here.
 */
export function endIntro() {
    const root = document.documentElement;
    if (root.dataset.intro === "off") return;

    root.dataset.intro = "off";
    getLenis()?.start();
}
