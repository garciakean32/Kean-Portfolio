"use client";

import Link from "next/link";
import PrismDrift from "@/components/motion/PrismDrift";
import { MaskLine } from "@/components/motion/Text";
import { EASE, gsap, MASK_HIDDEN, useGsap } from "@/lib/motion";

export default function Hero() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        const tl = gsap.timeline({ delay: 0.4, defaults: { ease: EASE.out } });

        tl.fromTo(q(".js-portrait"), { opacity: 0 }, { opacity: 1, duration: 1 }, 0)
            .fromTo(q(".js-role"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 }, 0.15)
            .fromTo(q(".js-tate"), { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.7 }, "<")
            .fromTo(
                q(".js-wordmark .js-mask-inner"),
                MASK_HIDDEN,
                { yPercent: 0, duration: 1.4, ease: EASE.io },
                "-=0.25"
            )
            .fromTo(q(".js-body"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7");

        // A quiet drift once the page starts scrolling — the wordmark and the
        // portrait move at different speeds so the frame has some depth.
        gsap
            .timeline({
                scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
            })
            .to(q(".js-wordmark"), { yPercent: -12, ease: "none" }, 0)
            .to(q(".js-portrait"), { yPercent: 6, ease: "none" }, 0);
    });

    return (
        <section
            ref={scope}
            className="relative flex min-h-[36rem] flex-col overflow-hidden bg-paper sm:min-h-[40rem] lg:min-h-[46rem]"
        >
            {/* Top row — who and where, and the vertical setting balancing it.
                z-20: stays in front of the portrait, which only needs to sit
                over the name below. */}
            <div className="shell relative z-20 mx-auto flex w-full max-w-shell items-start justify-center pt-[calc(var(--nav-h)+2rem)] lg:justify-between">
                <p className="js-role text-center font-mono uppercase tracking-[0.14em] text-[0.5625rem] text-ink-2 sm:text-label">
                    Web Developer
                    <span className="mx-2 text-ink-3">/</span>
                    Based in the Philippines
                </p>

                <span
                    aria-hidden="true"
                    className="js-tate tate hidden font-jp text-sm tracking-[0.4em] text-ink-3 lg:block"
                >
                    ウェブ制作
                </span>
            </div>

            {/* The portrait cut-out, scaled to fit entirely inside the
                section — it shrinks or grows to stay fully in frame, never
                cropped by the section's overflow-hidden. `object-contain`
                centres it, which happens to land the figure roughly over the
                name below.

                z-10: above the name (z-0) it overlaps, below every other row
                (z-20) so only KEAN sits behind it. */}
            <div
                data-anim="fade"
                aria-hidden="true"
                className="js-portrait pointer-events-none absolute inset-0 z-10 drop-shadow-[0_25px_45px_rgba(0,0,0,0.35)]"
            >
                <PrismDrift
                    src="/images/kean hero.png"
                    priority
                    sizes="100vw"
                    className="object-contain"
                />
            </div>

            {/* Centre — the name, the whole point of the frame. z-0: the only
                row the portrait sits in front of. */}
            <div className="relative z-0 flex flex-1 items-center justify-center px-[var(--gutter)] py-8 lg:pl-[calc(var(--rail)+var(--gutter))]">
                <h1
                    className="js-wordmark translate-y-4 select-none text-center font-display font-extrabold leading-[0.82] tracking-[-0.05em] text-white text-[clamp(6.5rem,34vw,9.5rem)] sm:text-[clamp(4.5rem,29vw,26rem)] lg:-translate-y-10"
                >
                    <MaskLine>KEAN</MaskLine>
                </h1>
            </div>

            {/* Bottom row — the pitch and the doors out. z-20: see the top
                row above. */}
            <div className="shell relative z-20 mx-auto flex w-full max-w-shell justify-end pb-10 md:pb-14 lg:justify-between">
                {/* Bottom-left, desktop only — the mobile/tablet layout keeps
                    this text beside the pitch on the right (below). */}
                <div className="js-body hidden text-left lg:block">
                    <p className="font-jp text-xl leading-relaxed text-ink">和風</p>
                    <p className="mt-1.5 font-mono text-label uppercase tracking-[0.14em] text-ink-3">
                        Japan style portfolio
                    </p>
                </div>

                {/* Full-bleed on tablet so 和風 and ウェブ制作 reach the two
                    gutters; back to a narrow right-aligned column on desktop,
                    where the pitch text moves to the block above. */}
                <div className="js-body w-full lg:w-auto lg:max-w-sm lg:text-right">
                    {/* On mobile/tablet, "ウェブ制作" sits beside the pitch
                        text rather than in the top row — bottom-aligned so
                        the two share a baseline, with the vertical run
                        naturally taller than the two short lines beside it,
                        so its top rises above theirs without extra math.
                        `lg:hidden` drops this once the new bottom-left block
                        (above) takes over on desktop. */}
                    <div className="flex items-end justify-between lg:hidden">
                        <div>
                            <p className="font-jp text-xl leading-relaxed text-ink">
                                和風
                            </p>
                            <p className="mt-1.5 font-mono text-label uppercase tracking-[0.14em] text-ink-3">
                                Japan style portfolio
                            </p>
                        </div>
                        <span
                            aria-hidden="true"
                            className="tate lg:hidden font-jp text-sm tracking-[0.4em] text-ink-3"
                        >
                            ウェブ制作
                        </span>
                    </div>

                    {/* Blur only — no fill, no border. It keeps the buttons
                        clear of the portrait on small screens without
                        drawing an edge. */}
                    <div className="mt-5 flex flex-col items-stretch gap-4 rounded-xl p-5 backdrop-blur-sm sm:gap-5 sm:p-6 md:flex-row md:items-center md:justify-center lg:justify-end">
                        <Link
                            href="/projects"
                            className="group inline-flex w-full items-center justify-center gap-2.5 rounded border border-accent bg-accent px-4 py-2.5 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-accent md:w-auto md:justify-start"
                        >
                            See the work
                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                →
                            </span>
                        </Link>
                        <Link
                            href="/contact"
                            className="link-rule w-full px-4 py-2.5 text-center font-mono text-label uppercase text-ink md:w-auto"
                        >
                            Start a project
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
