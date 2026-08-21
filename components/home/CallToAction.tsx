"use client";

import Link from "next/link";
import { MaskLine } from "@/components/motion/Text";
import { personal } from "@/lib/data";
import { gsap, morphIn, riseMasks, useGsap } from "@/lib/motion";

/**
 * The close, back in the dark after the light region. Everything converges:
 * the margins draw inward on the statement set in Japanese, that line settles
 * out of its tracking, and the statement in English is the last thing still
 * moving.
 *
 * This section is `SlideOver`'s incoming region: it climbs over the light
 * region rather than being uncovered by it, so it travels a viewport at
 * ordinary scroll speed and its own position is an honest reference. Every
 * trigger here reads it, choreographed across that climb so nothing resolves
 * before there is anything to see it resolve against.
 */
export default function CallToAction() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        gsap.fromTo(
            q(".js-converge-l"),
            { xPercent: -60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 70%", end: "top 20%", scrub: 0.7 },
            }
        );
        gsap.fromTo(
            q(".js-converge-r"),
            { xPercent: 60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 70%", end: "top 20%", scrub: 0.7 },
            }
        );

        // The heading morphs into focus as a whole while its two lines rise
        // inside that same motion — a settling reveal rather than a slide.
        // "top 70%" matches the convergence lines' own start: the text begins
        // resolving as soon as its part of the section has climbed into view.
        morphIn(q(".js-title"), { trigger: el, start: "top 70%" });
        riseMasks(q(".js-title .js-mask-inner"), { trigger: el, start: "top 70%", stagger: 0.09 });

        gsap.fromTo(
            q(".js-mark"),
            { scale: 1.35, opacity: 0, letterSpacing: "0.9em" },
            {
                scale: 1,
                opacity: 1,
                letterSpacing: "0.3em",
                duration: 0.9,
                ease: "power4.out",
                scrollTrigger: { trigger: el, start: "top 45%" },
            }
        );

        gsap.fromTo(
            q(".js-actions"),
            { opacity: 0, y: 24 },
            {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power4.out",
                scrollTrigger: { trigger: el, start: "top 38%" },
            }
        );
    });

    return (
        <section
            ref={scope}
            className="relative flex h-[100svh] items-center overflow-hidden bg-gradient-to-b from-paper to-paper-3 py-28 md:py-40"
        >
            <div className="shell mx-auto max-w-shell">
                <div className="flex items-center justify-between gap-6">
                    <span
                        aria-hidden="true"
                        className="js-converge-l h-px flex-1 origin-left bg-rule-strong"
                    />
                    {/* The statement again in Japanese: the point the two
                        rules are travelling towards, and the only mark in the
                        close. */}
                    <span className="js-mark shrink-0 font-jp text-sm font-medium tracking-[0.3em] text-ink-3">
                        作りたいものはありますか
                    </span>
                    <span
                        aria-hidden="true"
                        className="js-converge-r h-px flex-1 origin-right bg-rule-strong"
                    />
                </div>

                <h2 className="js-title mt-12 text-center font-display text-d3 font-bold tracking-[-0.03em] text-ink md:mt-16">
                    <MaskLine>Have something</MaskLine>
                    <MaskLine className="font-serif font-normal text-ink-2">
                        you want built?
                    </MaskLine>
                </h2>

                <div className="js-actions mt-12 flex flex-col items-center gap-6 md:mt-16">
                    <Link
                        href="/contact"
                        className="group inline-flex items-center gap-3 rounded border border-ink bg-ink px-8 py-4 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink"
                    >
                        Start a project
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                            →
                        </span>
                    </Link>
                    <a
                        href={`mailto:${personal.email}`}
                        className="link-rule tap font-mono text-meta lowercase text-ink-2"
                    >
                        {personal.email}
                    </a>
                </div>
            </div>
        </section>
    );
}
