"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { personal, routes } from "@/lib/data";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * The site's spine. A fixed measure down the left edge carrying the current
 * section in both scripts, its index, real coordinates, and an ink mark that
 * travels with scroll depth. Collapses to a hairline progress bar on small
 * screens, where there is no margin to spare.
 */
export default function Rail() {
    const pathname = usePathname();
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, {
        stiffness: 240,
        damping: 40,
        restDelta: 0.001,
    });
    const reduce = useReducedMotion();

    // Same threshold and timing as the navbar's condensed state, so the two
    // pieces of chrome arrive together instead of drifting apart.
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        const id = window.setTimeout(onScroll, 0);
        return () => {
            window.clearTimeout(id);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    const t = reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT };

    const current =
        routes.find((r) => r.href !== "/" && pathname.startsWith(r.href)) ?? routes[0];

    return (
        <>
            {/* Mobile + tablet: one hairline of progress */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 z-40 h-px lg:hidden"
            >
                <motion.div
                    className="h-full origin-left bg-accent"
                    style={{ scaleX: progress }}
                />
            </div>

            {/* Desktop: the full measure. Opaque with its own hairline so it
                reads as a true margin — full-bleed images and the pinned
                horizontal track pass behind it instead of across it. */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden w-[var(--rail)] flex-col items-center justify-between border-r border-rule bg-paper py-6 lg:flex"
                initial={false}
                animate={{ opacity: scrolled ? 1 : 0, x: scrolled ? 0 : -8 }}
                transition={t}
            >
                <span className="font-mono text-label text-ink-3">{current.index}</span>

                <div className="relative my-6 w-px flex-1 bg-rule">
                    <motion.span
                        className="absolute inset-x-0 top-0 h-full origin-top bg-accent/40"
                        style={{ scaleY: progress }}
                    />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <span className="tate font-jp text-[0.8125rem] tracking-[0.3em] text-ink-2">
                        {current.jp}
                    </span>
                    <span className="font-mono text-label uppercase text-ink-3 [writing-mode:vertical-rl]">
                        {current.label}
                    </span>
                </div>

                <span className="mt-6 whitespace-nowrap font-mono text-[0.625rem] tracking-[0.12em] text-ink-3 [writing-mode:vertical-rl]">
                    {personal.coordinates}
                </span>
            </motion.div>
        </>
    );
}
