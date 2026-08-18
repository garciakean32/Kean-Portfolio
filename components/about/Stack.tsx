"use client";

import SectionMark from "@/components/shared/SectionMark";
import ImageBand from "@/components/shared/ImageBand";
import { MaskLine, MaskWords } from "@/components/motion/Text";
import { skills } from "@/lib/data";
import { cn } from "@/lib/utils";
import { drawRule, fadeUp, gsap, riseMasks, useGsap } from "@/lib/motion";

const JP = "font-jp text-sm font-medium tracking-[0.3em] text-ink-3";

/**
 * Tools, set as an index rather than a wall of badges.
 *
 * The heading holds still on the left while the three shelves pass it on the
 * right — the one place on the page where something stays put, which is the
 * point: the list changes, the reason for reaching does not. A full-bleed
 * photograph opens the section so the reading has somewhere to breathe before
 * it starts, and the close is the last large thing on the page.
 */
export default function Stack() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        const head = q(".js-head")[0];
        riseMasks(q(".js-head-line .js-mask-inner"), { trigger: head, start: "top 80%", stagger: 0.09 });
        fadeUp(q(".js-head-copy"), { trigger: head, start: "top 82%", stagger: 0.12 });

        q(".js-group").forEach((group) => {
            const m = gsap.utils.selector(group);
            drawRule(m(".js-group-rule"), { trigger: group, start: "top 88%" });
            fadeUp(m(".js-group-in"), { trigger: group, start: "top 84%", stagger: 0.12 });
        });

        /* Each tool arrives on its own line rather than on its group's — the
           shelves are far too tall now for one trigger to cover, and a stagger
           from the top would finish long before the last rows are on screen. */
        q(".js-tool").forEach((tool) => fadeUp(tool, { trigger: tool, start: "top 92%", y: 18 }));

        const close = q(".js-close")[0];
        drawRule(q(".js-close-rule"), { trigger: close, start: "top 78%", axis: "y" });
        riseMasks(q(".js-close .js-mask-inner"), { trigger: close, start: "top 74%", stagger: 0.035 });
        fadeUp(q(".js-close-meta"), { trigger: close, start: "top 72%", stagger: 0.1 });
    });

    return (
        <section ref={scope}>
            <ImageBand
                src="/images/gray tatami mat.png"
                alt=""
                caption="Everything laid out where it can be found"
                height="h-[46svh] min-h-[16rem] md:h-[72svh]"
            />

            <div className="shell mx-auto max-w-shell py-24 md:py-36">
                <div className="grid gap-16 lg:grid-cols-12 lg:gap-x-10">
                    {/* The heading holds while the shelves pass it */}
                    <div className="js-head lg:col-span-4 lg:sticky lg:top-[calc(var(--nav-h)+3rem)] lg:self-start">
                        <SectionMark as="h2" index="iv" label="Tools I reach for" />

                        <p className="js-head-line mt-10 font-display text-d3 font-bold tracking-[-0.035em] text-ink md:mt-14">
                            <MaskLine>Three</MaskLine>
                            <MaskLine className="font-serif font-normal italic text-ink-2">
                                shelves.
                            </MaskLine>
                        </p>

                        <p className="js-head-copy mt-8 max-w-measure text-body text-ink-2">
                            Nothing exotic, and nothing here for the sake of the list.
                            These are the ones I have actually shipped with, kept
                            because they hold up on the next project too.
                        </p>

                        <span className={cn("js-head-copy mt-10 block", JP)}>道具</span>
                    </div>

                    {/* The shelves */}
                    <div className="lg:col-span-7 lg:col-start-6">
                        {skills.map((group, i) => (
                            <div key={group.category} className="js-group pb-12 pt-12 first:pt-0 md:pb-16 md:pt-16">
                                <span
                                    aria-hidden="true"
                                    data-anim="rule-x"
                                    className="js-group-rule block h-px w-full origin-left bg-rule"
                                />

                                <div className="js-group-in mt-8 flex flex-wrap items-baseline justify-between gap-4 md:mt-10">
                                    <div className="flex items-baseline gap-5">
                                        <span className="font-mono text-label text-accent">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <h3 className="font-display text-d2 font-medium tracking-[-0.025em] text-ink">
                                            {group.category}
                                        </h3>
                                    </div>
                                    <span className={JP}>{group.jp}</span>
                                </div>

                                <p className="js-group-in mt-6 max-w-measure font-serif text-lead text-ink-2">
                                    {group.summary}
                                </p>

                                {/* Name on the left, what it does on the right —
                                    an index of decisions rather than a badge wall. */}
                                <ul className="mt-10 md:mt-12">
                                    {group.items.map((item) => (
                                        <li
                                            key={item.name}
                                            className="js-tool grid gap-2 border-b border-rule py-6 md:grid-cols-[minmax(0,12rem)_1fr] md:gap-10"
                                        >
                                            <span className="font-display text-d1 font-medium tracking-[-0.02em] text-ink">
                                                {item.name}
                                            </span>
                                            <span className="max-w-measure text-body text-ink-2">
                                                {item.note}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* The close — the last large thing on the page */}
                <div className="js-close mt-28 flex flex-col items-center text-center md:mt-44">
                    <span
                        aria-hidden="true"
                        data-anim="rule-y"
                        className="js-close-rule h-[8vh] w-px origin-top bg-rule-strong"
                    />

                    <p className="js-close-meta mt-10 font-mono text-label uppercase text-ink-3">
                        What actually carries over
                    </p>

                    <p className="mt-10 max-w-4xl font-serif text-d2 leading-tight text-ink">
                        <MaskWords text="Tools change every couple of years. Knowing why you reached for one is the part that carries over." />
                    </p>
                </div>
            </div>
        </section>
    );
}
