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

        lenis.on("scroll", ScrollTrigger.update);

        const update = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(update);
            setLenis(null);
            lenis.destroy();
        };
    }, []);

    return null;
}
