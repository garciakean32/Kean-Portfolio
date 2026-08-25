"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, motionEnabled } from "@/lib/motion";
import { setLenis } from "@/lib/lenis";

/**
 * Inertia scrolling — the page keeps drifting a beat after the wheel/trackpad
 * input stops instead of stopping dead with it. Driven off GSAP's ticker so
 * ScrollTrigger's scroll-linked animations stay in sync with the eased
 * position rather than the raw input. Skipped under reduced motion, where
 * that lag is exactly the sensation that preference asks to turn off.
 */
export default function SmoothScroll() {
    useEffect(() => {
        if (!motionEnabled()) return;

        const lenis = new Lenis({
            duration: 1.15,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
        });
        setLenis(lenis);

        // Born stopped when the cinematic open is still holding the page:
        // `overflow: hidden` only blocks the native scrollbar/wheel/keyboard
        // path, not a programmatic `scrollTop` write — which is exactly what
        // Lenis does internally on a wheel event once it decides to handle
        // one. An active Lenis would happily scroll straight through the CSS
        // lock. This runs in the same synchronous effect that creates the
        // instance, so there's no frame where a wheel event could reach it
        // first — unlike reaching in from outside (see `claimIntro`), which
        // has to wait for this component to exist at all.
        if (document.documentElement.dataset.intro !== "off") lenis.stop();

        lenis.on("scroll", ScrollTrigger.update);

        const update = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        /* ---- keeping the two measurers in step ----

           Two things measure this document and they measure it at different
           moments. ScrollTrigger measures on resize, and in the same pass it
           *changes* the height it just measured: the sideways tracks size
           their own scroll budget from JS, so a refresh can add or remove
           thousands of pixels of page. Lenis measures separately, off a
           ResizeObserver, which fires on its own schedule afterwards.

           Between those two moments the two disagree about how long the page
           is, and a Lenis that thinks the document is shorter than it is will
           clamp every scroll it is handed to a maximum that no longer exists —
           which is the wheel going dead after dragging a window narrower, and
           coming back on reload because a reload is just both of them
           measuring the same document at the same time.

           So: whenever ScrollTrigger finishes a refresh, Lenis re-measures. */
        const remeasure = () => lenis.resize();
        ScrollTrigger.addEventListener("refresh", remeasure);

        /* And the resize itself is debounced into a single settle rather than
           run on every pixel of a drag. ScrollTrigger refreshes on resize by
           itself, but doing that a hundred times through a drag means a
           hundred passes of re-measuring, re-sizing and re-pinning against
           geometry that is still moving — which is the other half of what
           leaves a dragged window in a state a reload fixes. One refresh once
           the window has stopped is both cheaper and the only one whose
           measurements describe a layout that is actually settled. */
        let settle = 0;
        const onResize = () => {
            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
                lenis.resize();
                ScrollTrigger.refresh();
            }, 180);
        };
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);

        return () => {
            window.clearTimeout(settle);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            ScrollTrigger.removeEventListener("refresh", remeasure);
            gsap.ticker.remove(update);
            setLenis(null);
            lenis.destroy();
        };
    }, []);

    return null;
}
