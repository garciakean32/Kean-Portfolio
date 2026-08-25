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

/**
 * How far behind the scroll a region falls at a page seam, as a fraction of
 * the viewport. `SlideOver` and `RevealUnder` are mirrors of each other and
 * have to agree on it, so it lives here rather than in either of them.
 *
 * It is a rate, read across the one viewport of scroll a seam takes: at `0.5`
 * the receding region travels half as far as the page does, so it is always
 * moving and never keeping up. At `1` it would not move at all — the pinned
 * hold both of these used to do, and the stop this number exists to avoid.
 *
 * It is also, exactly, the size of the hole a drifting region leaves behind
 * itself, which is why neither of these lets the drift touch the element that
 * holds the region's place in the document. See both for how that is kept off
 * screen.
 */
export const SEAM_DRIFT = 0.5;

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

/**
 * The starting position for a masked line.
 *
 * `y: 0` is not redundant. The CSS gate hides these with a percentage
 * translate, which GSAP reads back off the computed matrix as a pixel `y`.
 * Without zeroing it the line animates `yPercent` home and stays parked one
 * line-height down, so always spread this rather than passing the percentage
 * on its own.
 *
 * 135% (not 100%) because `.mask` carries vertical padding to protect
 * ascenders and descenders from the clip; anything less and the top of the
 * line peeks out below the mask before it animates. Keep in step with the
 * `[data-anim="mask"]` rule in globals.css.
 */
export const MASK_HIDDEN = { yPercent: 135, y: 0 } as const;

/** Masked lines/words rise into place. Mirrors the CSS pre-state exactly. */
export function riseMasks(
    targets: gsap.TweenTarget,
    { trigger, start = "top 82%", delay = 0, stagger = 0.08 }: At & { stagger?: number } = {}
) {
    return reveal(
        (cue) =>
            gsap.fromTo(targets, MASK_HIDDEN, {
                yPercent: 0,
                duration: DUR.reveal,
                ease: EASE.out,
                stagger,
                ...cue,
            }),
        { trigger, start, delay }
    );
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

/** Clip wipe from one edge — the horizontal personality. */
export function wipeIn(
    targets: gsap.TweenTarget,
    {
        trigger,
        start = "top 82%",
        delay = 0,
        stagger = 0.07,
        from = "left",
    }: At & { stagger?: number; from?: "left" | "right" } = {}
) {
    return reveal(
        (cue) =>
            gsap.fromTo(
                targets,
                { clipPath: from === "left" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" },
                {
                    clipPath: "inset(0 0% 0 0%)",
                    duration: DUR.long,
                    ease: EASE.io,
                    stagger,
                    // A settled `inset(0)` still clips to the border box, which
                    // would crop anything the row grows or rotates outside it
                    // later.
                    onComplete: () => gsap.set(targets, { clearProps: "clipPath" }),
                    ...cue,
                }
            ),
        { trigger, start, delay }
    );
}

/** Hairline rules draw out from their origin. */
export function drawRule(
    targets: gsap.TweenTarget,
    { trigger, start = "top 88%", axis = "x", delay = 0, stagger = 0.06 }: At & { axis?: "x" | "y"; stagger?: number } = {}
) {
    const prop = axis === "x" ? "scaleX" : "scaleY";
    return reveal(
        (cue) =>
            gsap.fromTo(targets, { [prop]: 0 }, {
                [prop]: 1,
                duration: DUR.long,
                ease: EASE.io,
                stagger,
                ...cue,
            }),
        { trigger, start, delay }
    );
}

/**
 * A region that travels sideways while it holds the screen.
 *
 * The hold is CSS `position: sticky` on the stage, not a GSAP pin — the same
 * reasoning `RevealUnder` spells out. A pin freezes its element by switching
 * it to `fixed` from a scroll listener, so the freeze lands a frame late at
 * best and visibly late after a flick: the section drags into place, and the
 * hand-off from vertical to horizontal reads as the page catching and
 * snapping. Sticky is resolved by the compositor on the same pass that moves
 * the scroll position, so the stage is already held the instant its top edge
 * reaches the top of the screen and the two directions meet without a seam.
 *
 * `section` is nothing but the scroll budget: one stage tall plus the
 * distance the track has to cover. Sizing it here — before every refresh —
 * keeps the budget and the travel from ever disagreeing, which is what would
 * otherwise leave a dead patch of scroll at one end.
 *
 * Returns the tween, for `containerAnimation` triggers inside the track.
 */
export function sideScroll(
    section: HTMLElement,
    { stage, track, scrub = 1 }: { stage: HTMLElement; track: HTMLElement; scrub?: number }
) {
    const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);

    // The first of these runs inside the caller's `gsap.context` and is
    // recorded for revert. None of the rest are: `onRefreshInit` fires them
    // from ScrollTrigger's own callback long after that context finished
    // setting up, so GSAP has no record of them and reverting the context
    // leaves the last one's height on the element.
    //
    // Reverting the context does undo the first write, and its recorded
    // starting value is "no inline height", so the height does come off. The
    // callers clear it again anyway on the way in to their stacked layout —
    // see the `(max-width: 1023.98px)` branches in Work.tsx and Services.tsx —
    // so that a section which is no longer scrolling sideways cannot be left
    // holding a scroll budget for a track that no longer exists, whatever
    // order two contexts happen to revert and activate in.
    const size = () => gsap.set(section, { height: stage.offsetHeight + distance() });
    size();

    return gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub,
            invalidateOnRefresh: true,
            onRefreshInit: size,
        },
    });
}

/** Scroll-linked drift. Positive `distance` moves with the scroll. */
export function parallax(
    target: gsap.TweenTarget,
    { trigger, distance = 80, scrub = 0.8 }: { trigger: Element | string; distance?: number; scrub?: number }
) {
    return gsap.fromTo(
        target,
        { y: -distance / 2 },
        {
            y: distance / 2,
            ease: "none",
            scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub },
        }
    );
}
