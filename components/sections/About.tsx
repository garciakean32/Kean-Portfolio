"use client";

import Image from "next/image";
import ImageBand from "@/components/shared/ImageBand";
import SectionMark from "@/components/shared/SectionMark";
import { MaskLine } from "@/components/motion/Text";
import { experience, facts, personal, skills } from "@/lib/data";
import { drawRule, EASE, fadeUp, gsap, riseMasks, useGsap } from "@/lib/motion";

/** The poster voice: uppercase display, set tight and heavy. */
const POSTER =
    "font-display text-d4 font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-ink";

/**
 * Who is building it, and how he got here — two panels in the same language.
 *
 * Both are built the same way: a small rule-and-label across the top, a name
 * or a title set as large uppercase display on one side, and a photograph on
 * the other set inside a frame of type. Under each, the detail — the bio and
 * the contact line in the first, the four stops of the story in the second,
 * each with what it was set out to its right the way a date would be.
 *
 * Every photograph on this page is the same shape and the same size on
 * purpose. The old layout gave each one its own crop and its own column width
 * and the section never settled; one frame repeated is what makes a run of
 * pictures read as a set.
 *
 * This is also `RevealUnder`'s cover on the page, which is the one structural
 * thing to know about it: the whole section scrolls away upwards to uncover
 * the work waiting underneath, and the reveal is keyed to the section's bottom
 * edge. So the last thing here (`.js-last`) is a fixed viewport holding almost
 * nothing — it is the screen the seam is peeled off.
 */
