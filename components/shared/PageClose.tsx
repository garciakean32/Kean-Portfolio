"use client";

import Link from "next/link";
import { MaskLine } from "@/components/motion/Text";
import { cn } from "@/lib/utils";
import { gsap, morphIn, riseMasks, useGsap } from "@/lib/motion";

/**
 * The last block on the interior pages: a single onward move, phrased for
 * where the reader has just been.
 *
 * Same close as the home page's `CallToAction` — margins converging on the
 * statement set in Japanese, the English centred under it — but scrolled into
 * view normally rather than uncovered from beneath a reveal, so every trigger
 * here reads this section's own position.
 */
export default function PageClose({
    lead,
    trail,
    href,
    cta,
    tone = "from-paper to-paper-3",
}: {
    lead: string;
    trail: string;
    href: string;
    cta: string;
    /** Start tone must match where the section above ends. */
    tone?: string;
}) {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        gsap.fromTo(
            q(".js-converge-l"),
            { xPercent: -60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 85%", end: "top 35%", scrub: 0.7 },
            }
        );
        gsap.fromTo(
            q(".js-converge-r"),
            { xPercent: 60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 85%", end: "top 35%", scrub: 0.7 },
            }
        );

        morphIn(q(".js-title"), { trigger: el, start: "top 72%" });
        riseMasks(q(".js-title .js-mask-inner"), { trigger: el, start: "top 72%", stagger: 0.09 });

        gsap.fromTo(
            q(".js-mark"),
            { scale: 1.35, opacity: 0, letterSpacing: "0.9em" },
            {
                scale: 1,
                opacity: 1,
                letterSpacing: "0.3em",
                duration: 0.9,
                ease: "power4.out",
                scrollTrigger: { trigger: el, start: "top 55%" },
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
                scrollTrigger: { trigger: el, start: "top 48%" },
            }
        );
    });

    return (
        <section
            ref={scope}
            className={cn(
                "relative flex min-h-[100svh] items-center overflow-hidden bg-gradient-to-b py-28 md:py-40",
                tone
            )}
        >
            <div className="shell mx-auto w-full max-w-shell">
                <div className="flex items-center justify-between gap-6">
                    <span
                        aria-hidden="true"
                        className="js-converge-l h-px flex-1 origin-left bg-rule-strong"
                    />
                    {/* The statement again in Japanese: the point the two
                        rules are travelling towards, and the only mark in the
                        close. */}
                    <span className="js-mark shrink-0 font-jp text-sm font-medium tracking-[0.3em] text-ink-3">
                        何を作りたいか教えてください
                    </span>
                    <span
                        aria-hidden="true"
                        className="js-converge-r h-px flex-1 origin-right bg-rule-strong"
                    />
                </div>

                <h2 className="js-title mt-12 text-center font-display text-d3 font-bold tracking-[-0.03em] text-ink md:mt-16">
                    <MaskLine>{lead}</MaskLine>
                    <MaskLine className="font-serif font-normal text-ink-2">{trail}</MaskLine>
                </h2>

                <div className="js-actions mt-12 flex flex-col items-center gap-6 md:mt-16">
                    <Link
                        href={href}
                        className="group inline-flex items-center gap-3 rounded border border-ink bg-ink px-8 py-4 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink"
                    >
                        {cta}
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                            →
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
