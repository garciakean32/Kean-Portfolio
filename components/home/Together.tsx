"use client";

import SectionMark from "@/components/shared/SectionMark";
import { MaskWords } from "@/components/motion/Text";
import { principles } from "@/lib/data";
import { fadeUp, gsap, parallax, riseMasks, useGsap } from "@/lib/motion";

/**
 * "How it goes" — the last block of the page's light region, reached by
 * scrolling on from the horizontal work rather than by any transition of its
 * own. `SlideOver` sets it drifting against the scroll once the close starts
 * climbing over it, but that is the seam's business and only touches its last
 * viewport. Ordinary section, ordinary reveals: the statement assembles word by
 * word as it comes into view, a rule draws down the margin as you read, and
 * the principles arrive from alternating sides.
 */
export default function Together() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        riseMasks(q(".js-statement .js-mask-inner"), {
            trigger: el,
            start: "top 85%",
            stagger: 0.04,
        });

        // Tied to scroll position rather than a one-shot trigger, so it reads
        // as a measure being drawn while you read.
        gsap.fromTo(
            q(".js-spine"),
            { scaleY: 0 },
            {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: q(".js-list")[0],
                    start: "top 80%",
                    end: "bottom 80%",
                    scrub: 0.6,
                },
            }
        );

        q(".js-principle").forEach((item, i) => {
            const p = gsap.utils.selector(item);

            gsap.fromTo(
                item,
                { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1.1,
                    ease: "power4.out",
                    scrollTrigger: { trigger: item, start: "top 85%" },
                }
            );

            // The oversized ordinal drifts against the reading, the same
            // device the "for you" section uses to give a long scroll depth.
            const ordinal = p(".js-ordinal")[0];
            if (ordinal) parallax(ordinal, { trigger: item, distance: 70, scrub: 1 });
        });

        fadeUp(q(".js-coda"), { trigger: q(".js-coda")[0], start: "top 85%", stagger: 0.12 });
    });

    return (
        <section ref={scope} className="relative pb-[30vh] pt-[14vh] md:pb-[38vh] md:pt-[18vh]">
            <div className="shell mx-auto max-w-shell">
                <SectionMark as="h2" index="04" label="How it goes" />

                <p className="js-statement mt-12 max-w-5xl font-display text-d2 font-semibold tracking-[-0.03em] text-ink md:mt-16">
                    <MaskWords text="Start with the problem." />{" "}
                    <span className="text-ink-3">
                        <MaskWords text="Ship something that works." />
                    </span>{" "}
                    <span className="font-serif font-normal italic">
                        <MaskWords text="Then make it better." />
                    </span>
                </p>

                <div className="js-list relative mt-[12vh] md:mt-[16vh]">
                    <span
                        aria-hidden="true"
                        className="js-spine absolute left-0 top-0 hidden h-full w-px origin-top rounded-full bg-rule-strong md:block"
                    />

                    {/* One principle per band, alternating which side leads, so
                        the three read as three stops rather than three rows. */}
                    <ul className="grid gap-[14vh] md:gap-[18vh] md:pl-16">
                        {principles.map((principle, i) => (
                            <li
                                key={principle.title}
                                className="js-principle grid gap-6 md:grid-cols-12 md:items-start md:gap-10"
                            >
                                <span
                                    aria-hidden="true"
                                    className="js-ordinal font-display text-d3 font-extrabold leading-none text-ink/[0.07] md:col-span-3 md:row-start-1"
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>

                                <div
                                    className={
                                        i % 2 === 0
                                            ? "md:col-span-8 md:col-start-4 md:row-start-1"
                                            : "md:col-span-8 md:col-start-5 md:row-start-1"
                                    }
                                >
                                    <h3 className="max-w-3xl font-display text-d2 font-semibold tracking-[-0.025em] text-ink">
                                        {principle.title}
                                    </h3>
                                    <p className="mt-6 max-w-measure text-body text-ink-2">
                                        {principle.body}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* A closing beat, so the section lands rather than stopping */}
                <div className="mt-[16vh] md:mt-[22vh]">
                    <span
                        aria-hidden="true"
                        className="js-coda block h-px w-full bg-rule"
                    />
                    <p className="js-coda mt-10 max-w-3xl font-serif text-d1 italic leading-snug text-ink-2">
                        Every project above was built to that order — and the next one
                        would be too.
                    </p>
                </div>
            </div>
        </section>
    );
}
