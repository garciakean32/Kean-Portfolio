"use client";

import Image from "next/image";
import SectionMark from "@/components/shared/SectionMark";
import { MaskLine, MaskWords } from "@/components/motion/Text";
import { journey, sideProjects } from "@/lib/data";
import { cn } from "@/lib/utils";
import { drawRule, EASE, fadeUp, gsap, riseMasks, useGsap } from "@/lib/motion";

/**
 * The Japanese here is set solid and small, running down the side of the
 * chapter it marks — deliberately not the outlined marks the "for you" spread
 * uses, so the two sections never read as the same device twice.
 */
const JP = "font-jp text-sm font-medium tracking-[0.3em] text-ink-3";
const JP_TATE = "lg:[writing-mode:vertical-rl] lg:[text-orientation:upright]";

/**
 * Where the chapters' pictures go. This is layout, not fact, so it lives
 * beside the markup rather than in `lib/data` — and it cycles by index, so a
 * fourth step added later still lands in an arrangement.
 */
const CHAPTERS = [
    {
        layout: "right" as const,
        src: "/images/gray mountain.jpg",
        ratio: "aspect-[3/4]",
        caption: "Long before any of it had a name",
    },
    {
        layout: "left" as const,
        src: "/images/tori gate.png",
        ratio: "aspect-[1715/917]",
        caption: "A gate you only recognise from the other side",
    },
    { layout: "center" as const },
];

/** Where each experience row sits on the twelve columns — no two the same. */
const ROWS = [
    { block: "lg:col-span-5 lg:col-start-1", body: "lg:col-span-4 lg:col-start-8" },
    { block: "lg:col-span-5 lg:col-start-4", body: "lg:col-span-3 lg:col-start-10" },
    { block: "lg:col-span-5 lg:col-start-2", body: "lg:col-span-4 lg:col-start-8" },
];

/**
 * How I got here, then what I have actually done.
 *
 * The timeline is gone: the three turns are set as chapters instead, each one
 * arranged differently — text leading with a tall picture held back, a wide
 * picture leading with the copy dropped beside it, then a centred statement
 * with nothing around it at all. Type runs from `d3` down to a mono label so
 * the eye has somewhere to go, and the numbering stays where it was: small,
 * quiet, in the margin.
 */
