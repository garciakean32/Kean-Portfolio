"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaskLine } from "@/components/motion/Text";
import { capabilities } from "@/lib/data";
import { cn } from "@/lib/utils";
import { drawRule, EASE, fadeUp, gsap, parallax, riseMasks, useGsap } from "@/lib/motion";

const STAGES = [
    { jp: "設計", en: "Scope" },
    { jp: "構築", en: "Build" },
    { jp: "公開", en: "Ship" },
];

/** Quiet type — the section's one graphic device, used for every Japanese mark. */
const OUTLINE = "font-jp font-medium leading-none text-ink/20";

/**
 * The opening line above each answer. Deliberately the quietest thing in the
 * spread — a step below the mono label size and in the faintest ink, so it
 * introduces the answer without competing with it.
 */
const KICKER =
    "font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3";

/**
 * "What can I do for you?" — a poster, not a list.
 *
 * The six answers run as six movements rather than rows in a panel, and no two
 * consecutive ones are set the same way: the layout cycles through leading from
 * the left, stacking wide, and leading from the right, so the page never falls
 * into a single column of identical spreads.
 *
 * Indices are set as Japanese marks in outline rather than numerals — drawn
 * from the same vocabulary as the marquee, so no new glyphs are needed in the
 * subset the root layout requests.
 *
 * Nothing here competes with the heading: the section title is the only `d4` on
 * the page, and every answer below it is set a full step down at `d2`.
 *
 * This section is `RevealUnder`'s cover: the light region waits behind it and
 * this whole thing scrolls away upwards to uncover it, from the instant its
 * bottom edge reaches the bottom of the viewport to the instant it clears the
 * top — whatever those edges happen to line up with. So the very last thing
 * in the section (`.js-last`) is a fixed one viewport tall and holds nothing
 * but a quiet closing mark: it is the screen the seam is peeled off. The
 * richer CTA above it (`.js-close`) is free to run as long as it wants
 * without being dragged into that, since it is content, not the last screen.
 */
