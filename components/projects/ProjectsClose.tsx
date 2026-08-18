"use client";

import Link from "next/link";
import { MaskLine } from "@/components/motion/Text";
import { personal } from "@/lib/data";
import { gsap, morphIn, riseMasks, useGsap } from "@/lib/motion";

/**
 * The Projects page's close, styled after the home page's "Have something
 * you want built?" — the same converging rules, Japanese mark, centred heading
 * and settling reveal. Unlike the home and about closes it isn't a `RevealUnder`
 * `under`, so it triggers off its own position; the `.js-reveal-cover`
 * lookup below falls back to `el` for exactly that case.
 */
export default function ProjectsClose() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const cover = document.querySelector<HTMLElement>(".js-reveal-cover") ?? el;

        gsap.fromTo(
            q(".js-converge-l"),
            { xPercent: -60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: cover, start: "top 70%", end: "top 20%", scrub: 0.7 },
            }
        );
        gsap.fromTo(
            q(".js-converge-r"),
            { xPercent: 60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: cover, start: "top 70%", end: "top 20%", scrub: 0.7 },
            }
        );

        morphIn(q(".js-title"), { trigger: cover, start: "top 70%" });
        riseMasks(q(".js-title .js-mask-inner"), { trigger: cover, start: "top 70%", stagger: 0.09 });

        gsap.fromTo(
            q(".js-mark"),
            { scale: 1.35, opacity: 0, letterSpacing: "0.9em" },
            {
                scale: 1,
                opacity: 1,
                letterSpacing: "0.3em",
                duration: 0.9,
                ease: "power4.out",
                scrollTrigger: { trigger: cover, start: "top 45%" },
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
                scrollTrigger: { trigger: cover, start: "top 38%" },
            }
        );
    });

    return (
        <section
            ref={scope}
            className="relative flex h-[100svh] items-center overflow-hidden bg-gradient-to-b from-paper-3 to-paper py-28 md:py-40"
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
                        三つ目はあなたの番
                    </span>
                    <span
                        aria-hidden="true"
                        className="js-converge-r h-px flex-1 origin-right bg-rule-strong"
                    />
                </div>

                <h2 className="js-title mt-12 text-center font-display text-d3 font-bold tracking-[-0.03em] text-ink md:mt-16">
                    <MaskLine>Yours could be</MaskLine>
                    <MaskLine className="font-serif font-normal text-ink-2">
                        the third one.
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
                        className="link-rule font-mono text-meta lowercase text-ink-2"
                    >
                        {personal.email}
                    </a>
                </div>
            </div>
        </section>
    );
}
