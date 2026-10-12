"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/** Shared timing language — every animation on the site pulls from these. */
export const EASE = {
    out: "power4.out",
    io: "power3.inOut",
    soft: "power2.out",
} as const;

export const DUR = {
    micro: 0.35,
    reveal: 0.95,
    long: 1.4,
} as const;

export const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Single source of truth for whether decorative motion runs. Set before first
 * paint by the inline script in the root layout, and kept in sync when the
 * visitor changes their reduced-motion preference. The same flag drives the
 * pre-animation states in globals.css, so markup is never left hidden when
 * motion is off.
 */
export function motionEnabled() {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.motion === "on";
}

/**
 * Scoped GSAP setup. Everything created inside `setup` is reverted on unmount,
 * which also kills its ScrollTriggers — necessary because route changes swap
 * out whole page trees.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
    setup: (scope: T) => void,
    deps: unknown[] = []
) {
    const scope = useRef<T>(null);

    useIsomorphicLayoutEffect(() => {
        const el = scope.current;
        if (!el || !motionEnabled()) return;

        let ctx: gsap.Context | undefined;
        try {
            ctx = gsap.context(() => setup(el), el);
        } catch (error) {
            // A broken animation must never leave the page invisible: dropping
            // the flag removes every pre-animation state in globals.css.
            document.documentElement.dataset.motion = "off";
            console.error("Motion setup failed; revealing content.", error);
        }
        return () => ctx?.revert();
    }, deps);

    return scope;
}

/**
 * How long a reveal already on screen when the page loads holds before it
 * opens: long enough that the hero is visibly first, so the page still reads
 * top to bottom rather than back to front.
 */
const INTRO_HOLD = 1.2;

/* ------------------------------------------------------------------
   Recipes — the vocabulary sections compose from
   ------------------------------------------------------------------ */

type At = { trigger?: Element | string; start?: string; delay?: number };

/** The viewport line a `"top NN%"` start resolves to, in pixels. */
const startLine = (start: string) => {
    const percent = /(-?[\d.]+)%/.exec(start);
    return ((percent ? parseFloat(percent[1]) : 82) / 100) * window.innerHeight;
};

/**
 * Wires a reveal to whatever should cue it.
 *
 * Normally that is the scroll, and this hands GSAP an ordinary
 * `scrollTrigger`. But a section already sitting in the first screen at load
 * has no scroll to wait for: ScrollTrigger fires it the instant it is created,
 * so on a short viewport the block under the hero has finished revealing
 * before anyone has looked at it. Those hold for `INTRO_HOLD` instead and open
 * behind the hero, which is what keeps the page reading top to bottom.
 *
 * A plain `delay` cannot stand in for this. ScrollTrigger pauses the tween it
 * is handed and re-anchors it when it plays, which drops the delay entirely —
 * so the hold only means anything once the trigger is out of the picture.
 *
 * The recipes below all go through this. Exported for the one-off reveals that
 * do not fit any of them.
 */
export function reveal(
    make: (vars: gsap.TweenVars) => gsap.core.Tween,
    { trigger, start = "top 82%", delay = 0 }: At
) {
    if (!trigger) return make({ delay });

    const el = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
    // Only `top` starts are measured here — the comparison below reads the
    // trigger's top edge, so a `bottom`-anchored start is left to
    // ScrollTrigger, which knows how to resolve it.
    const top = el && start.startsWith("top ") ? el.getBoundingClientRect().top : Infinity;

    // `top >= 0` deliberately: a negative top is a section already scrolled
    // past, not one waiting in the first screen, and the scroll stays the
    // honest cue for it.
    if (!(top >= 0 && top <= startLine(start))) {
        return make({ delay, scrollTrigger: { trigger, start } });
    }

    const tween = make({ delay: delay + INTRO_HOLD }).pause();
    requestAnimationFrame(() => tween.play());
    return tween;
}

/** Content fades up — used sparingly, for supporting copy only. */
export function fadeUp(
    targets: gsap.TweenTarget,
    { trigger, start = "top 85%", delay = 0, stagger = 0.08, y = 26 }: At & { stagger?: number; y?: number } = {}
) {
    return reveal(
        (cue) =>
            gsap.fromTo(targets, { opacity: 0, y }, {
                opacity: 1,
                y: 0,
                duration: DUR.reveal,
                ease: EASE.out,
                stagger,
                ...cue,
            }),
        { trigger, start, delay }
    );
}

/**
 * Runs `handler` whenever the device pixel ratio changes, and returns an
 * unsubscribe.
 *
 * This is the one screen change nothing else on the page hears. A canvas sizes
 * its backing store in device pixels, so it has to be told when a device pixel
 * stops being worth what it was — and dragging a window from a 1x monitor to a
 * 2x one does exactly that without changing a single CSS pixel of layout.
 * `resize` does not fire (the element is the same size), and a `ResizeObserver`
 * has nothing to observe, so a canvas that read the ratio once at mount is left
 * drawing at half resolution until the page is reloaded.
 *
 * `(resolution: Ndppx)` is the signal: it is true of exactly the current ratio
 * and stops being true the instant that changes, at which point the query is
 * re-armed against the new one. A browser that does not understand the feature
 * simply never fires, which is the same behaviour as before this existed.
 */
export function onDprChange(handler: () => void) {
    if (typeof window === "undefined") return () => {};

    let query: MediaQueryList | null = null;
    let live = true;

    const arm = () => {
        query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        query.addEventListener("change", fired);
    };

    const fired = () => {
        query?.removeEventListener("change", fired);
        if (!live) return;
        arm();
        handler();
    };

    arm();

    return () => {
        live = false;
        query?.removeEventListener("change", fired);
    };
}