export default function Capabilities() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        /* Masthead */
        riseMasks(q(".js-head .js-mask-inner"), { trigger: el, start: "top 80%", stagger: 0.1 });
        fadeUp(q(".js-head-meta"), { trigger: el, start: "top 78%", stagger: 0.1 });

        /* Movements — each one triggers off itself, so the section can be as
           long as it likes without the reveals firing all at once. */
        q(".js-move").forEach((move) => {
            const m = gsap.utils.selector(move);

            // Reading order, not source order: the mark and the detail arrive
            // first, then the big answer, then the rule closes it.
            fadeUp(m(".js-aside"), { trigger: move, start: "top 78%", stagger: 0.12 });
            riseMasks(m(".js-lead .js-mask-inner"), {
                trigger: move,
                start: "top 74%",
                stagger: 0.1,
            });
            drawRule(m(".js-rule"), { trigger: move, start: "top 70%" });

            const mark = m(".js-mark")[0];
            if (!mark) return;

            gsap.fromTo(
                mark,
                { opacity: 0, scale: 1.18 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 1.3,
                    ease: EASE.out,
                    scrollTrigger: { trigger: move, start: "top 82%" },
                }
            );
            // A short drift only: the mark sits in flow now, so it reads as
            // part of the spread rather than a layer floating behind it.
            parallax(mark, { trigger: move, distance: 60, scrub: 1 });
        });

        /* The plate between 02 and 03 — its own trigger, since it sits between
           two movements rather than inside one. */
        fadeUp(q(".js-plate .js-aside"), {
            trigger: q(".js-plate")[0],
            start: "top 72%",
            stagger: 0.12,
        });

        /* Photographs — uncovered from one edge, then travelling inside their
           own frames for as long as they are on screen. */
        q(".js-figure").forEach((figure, i) => {
            gsap.fromTo(
                figure,
                { clipPath: i % 2 === 0 ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)" },
                {
                    clipPath: "inset(0% 0 0% 0)",
                    duration: 1.4,
                    ease: EASE.io,
                    scrollTrigger: { trigger: figure, start: "top 85%" },
                }
            );

            gsap.fromTo(
                figure.querySelector("img"),
                { yPercent: -6 },
                {
                    yPercent: 6,
                    ease: "none",
                    scrollTrigger: {
                        trigger: figure,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 0.8,
                    },
                }
            );
        });

        /* The wave plate — an in-flow figure, so its image rides the standard
           clip-uncover and drift from the `.js-figure` loop above. */
        const wave = q(".js-wave")[0];
        riseMasks(q(".js-wave .js-mask-inner"), { trigger: wave, start: "top 78%", stagger: 0.12 });
        fadeUp(q(".js-wave-meta"), { trigger: wave, start: "top 80%", stagger: 0.1 });

        /* The close. Triggered off the content rather than the block it sits
           in, which starts a fifth of a viewport higher. */
        const closeCopy = q(".js-close-copy")[0];
        riseMasks(q(".js-close .js-mask-inner"), {
            trigger: closeCopy,
            start: "top 82%",
            stagger: 0.12,
        });
        fadeUp(q(".js-close-meta"), { trigger: closeCopy, start: "top 84%", stagger: 0.1 });
        gsap.fromTo(
            q(".js-square"),
            { scale: 0.5, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: "back.out(2)",
                stagger: 0.1,
                scrollTrigger: { trigger: q(".js-squares")[0], start: "top 90%" },
            }
        );

        /* The last screen — arrives late on purpose, since the reveal begins
           the moment it has finished filling the screen. */
        const last = q(".js-last")[0];
        drawRule(q(".js-last-rule"), { trigger: last, start: "top 70%", axis: "y" });
        fadeUp(q(".js-last-in"), { trigger: last, start: "top 62%", stagger: 0.15 });
    });

    return (
        <section
            ref={scope}
            className="relative overflow-hidden bg-gradient-to-b from-paper to-paper-3"
        >
            {/* ---------------------------------------------------------- */}
            {/* Masthead — the only `d4` in the section                     */}
            {/* ---------------------------------------------------------- */}
            <header className="js-head shell relative mx-auto max-w-shell pt-24 md:pt-32">
                <div className="flex items-center justify-between gap-6">
                    {/* The section's mark, where the index used to be */}
                    <div className="flex items-center gap-4">
                        <span className="font-jp text-sm font-medium tracking-[0.2em] text-accent">
                            仕事
                        </span>
                        <span aria-hidden="true" className="h-px w-10 bg-rule-strong" />
                        <span className="font-mono text-label uppercase text-ink-3">For you</span>
                    </div>
                    <span className="js-head-meta font-mono text-label uppercase text-ink-3">
                        Where to start
                    </span>
                </div>

                <h2 className="mt-14 font-display text-d4 font-bold tracking-[-0.035em] text-ink md:mt-20">
                    <MaskLine>What can I do</MaskLine>
                    <MaskLine className="pl-[8%] font-serif font-normal italic text-ink-2 sm:pl-[18%]">
                        for you?
                    </MaskLine>
                </h2>

                <div className="js-head-meta mt-12 flex md:justify-end">
                    <p className="max-w-measure text-body text-ink-2 md:text-right">
                        Describe your desired website rather than what it is
                        built with. Most projects turn out to be some combination of
                        the answers below.
                    </p>
                </div>
            </header>

            {/* ---------------------------------------------------------- */}
            {/* 01 — 02                                                     */}
            {/* ---------------------------------------------------------- */}
            {capabilities.slice(0, 2).map((item) => (
                <Movement key={item.index} item={item} />
            ))}

            {/* Plate — blossom, and the thing the picture stands in for */}
            <div className="js-plate shell relative mx-auto max-w-shell py-[6vh] md:py-[10vh]">
                <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-12">
                    <figure className="lg:col-span-5 lg:row-start-1">
                        <div className="js-figure relative aspect-[3/4] w-full overflow-hidden rounded-md bg-paper-2 sm:aspect-[4/5] lg:aspect-[3/4]">
                            <Image
                                src="/images/gray branch.jpg"
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 38vw, 100vw"
                                className="scale-[1.18] object-cover"
                            />
                        </div>
                        <figcaption className="js-aside mt-4 font-mono text-label uppercase text-ink-3">
                            Some things take a season
                        </figcaption>
                    </figure>

                    <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
                        <p className={cn("js-aside", KICKER)}>How the work goes</p>
                        <p className="js-aside mt-7 font-serif text-d1 leading-snug text-ink">
                            Most of the work is decisions, not typing.
                        </p>
                        <p className="js-aside mt-7 max-w-measure text-body text-ink-2">
                            What goes on the page, what happens when someone taps the
                            button, and what should happen when they tap it twice. The
                            typing is the quick part — the deciding is what makes a site
                            feel built for you rather than assembled from a template.
                        </p>
                    </div>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 03                                                          */}
            {/* ---------------------------------------------------------- */}
            <Movement item={capabilities[2]} />

            {/* Wave plate — centred, and sized generously. The frame keeps the
                picture's own 1715×917 ratio and stops short of its native
                width, so it is never upscaled and never distorted. */}
            <div className="js-wave shell relative mx-auto max-w-shell py-[6vh] text-center md:py-[10vh]">
                <p className="js-wave-meta font-mono text-label uppercase text-ink-2">
                    Front to back
                </p>
                <p className="mx-auto mt-6 max-w-3xl font-display text-d2 font-bold tracking-[-0.03em] text-ink">
                    <MaskLine>Everything above the surface</MaskLine>
                    <MaskLine className="font-serif font-normal italic text-ink-2">
                        rests on everything below it.
                    </MaskLine>
                </p>

                <figure className="js-figure relative mx-auto mt-10 aspect-[1715/917] w-full max-w-6xl overflow-hidden rounded-md bg-paper-2 md:mt-14">
                    <Image
                        src="/images/gray wave.png"
                        alt=""
                        fill
                        sizes="(min-width: 1536px) 72rem, 100vw"
                        className="object-cover object-center"
                    />
                </figure>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 04 — 06                                                     */}
            {/* ---------------------------------------------------------- */}
            {capabilities.slice(3).map((item) => (
                <Movement key={item.index} item={item} />
            ))}

            {/* ---------------------------------------------------------- */}
            {/* The close — free to be as tall as it wants. The reveal is  */}
            {/* keyed to the *section's* bottom edge, not this block's, so  */}
            {/* growing this never has to be weighed against the fixed-     */}
            {/* height beat below that the seam actually plays against.     */}
            {/* ---------------------------------------------------------- */}
            <div className="js-close relative pb-[6vh] pt-[8vh] md:pb-[9vh] md:pt-[12vh]">
                <div className="shell mx-auto w-full max-w-shell">
                    <div className="js-close-copy grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-8">
                        <div className="lg:col-span-7 lg:row-start-1">
                            <p className="js-close-meta font-mono text-label uppercase text-ink-3">
                                Something else in mind
                            </p>

                            <h3 className="mt-8 font-display text-d2 font-bold tracking-[-0.035em] text-ink">
                                <MaskLine>Tell me what</MaskLine>
                                <MaskLine className="pl-[10%] font-serif font-normal italic text-ink-2">
                                    you need built.
                                </MaskLine>
                            </h3>

                            <p className="js-close-meta mt-10 max-w-measure text-body text-ink-2">
                                Describe it the way you would describe it to a friend,
                                and I will tell you which of these it lines up with — or
                                map out something that fits it better.
                            </p>

                            <div className="js-squares mt-12 flex flex-wrap items-start gap-10 md:gap-14">
                                {STAGES.map((stage) => (
                                    <div
                                        key={stage.en}
                                        className="js-square flex flex-col items-center gap-3 text-center transition-transform duration-500 ease-out hover:-translate-y-1"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                "select-none text-[clamp(1.75rem,3.5vw,2.5rem)]",
                                                OUTLINE
                                            )}
                                        >
                                            {stage.jp}
                                        </span>
                                        <span className="font-mono text-label uppercase tracking-[0.2em] text-ink-3">
                                            {stage.en}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <figure className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
                            <div className="js-figure relative aspect-[4/5] w-full overflow-hidden rounded-md bg-paper-2 lg:aspect-[3/4]">
                                <Image
                                    src="/images/kean sakura.png"
                                    alt=""
                                    fill
                                    sizes="(min-width: 1024px) 30vw, 100vw"
                                    className="scale-[1.18] object-cover object-center"
                                />
                            </div>
                            <figcaption className="js-close-meta mt-4 font-mono text-label uppercase text-ink-3">
                                Away from the desk, still thinking about it
                            </figcaption>
                        </figure>
                    </div>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* The last screen — the one the reveal peels away.             */}
            {/*                                                              */}
            {/* Fixed at exactly one viewport and last in the section, so    */}
            {/* its bottom edge and the section's are the same point: the    */}
            {/* reveal always begins with this beat filling the screen top   */}
            {/* to bottom, no matter how much grows above it. Content sits   */}
            {/* toward the top rather than centred, so what goes first as    */}
            {/* the work is uncovered from the bottom up is empty room, not  */}
            {/* the invitation itself. */}
            {/* ---------------------------------------------------------- */}
            <div className="js-last relative flex h-[100svh] flex-col items-center overflow-hidden pt-[13vh] text-center md:pt-[17vh]">
                <span
                    aria-hidden="true"
                    data-anim="rule-y"
                    className="js-last-rule h-[10vh] w-px origin-top bg-rule-strong"
                />

                <p className="js-last-in mt-10 max-w-xl px-[var(--gutter)] font-serif text-d1 leading-snug text-ink">
                    Want a site built for you? Reach out and tell me what you have
                    in mind.
                </p>

                <div className="js-last-in mt-10">
                    <Link
                        href="/contact"
                        className="group inline-flex items-center gap-3 font-mono text-label uppercase text-ink"
                    >
                        <span className="link-rule">Get in touch</span>
                        <span className="transition-transform duration-500 ease-out group-hover:translate-x-1.5">
                            →
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------
   One answer, set as a spread

   Three arrangements, cycled by index so no two neighbours match: lead
   from the left, stack wide and centred, lead from the right.
   ------------------------------------------------------------------ */