export default function About() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        /* Masthead */
        const head = q(".js-head")[0];
        fadeUp(q(".js-mark"), { trigger: head, start: "top 82%" });
        riseMasks(q(".js-name .js-mask-inner"), { trigger: head, start: "top 78%", stagger: 0.09 });
        fadeUp(q(".js-head-copy"), { trigger: head, start: "top 74%", stagger: 0.1 });

        /* The numbers */
        fadeUp(q(".js-fact"), { trigger: q(".js-facts")[0], start: "top 84%", stagger: 0.08, y: 18 });

        /* Every photograph: uncovered from alternating edges, then drifting
           inside its own frame for as long as it is on screen. The disc behind
           it opens on the same cue, from nothing. */
        q(".js-figure").forEach((figure, i) => {
            gsap.fromTo(
                figure,
                { clipPath: i % 2 === 0 ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" },
                {
                    clipPath: "inset(0% 0 0% 0)",
                    duration: 1.3,
                    ease: EASE.io,
                    scrollTrigger: { trigger: figure, start: "top 88%" },
                }
            );

            gsap.fromTo(
                figure.querySelector("img"),
                { yPercent: -5 },
                {
                    yPercent: 5,
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

        /* The ring around each photograph. It is concentric with the picture,
           so it opens onto it rather than sliding in from a corner — the old
           diagonal drift belonged to the offset plate this replaced. */
        q(".js-plate").forEach((plate) => {
            gsap.fromTo(
                plate,
                { scale: 1.06, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 1.1,
                    ease: EASE.out,
                    scrollTrigger: { trigger: plate, start: "top 88%" },
                }
            );
        });

        /* Experience */
        const story = q(".js-story")[0];
        fadeUp(q(".js-story-mark"), { trigger: story, start: "top 84%" });
        riseMasks(q(".js-story-title .js-mask-inner"), {
            trigger: story,
            start: "top 80%",
            stagger: 0.09,
        });
        q(".js-stop").forEach((stop) => {
            const m = gsap.utils.selector(stop);
            drawRule(m(".js-stop-rule"), { trigger: stop, start: "top 90%" });
            fadeUp(m(".js-stop-in"), { trigger: stop, start: "top 88%", stagger: 0.08, y: 18 });
        });
        /* The shelf */
        const shelf = q(".js-shelf")[0];
        riseMasks(q(".js-shelf-line .js-mask-inner"), {
            trigger: shelf,
            start: "top 82%",
            stagger: 0.09,
        });
        fadeUp(q(".js-shelf-in"), { trigger: shelf, start: "top 84%", stagger: 0.08 });
        q(".js-group").forEach((group) => {
            const m = gsap.utils.selector(group);
            drawRule(m(".js-group-rule"), { trigger: group, start: "top 90%" });
            fadeUp(m(".js-group-in"), { trigger: group, start: "top 88%", stagger: 0.06 });
        });

        /* The last screen — arrives late on purpose, since the reveal begins
           the moment it has finished filling the screen. */
        const last = q(".js-last")[0];
        drawRule(q(".js-last-rule"), { trigger: last, start: "top 70%", axis: "y" });
        fadeUp(q(".js-last-in"), { trigger: last, start: "top 62%", stagger: 0.15 });
    });

    return (
        <section
            id="about"
            ref={scope}
            className="relative overflow-hidden bg-gradient-to-b from-paper-3 to-paper"
        >
            {/* ---------------------------------------------------------- */}
            {/* Panel one — who                                             */}
            {/*                                                              */}
            {/* The opening panel and the numbers under it are one screen,   */}
            {/* and they own it: a jump to `#about` lands on the section's    */}
            {/* top edge, so anything shorter than a viewport left the band   */}
            {/* below already climbing into frame and the panel reading as    */}
            {/* though it stopped short. `min-h` rather than `h` — the same   */}
            {/* block is taller than the screen on a phone and simply flows.  */}
            {/* ---------------------------------------------------------- */}
            <div className="flex min-h-[100svh] flex-col justify-center pt-20 md:pt-28 lg:pt-0">
                <div className="js-head shell mx-auto w-full max-w-shell">
                    <div className="js-mark flex flex-wrap items-center justify-between gap-6">
                        <SectionMark as="h2" label="About" />
                        <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                    </div>

                    <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:items-center lg:gap-x-12">
                        <div className="lg:col-span-7">
                            <h3 className={`js-name ${POSTER}`}>
                                <MaskLine>Hello, I&apos;m</MaskLine>
                                <MaskLine>Kean Valgere</MaskLine>
                                <MaskLine className="text-ink-3">Garcia</MaskLine>
                            </h3>

                            <p className="js-head-copy mt-8 max-w-measure text-body text-ink-2 md:mt-10">
                                {personal.bio}
                            </p>
                        </div>

                        <Portrait
                            src="/images/kean suit.png"
                            alt={personal.name}
                            className="lg:col-span-4 lg:col-start-9"
                        />
                    </div>

                    {/* The contact line, the way the poster carries one along its
                        bottom edge — small, spaced, and the same on every panel. */}
                    <div className="js-head-copy mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule pt-6 font-mono text-meta uppercase text-ink-3 md:mt-16">
                        <a href={`mailto:${personal.email}`} className="link-rule tap lowercase">
                            {personal.email}
                        </a>
                        <span>{personal.location}</span>
                        <span>{personal.timezone}</span>
                    </div>
                </div>

                {/* The numbers */}
                <div className="js-facts shell mx-auto mt-16 w-full max-w-shell md:mt-24">
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
                        {facts.map((fact) => (
                            <div
                                key={fact.label}
                                data-anim="fade"
                                className="js-fact border-t border-rule pt-4"
                            >
                                <dd className="font-display text-d2 font-bold tracking-[-0.03em] text-ink">
                                    {fact.value}
                                </dd>
                                <dt className="mt-2 font-mono text-label uppercase text-ink-3">
                                    {fact.label}
                                </dt>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            <ImageBand
                src="/images/tatami mat.png"
                alt=""
                tone="from-paper-3 to-paper"
                height="h-[36svh] min-h-[12rem] md:h-[52svh]"
                className="mt-16 md:mt-24"
            />

            {/* ---------------------------------------------------------- */}
            {/* Panel two — how I got here                                  */}
            {/* ---------------------------------------------------------- */}
            <div className="js-story shell mx-auto mt-20 max-w-shell md:mt-28">
                <div className="js-story-mark flex flex-wrap items-center justify-between gap-6">
                    <SectionMark as="h3" label="Experience" />
                    <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                </div>

                <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:gap-x-12">
                    <Portrait
                        src="/images/kean grad.jpg"
                        alt={`${personal.name} at his college graduation`}
                        className="lg:col-span-4 lg:row-start-1 lg:self-start"
                    />

                    <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
                        <h4 className={`js-story-title ${POSTER}`}>
                            <MaskLine>My</MaskLine>
                            <MaskLine>Experience</MaskLine>
                        </h4>

                        {/* Title on the left, what it was on the right — the
                            place where a CV would put the years. */}
                        <ol className="mt-10 md:mt-14">
                            {experience.map((stop) => (
                                <li key={stop.title} className="js-stop pb-7 pt-7 first:pt-0">
                                    <span
                                        aria-hidden="true"
                                        data-anim="rule-x"
                                        className="js-stop-rule mb-7 block h-px w-full origin-left bg-rule"
                                    />
                                    <div className="js-stop-in flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                                        <h5 className="font-display text-d1 font-bold tracking-[-0.025em] text-ink">
                                            {stop.title}
                                        </h5>
                                        <span className="whitespace-nowrap font-mono text-label uppercase text-ink-3">
                                            {stop.label}
                                        </span>
                                    </div>
                                    <p className="js-stop-in mt-3 max-w-measure text-body text-ink-2">
                                        {stop.line}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>

            {/* Full bleed, edge to edge — the same treatment the wave gets */}
            <ImageBand
                src="/images/tori gate.webp"
                alt=""
                tone="from-paper to-paper-3"
                height="h-[36svh] min-h-[12rem] md:h-[56svh]"
                className="mt-16 md:mt-24"
            />

            {/* ---------------------------------------------------------- */}
            {/* The shelf — names only                                      */}
            {/* ---------------------------------------------------------- */}
            <div className="js-shelf shell mx-auto mt-20 max-w-shell md:mt-28">
                <div className="js-shelf-in flex flex-wrap items-center justify-between gap-6">
                    <SectionMark as="h3" label="Tools I reach for" />
                    <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                </div>

                <p className="js-shelf-line mt-10 font-display text-d2 font-bold tracking-[-0.035em] text-ink md:mt-14">
                    <MaskLine>What I</MaskLine>
                    <MaskLine className="pl-[8%] font-serif font-normal italic text-ink-2">
                        work with.
                    </MaskLine>
                </p>

                <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-x-10">
                    {skills.map((group) => (
                        <div key={group.category} className="js-group">
                            <span
                                aria-hidden="true"
                                data-anim="rule-x"
                                className="js-group-rule block h-px w-full origin-left bg-rule-strong"
                            />
                            <h4 className="js-group-in mt-5 font-display text-d1 font-semibold tracking-[-0.025em] text-ink">
                                {group.category}
                            </h4>
                            <ul className="js-group-in mt-5 space-y-2">
                                {group.items.map((item) => (
                                    <li key={item} className="text-body text-ink-2">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* The last screen — the one the reveal peels away.             */}
            {/*                                                              */}
            {/* Fixed at exactly one viewport and last in the section, so    */}
            {/* its bottom edge and the section's are the same point: the    */}
            {/* reveal always begins with this beat filling the screen top   */}
            {/* to bottom, no matter how much grows above it.                */}
            {/* ---------------------------------------------------------- */}
            <div className="js-last relative mt-24 flex h-[100svh] flex-col items-center overflow-hidden pt-[24vh] text-center md:mt-36 md:pt-[32vh]">
                <span
                    aria-hidden="true"
                    data-anim="rule-y"
                    className="js-last-rule h-[9vh] w-px origin-top bg-rule-strong"
                />

                <p className="js-last-in mt-8 max-w-xl px-[var(--gutter)] font-serif text-d1 leading-snug text-ink">
                    That is the person. Below is the proof.
                </p>
            </div>
        </section>
    );
}

/**
 * The frame's rule, set as type — and the one thing about it that has to be
 * exact is that it closes.
 *
 * `KeanImage ·` eighteen times, joined by a space: 215 characters, ending on
 * the separator rather than on a space. The path it runs around is 455.02 user
 * units, so at a 3-unit mono face (0.6em per character, JetBrains Mono) the
 * spacing that makes 216 character-widths span exactly that is 0.3066 — and
 * the 216th width, the one the string does not spend, is the gap between the
 * last `·` and the first `K`. It is the same width as every other gap in the
 * run, so the seam is invisible and there is nowhere the `·` is missing.
 *
 * Keep the three numbers below in step with the path in `Portrait`: change the
 * inset, the radius or the box and the perimeter changes with them.
 */
const FRAME_TEXT = Array.from({ length: 18 }, () => "KeanImage ·").join(" ");
const FRAME_SIZE = 3;
const FRAME_TRACKING = 0.3048;

/**
 * A photograph inside a frame written out of its own name.
 *
 * The rule around the picture is not a rule: it is "KeanImage" repeated around
 * a rounded rectangle, small enough that at a glance it still reads as one,
 * and close enough to read as a caption running around the mount.
 *
 * It sits concentric with the photograph and a hair outside its edge — the
 * frame the picture is in, not a second frame leaning out from behind it. The
 * ring's own corners are struck at the picture's corner radius plus that gap,
 * so the two curves are parallel the whole way round rather than merely both
 * being round.
 *
 * The geometry is one aspect ratio said twice. The box is the photograph's 4:5
 * grown by three units on every side — `3%` of the width and `2.4%` of the
 * height are the same distance, on a box where the height is 1.25x the width —
 * so the viewBox below matches it exactly at any size and nothing is stretched.
 */
function Portrait({
    src,
    alt,
    className,
    priority = false,
}: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}) {
    return (
        <div className={className}>
            <div className="relative mx-auto w-full max-w-[17rem] lg:mx-0">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 106 131"
                    className="js-plate plate -inset-x-[3%] -inset-y-[2.4%]"
                >
                    <path
                        id="portrait-frame"
                        fill="none"
                        d="M5.2 1.6H100.8A3.6 3.6 0 0 1 104.4 5.2V125.8A3.6 3.6 0 0 1 100.8 129.4H5.2A3.6 3.6 0 0 1 1.6 125.8V5.2A3.6 3.6 0 0 1 5.2 1.6Z"
                    />
                    <text
                        dominantBaseline="middle"
                        className="fill-ink-3 font-mono"
                        fontSize={FRAME_SIZE}
                        letterSpacing={FRAME_TRACKING}
                    >
                        <textPath href="#portrait-frame">{FRAME_TEXT}</textPath>
                    </text>
                </svg>

                <div className="js-figure relative z-10 aspect-[4/5] w-full overflow-hidden rounded-md bg-paper-3">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        quality={90}
                        sizes="(min-width: 1024px) 17rem, 70vw"
                        className="scale-105 object-cover object-[center_25%]"
                    />
                </div>
            </div>
        </div>
    );
}