export default function Journey() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        /* The head — statement first, the paragraph beside it after. */
        const head = q(".js-head")[0];
        riseMasks(q(".js-statement .js-mask-inner"), { trigger: head, start: "top 74%", stagger: 0.09 });
        fadeUp(q(".js-head-aside"), { trigger: head, start: "top 76%", stagger: 0.12 });

        /* Each chapter reads on its own trigger, so the section can be as long
           as it likes without the reveals firing together. */
        q(".js-chapter").forEach((chapter) => {
            const m = gsap.utils.selector(chapter);
            fadeUp(m(".js-mark"), { trigger: chapter, start: "top 82%" });
            drawRule(m(".js-mark-rule"), { trigger: chapter, start: "top 82%", axis: "y" });
            riseMasks(m(".js-title .js-mask-inner"), { trigger: chapter, start: "top 78%", stagger: 0.08 });
            fadeUp(m(".js-copy"), { trigger: chapter, start: "top 74%", stagger: 0.12 });
        });

        /* The plate between the chapters and the work. */
        const plate = q(".js-plate")[0];
        riseMasks(q(".js-plate-line .js-mask-inner"), { trigger: plate, start: "top 76%", stagger: 0.1 });
        fadeUp(q(".js-plate-copy"), { trigger: plate, start: "top 78%", stagger: 0.12 });

        /* Experience — head, then one row at a time. */
        const exp = q(".js-experience")[0];
        riseMasks(q(".js-exp-line .js-mask-inner"), { trigger: exp, start: "top 76%", stagger: 0.09 });
        fadeUp(q(".js-exp-aside"), { trigger: exp, start: "top 78%", stagger: 0.1 });

        q(".js-row").forEach((row) => {
            const m = gsap.utils.selector(row);
            drawRule(m(".js-row-rule"), { trigger: row, start: "top 86%" });
            fadeUp(m(".js-row-in"), { trigger: row, start: "top 82%", stagger: 0.12 });
        });

        /* Photographs — uncovered from alternating edges, drifting inside
           their frames for as long as they are on screen. */
        q(".js-figure").forEach((figure, i) => {
            gsap.fromTo(
                figure,
                { clipPath: i % 2 === 0 ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" },
                {
                    clipPath: "inset(0% 0 0% 0)",
                    duration: 1.4,
                    ease: EASE.io,
                    scrollTrigger: { trigger: figure, start: "top 86%" },
                }
            );

            gsap.fromTo(
                figure.querySelector("img"),
                { yPercent: -6 },
                {
                    yPercent: 6,
                    ease: "none",
                    scrollTrigger: { trigger: figure, start: "top bottom", end: "bottom top", scrub: 0.8 },
                }
            );
        });
    });

    return (
        <section ref={scope} className="py-24 md:py-36">
            {/* ---------------------------------------------------------- */}
            {/* Head                                                        */}
            {/* ---------------------------------------------------------- */}
            <header className="js-head shell mx-auto max-w-shell">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <SectionMark as="h2" index="ii" label="How I got here" />
                    <span className={cn("js-head-aside", JP)}>道のり</span>
                </div>

                <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-x-10">
                    <p className="js-statement font-display text-d3 font-bold tracking-[-0.035em] text-ink lg:col-span-7">
                        <MaskLine>It started with</MaskLine>
                        <MaskLine className="font-serif font-normal italic text-ink-2">
                            a computer,
                        </MaskLine>
                        <MaskLine className="pl-[10%]">not with code.</MaskLine>
                    </p>

                    <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
                        <p className="js-head-aside font-mono text-label uppercase text-ink-3">
                            Three turns
                        </p>
                        <p className="js-head-aside mt-6 max-w-measure text-body text-ink-2">
                            {journey.intro}
                        </p>
                    </div>
                </div>
            </header>

            {/* ---------------------------------------------------------- */}
            {/* The chapters                                                */}
            {/* ---------------------------------------------------------- */}
            <div className="mt-28 space-y-28 md:mt-44 md:space-y-44">
                {journey.steps.map((step, i) => (
                    <Chapter
                        key={step.title}
                        step={step}
                        index={i + 1}
                        art={CHAPTERS[i % CHAPTERS.length]}
                    />
                ))}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Plate — the quiet beat before the work                      */}
            {/* ---------------------------------------------------------- */}
            <div className="js-plate shell mx-auto mt-28 max-w-shell md:mt-44">
                <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-x-10">
                    <div className="lg:col-span-6">
                        <p className="js-plate-copy font-mono text-label uppercase text-ink-3">
                            The through line
                        </p>
                        <p className="js-plate-line mt-8 font-serif text-d2 leading-tight text-ink">
                            <MaskWords text="The course gave it a name. The interest was already there." />
                        </p>
                        <p className="js-plate-copy mt-8 max-w-measure text-body text-ink-2">
                            Everything after this point is the same habit pointed
                            somewhere more useful — sitting with something until it
                            behaves, except now the thing opens in a browser.
                        </p>
                    </div>

                    <figure className="lg:col-span-4 lg:col-start-9">
                        <div className="js-figure relative aspect-[736/1000] w-full overflow-hidden rounded-md bg-paper-3">
                            <Image
                                src="/images/gray fuji.jpg"
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 30vw, 100vw"
                                className="scale-110 object-cover"
                            />
                        </div>
                        <figcaption className="js-plate-copy mt-4 font-mono text-label uppercase text-ink-3">
                            Same climb, better shoes
                        </figcaption>
                    </figure>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Experience                                                  */}
            {/* ---------------------------------------------------------- */}
            <div className="js-experience shell mx-auto mt-32 max-w-shell md:mt-52">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <SectionMark as="h2" index="iii" label="Experience" />
                    <span className={cn("js-exp-aside", JP)}>経験</span>
                </div>

                <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center md:mt-24">
                    <p className="js-exp-line text-center font-display text-d2 font-bold tracking-[-0.03em] text-ink">
                        <MaskLine>Where my experience</MaskLine>
                        <MaskLine className="font-serif font-normal italic text-ink-2">
                            actually began.
                        </MaskLine>
                    </p>
                    <p className="js-exp-aside mt-8 w-full text-left text-body text-ink-2">
                        {sideProjects.intro}
                    </p>
                </div>

                <ul className="mt-20 md:mt-28">
                    {sideProjects.highlights.map((item, i) => {
                        const row = ROWS[i % ROWS.length];
                        return (
                            <li key={item.title} className="js-row pt-12 md:pt-16">
                                <span
                                    aria-hidden="true"
                                    data-anim="rule-x"
                                    className="js-row-rule block h-px w-full origin-left bg-rule"
                                />

                                <div className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-12 lg:gap-x-10">
                                    <div className={row.block}>
                                        <div className="js-row-in flex items-baseline gap-5">
                                            <span className="font-mono text-label uppercase text-accent">
                                                {item.label}
                                            </span>
                                            <span className={JP}>{item.jp}</span>
                                        </div>
                                        <h3 className="js-row-in mt-6 font-display text-d2 font-medium tracking-[-0.025em] text-ink">
                                            {item.title}
                                        </h3>
                                    </div>

                                    <p
                                        className={cn(
                                            "js-row-in max-w-measure text-lead text-ink-2 lg:self-end",
                                            row.body
                                        )}
                                    >
                                        {item.description}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <p className="js-exp-aside mx-auto mt-20 max-w-measure text-center font-mono text-meta leading-relaxed text-ink-3 md:mt-28">
                    {sideProjects.note}
                </p>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------
   One turn, set as a chapter

   Three arrangements: the picture held back on the right, the picture
   leading wide from the left, then nothing but the sentence.
   ------------------------------------------------------------------ */

type Step = (typeof journey.steps)[number];
type Art = (typeof CHAPTERS)[number];

function Chapter({ step, index, art }: { step: Step; index: number; art: Art }) {
    const marker = (
        <Marker index={index} jp={step.jp} rule={art.layout === "right"} />
    );

    if (art.layout === "center") {
        return (
            <article className="js-chapter shell mx-auto max-w-shell">
                <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                    {marker}
                    <h3 className="js-title mt-10 font-display text-d3 font-bold tracking-[-0.035em] text-ink">
                        <MaskLine>{step.title}</MaskLine>
                    </h3>
                    <p className="js-copy mt-10 max-w-measure text-lead text-ink-2">
                        {step.description}
                    </p>
                </div>
            </article>
        );
    }

    if (art.layout === "left") {
        return (
            <article className="js-chapter shell mx-auto max-w-shell">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
                    <figure className="order-2 lg:order-1 lg:col-span-8 lg:row-start-1">
                        <div
                            className={cn(
                                "js-figure relative w-full overflow-hidden rounded-md bg-paper-3",
                                art.ratio
                            )}
                        >
                            <Image
                                src={art.src}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 64vw, 100vw"
                                className="scale-110 object-cover"
                            />
                        </div>
                        <figcaption className="js-copy mt-4 font-mono text-label uppercase text-ink-3">
                            {art.caption}
                        </figcaption>
                    </figure>

                    <div className="order-1 lg:order-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:pt-20">
                        {marker}
                        <h3 className="js-title mt-8 font-display text-d2 font-medium tracking-[-0.025em] text-ink">
                            <MaskLine>{step.title}</MaskLine>
                        </h3>
                        <p className="js-copy mt-7 max-w-measure text-body text-ink-2">
                            {step.description}
                        </p>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="js-chapter shell mx-auto max-w-shell">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-8">
                <div className="lg:col-span-1 lg:row-start-1 lg:self-start">{marker}</div>

                <div className="lg:col-span-5 lg:col-start-2 lg:row-start-1">
                    <h3 className="js-title font-display text-d2 font-medium tracking-[-0.025em] text-ink">
                        <MaskLine>{step.title}</MaskLine>
                    </h3>
                    <p className="js-copy mt-7 max-w-measure text-body text-ink-2">
                        {step.description}
                    </p>
                </div>

                <figure className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
                    <div
                        className={cn(
                            "js-figure relative w-full overflow-hidden rounded-md bg-paper-3",
                            art.ratio
                        )}
                    >
                        <Image
                            src={art.src}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 36vw, 100vw"
                            className="scale-110 object-cover"
                        />
                    </div>
                    <figcaption className="js-copy mt-4 font-mono text-label uppercase text-ink-3">
                        {art.caption}
                    </figcaption>
                </figure>
            </div>
        </article>
    );
}

/**
 * The chapter's number and mark. Deliberately small — the numbering is a
 * margin note, not a graphic — with the Japanese turning upright and a
 * hairline dropping beneath it once there is a column to drop into.
 */
function Marker({ index, jp, rule }: { index: number; jp: string; rule: boolean }) {
    return (
        <div
            className={cn(
                "js-mark flex items-center gap-5",
                rule && "lg:h-full lg:flex-col lg:items-start lg:gap-6"
            )}
        >
            <span className="font-mono text-label text-accent">
                {String(index).padStart(2, "0")}
            </span>
            <span className={cn(JP, rule && JP_TATE)}>{jp}</span>
            {rule && (
                <span
                    aria-hidden="true"
                    data-anim="rule-y"
                    className="js-mark-rule hidden w-px flex-1 origin-top bg-rule lg:block"
                />
            )}
        </div>
    );
}