type Arrangement = "left" | "stack" | "right";

function Movement({ item }: { item: (typeof capabilities)[number] }) {
    const order: Arrangement[] = ["left", "stack", "right"];
    const arrangement = order[(Number(item.index) - 1) % order.length];

    if (arrangement === "stack") return <StackedMovement item={item} />;

    const flip = arrangement === "right";

    return (
        <article className="js-move relative py-[9vh] md:py-[13vh]">
            <div className="shell relative mx-auto max-w-shell">
                <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-x-10">
                    {/* The answer */}
                    <div
                        className={cn(
                            "lg:col-span-8 lg:row-start-1",
                            flip ? "lg:col-start-5 lg:text-right" : "lg:col-start-1"
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center gap-5",
                                flip && "lg:justify-end"
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "js-mark select-none text-[clamp(1.75rem,4vw,3rem)]",
                                    OUTLINE
                                )}
                            >
                                {item.jp}
                            </span>
                        </div>

                        <p className={cn("js-aside mt-6", KICKER)}>{item.kicker}</p>

                        <h3 className="js-lead mt-5 font-display text-d2 font-bold tracking-[-0.03em] text-ink md:mt-7">
                            {item.lead.map((line, i) => (
                                <MaskLine
                                    key={line}
                                    className={cn(
                                        i > 0 && (flip ? "pr-[8%]" : "pl-[8%]"),
                                        i > 0 && "font-serif font-normal italic text-ink-2"
                                    )}
                                >
                                    <Words text={line} />
                                </MaskLine>
                            ))}
                        </h3>
                    </div>

                    {/* The detail, dropped to the opposite corner */}
                    <div
                        className={cn(
                            "js-aside lg:col-span-4 lg:row-start-1 lg:pb-2",
                            flip ? "lg:col-start-1" : "lg:col-start-9"
                        )}
                    >
                        <span
                            aria-hidden="true"
                            data-anim="rule-x"
                            className="js-rule block h-px w-full origin-left bg-rule-strong"
                        />
                        <p className="mt-7 font-serif text-lead leading-snug text-ink">
                            {item.title}
                        </p>
                        <p className="mt-5 max-w-measure text-body text-ink-2">{item.body}</p>
                        <p className="mt-7 font-mono text-meta uppercase text-ink-3">
                            {item.note}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}

/**
 * The middle arrangement: the answer centred and alone, with the detail split
 * into two narrow columns beneath it. Breaks the left/right rhythm so the six
 * never read as one repeated template.
 */
function StackedMovement({ item }: { item: (typeof capabilities)[number] }) {
    return (
        <article className="js-move relative py-[9vh] md:py-[13vh]">
            <div className="shell relative mx-auto max-w-shell">
                <div className="flex flex-col items-center text-center">
                    <span
                        aria-hidden="true"
                        className={cn(
                            "js-mark select-none text-[clamp(1.75rem,4vw,3rem)]",
                            OUTLINE
                        )}
                    >
                        {item.jp}
                    </span>

                    <p className={cn("js-aside mt-6", KICKER)}>{item.kicker}</p>

                    <h3 className="js-lead mt-5 max-w-4xl font-display text-d2 font-bold tracking-[-0.03em] text-ink md:mt-7">
                        {item.lead.map((line, i) => (
                            <MaskLine
                                key={line}
                                className={cn(
                                    i > 0 && "font-serif font-normal italic text-ink-2"
                                )}
                            >
                                <Words text={line} />
                            </MaskLine>
                        ))}
                    </h3>
                </div>

                <div className="mx-auto mt-14 max-w-4xl md:mt-20">
                    <span
                        aria-hidden="true"
                        data-anim="rule-x"
                        className="js-rule block h-px w-full origin-left bg-rule-strong"
                    />
                    <div className="js-aside mt-7 grid gap-8 md:grid-cols-2 md:gap-14">
                        <p className="font-serif text-lead leading-snug text-ink">
                            {item.title}
                        </p>
                        <div>
                            <p className="text-body text-ink-2">{item.body}</p>
                            <p className="mt-6 font-mono text-meta uppercase text-ink-3">
                                {item.note}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

/**
 * Words wrapped one at a time so the big lines lift very slightly under the
 * pointer. Spaces stay outside the spans so the line still wraps and selects as
 * a sentence, and the lift stays well inside the mask's vertical padding so
 * nothing clips. Movement only — the type never changes colour.
 */
function Words({ text }: { text: string }) {
    const words = text.split(" ").filter(Boolean);

    return (
        <>
            {words.map((word, i) => (
                <Fragment key={`${word}-${i}`}>
                    <span className="inline-block transition-transform duration-500 ease-out hover:-translate-y-1">
                        {word}
                    </span>
                    {i < words.length - 1 ? " " : null}
                </Fragment>
            ))}
        </>
    );
}
