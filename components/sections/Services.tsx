"use client";

import Image from "next/image";
import ImageBand from "@/components/shared/ImageBand";
import SectionMark from "@/components/shared/SectionMark";
import { MaskLine, MaskWords } from "@/components/motion/Text";
import { offerings, process } from "@/lib/data";
import {
    DUR,
    EASE,
    drawRule,
    fadeUp,
    gsap,
    parallax,
    riseMasks,
    sideScroll,
    useGsap,
} from "@/lib/motion";

/**
 * What I can build, and how a build runs — a line each.
 *
 * This used to be two pages and about two thousand words. It is now something
 * you can take in standing up: the title names the work and the line under it
 * says what changes for you. Anything that needed a paragraph belongs in a
 * conversation instead.
 *
 * The process runs sideways: each step gets a whole screen and the four of
 * them travel across it as you scroll, so the measure of the process is the
 * page itself. Below `lg`, and anywhere motion is off, the `.hscroll` gate in
 * globals.css leaves them stacked.
 *
 * This section is `SlideOver`'s `hold` — the close comes over its last screen
 * — which is why it ends on a plate rather than on something that needs
 * reading through to the bottom.
 */
export default function Services() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        /* Keyed to the heading rather than to the section. The answers are
           centred in a screen of their own now, so the section's top edge is
           up to half a viewport above the first thing there is to reveal —
           trigger off that edge and the whole opening plays out below the
           fold. */
        const open = q(".js-mark")[0] ?? el;
        fadeUp(q(".js-mark"), { trigger: open, start: "top 82%", stagger: 0.1 });
        riseMasks(q(".js-title .js-mask-inner"), { trigger: open, start: "top 78%", stagger: 0.1 });

        q(".js-card").forEach((card) => {
            const m = gsap.utils.selector(card);
            drawRule(m(".js-card-rule"), { trigger: card, start: "top 90%" });
            fadeUp(m(".js-card-in"), { trigger: card, start: "top 88%", stagger: 0.08, y: 20 });
        });

        /* The process head */
        const rail = q(".js-rail")[0];
        const lead = q(".js-lead")[0];
        riseMasks(q(".js-lead .js-mask-inner"), { trigger: lead, start: "top 78%", stagger: 0.04 });
        fadeUp(q(".js-lead-in"), { trigger: lead, start: "top 80%", stagger: 0.1 });

        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            const stage = q(".js-stage")[0];
            const track = q(".js-track")[0];
            if (!rail || !stage || !track) return;

            const drift = sideScroll(rail, { stage, track });

            q(".js-panel").forEach((panel, i) => {
                // The first step is on screen well before the stage is held,
                // so it reveals on its own sighting like every other block. A
                // `containerAnimation` trigger cannot: it reads a position
                // along a track that has not started moving yet.
                const at =
                    i === 0
                        ? { trigger: rail, start: "top 78%" }
                        : { trigger: panel, containerAnimation: drift, start: "left 72%" };

                gsap.fromTo(
                    panel.querySelectorAll(".js-panel-in"),
                    { opacity: 0, y: 34 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: DUR.reveal,
                        ease: EASE.out,
                        stagger: 0.07,
                        scrollTrigger: at,
                    }
                );

                gsap.fromTo(
                    panel.querySelector(".js-panel-img"),
                    { xPercent: -6, scale: 1.14 },
                    {
                        xPercent: 6,
                        ease: "none",
                        scrollTrigger: {
                            trigger: panel,
                            containerAnimation: drift,
                            start: "left right",
                            end: "right left",
                            scrub: 0.8,
                        },
                    }
                );
            });
        });

        mm.add("(max-width: 1023.98px)", () => {
            // The stacked layout owns no scroll budget — see the matching
            // note in Work.tsx for why this is asserted on the way in rather
            // than cleaned up on the way out.
            const stackedRail = q(".js-rail")[0] as HTMLElement | undefined;
            if (stackedRail) stackedRail.style.height = "";

            q(".js-panel").forEach((panel) => {
                fadeUp(panel.querySelectorAll(".js-panel-in"), {
                    trigger: panel,
                    start: "top 80%",
                    stagger: 0.07,
                });
            });
        });

        /* The close */
        const close = q(".js-close")[0];
        riseMasks(q(".js-close-line .js-mask-inner"), {
            trigger: close,
            start: "top 78%",
            stagger: 0.04,
        });
        fadeUp(q(".js-close-in"), { trigger: close, start: "top 80%", stagger: 0.12 });

        q(".js-figure").forEach((figure, i) => {
            gsap.fromTo(
                figure,
                { clipPath: i % 2 === 0 ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)" },
                {
                    clipPath: "inset(0% 0 0% 0)",
                    duration: 1.4,
                    ease: EASE.io,
                    scrollTrigger: { trigger: figure, start: "top 86%" },
                }
            );

            const img = figure.querySelector("img");
            if (img) parallax(img, { trigger: figure, distance: 60, scrub: 0.8 });
        });
    });

    return (
        <section id="services" ref={scope} className="relative">
            {/* The answers own their screen. A jump to `#services` lands on the
                section's top edge, and at anything under a viewport the band
                below was already in frame — the panel read as ending before
                the screen did. `min-h` rather than `h`: the same block runs
                past a phone's screen on its own and simply flows. */}
            <div className="flex min-h-[100svh] flex-col justify-center pt-20 md:pt-28 lg:pt-0">
                <div className="shell mx-auto w-full max-w-shell">
                    <div className="js-mark flex flex-wrap items-center justify-between gap-6">
                        <SectionMark as="h2" label="Services" />
                        <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                    </div>

                    <p className="js-title mt-10 max-w-3xl font-display text-d3 font-bold tracking-[-0.035em] text-ink md:mt-14">
                        <MaskLine>What I can</MaskLine>
                        <MaskLine className="pl-[8%] font-serif font-normal italic text-ink-2">
                            build for you.
                        </MaskLine>
                    </p>

                    <p className="js-mark mt-8 max-w-measure text-lead text-ink-2 md:mt-12">
                        Describe what you want. Most projects turn out to be a handful of
                        these at once.
                    </p>

                    <div className="mt-14 grid gap-x-10 gap-y-12 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
                        {offerings.map((item) => (
                            <div key={item.title} className="js-card">
                                <span
                                    aria-hidden="true"
                                    data-anim="rule-x"
                                    className="js-card-rule block h-px w-full origin-left bg-rule-strong"
                                />
                                <h3 className="js-card-in mt-8 font-display text-d1 font-semibold tracking-[-0.025em] text-ink">
                                    {item.title}
                                </h3>
                                <p className="js-card-in mt-4 max-w-measure text-body text-ink-2">
                                    {item.line}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* A full-bleed pause after the answers, before the process */}
            <ImageBand
                src="/images/tatami mat 2.png"
                alt=""
                tone="from-paper to-paper-3"
                height="h-[34svh] min-h-[12rem] md:h-[50svh]"
                className="mt-16 md:mt-24"
            />

            {/* ---------------------------------------------------------- */}
            {/* How a project runs — four steps, travelling sideways        */}
            {/* ---------------------------------------------------------- */}
            <div className="js-lead shell mx-auto mt-16 max-w-shell md:mt-24">
                <div className="js-lead-in">
                    <SectionMark as="h3" label="How a project runs" />
                </div>

                <p className="mt-10 max-w-3xl font-display text-d2 font-semibold tracking-[-0.03em] text-ink md:mt-14">
                    <MaskWords text="A short path, and you can click through it long before the end." />
                </p>

                <p className="js-lead-in mt-8 flex items-center gap-3 font-mono text-label uppercase text-ink-3 md:mt-12">
                    <span className="hidden lg:inline">
                        Keep scrolling — the steps move sideways
                    </span>
                    <span className="lg:hidden">Keep scrolling — the steps run down</span>
                    <span aria-hidden="true" className="h-px w-12 bg-ink-3" />
                    <span aria-hidden="true" className="hidden lg:inline">
                        →
                    </span>
                    <span aria-hidden="true" className="lg:hidden">
                        ↓
                    </span>
                </p>
            </div>

            <div className="js-rail relative mt-10 md:mt-14">
                <div className="js-stage hscroll-stage">
                    <ol className="js-track hscroll-track flex flex-col">
                        {/* The rail's own opening title card — a drawn ring
                            and a label set down the margin, ahead of the first
                            real step rather than as one. */}
                        <li className="js-panel hscroll-panel shell flex items-center py-16 [--hs-w:min(58vw,36rem)] lg:py-24">
                            <div className="js-panel-in flex w-full flex-col items-center text-center">
                                <span className="mt-8 font-mono text-label uppercase tracking-[0.3em] text-ink-3 lg:mt-10 lg:font-semibold lg:[text-orientation:upright] lg:[writing-mode:vertical-rl]">
                                    Where it starts
                                </span>
                            </div>
                        </li>

                        {process.map((step) => (
                            <li
                                key={step.title}
                                className="js-panel hscroll-panel shell flex items-center py-16 [--hs-w:min(88vw,68rem)] lg:py-24"
                            >
                                <div className="mx-auto grid w-full max-w-shell items-center gap-y-10 lg:grid-cols-12 lg:gap-x-14">
                                    <figure className="relative aspect-[3/2] w-full overflow-hidden rounded-md bg-paper-3 lg:col-span-6 lg:aspect-square">
                                        <div className="js-panel-img absolute inset-0">
                                            <Image
                                                src={step.image}
                                                alt=""
                                                fill
                                                quality={90}
                                                sizes="(min-width: 1024px) 48vw, 100vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    </figure>

                                    <div className="lg:col-span-5 lg:col-start-8">
                                        <h4 className="js-panel-in max-w-measure font-display text-d3 font-bold tracking-[-0.03em] text-ink">
                                            {step.title}
                                        </h4>

                                        <p className="js-panel-in mt-6 max-w-measure font-serif text-lead leading-snug text-ink-2">
                                            {step.line}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* The close — the last light thing before the dark comes over. */}
            {/*                                                              */}
            {/* The bottom padding is the seam's read-time: `SlideOver` starts*/}
            {/* the drift the moment the close's top edge reaches the bottom  */}
            {/* of the screen, so this plate needs real room under it or it is */}
            {/* still being read when the dark begins climbing over it.        */}
            {/*                                                                */}
            {/* The measure is the room the work's own heading holds below it  */}
            {/* — the light region opens on that much empty paper and now      */}
            {/* closes on the same, which is the one thing that makes the two  */}
            {/* ends of it read as the same region. Same at every width: the   */}
            {/* seam runs everywhere.                                         */}
            {/* ---------------------------------------------------------- */}
            <div className="js-close shell mx-auto mt-16 max-w-shell pb-[32svh] md:mt-24">
                <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-14">
                    <figure className="lg:col-span-4 lg:row-start-1">
                        <div className="js-figure relative aspect-[3/4] w-full max-w-[15rem] overflow-hidden rounded-md bg-paper-2">
                            <Image
                                src="/images/gray branch.jpg"
                                alt=""
                                fill
                                quality={85}
                                sizes="(min-width: 1024px) 15rem, 60vw"
                                className="scale-[1.18] object-cover"
                            />
                        </div>
                        <figcaption className="js-close-in mt-4 font-mono text-label uppercase text-ink-3">
                            Some things take a season
                        </figcaption>
                    </figure>

                    <div className="lg:col-span-4 lg:col-start-5 lg:row-start-1">
                        <p className="js-close-line font-serif text-d2 leading-tight text-ink">
                            <MaskWords text="Most of the work is decisions," />{" "}
                            <span className="text-ink-3">
                                <MaskWords text="not typing." />
                            </span>
                        </p>
                        <p className="js-close-in mt-8 max-w-measure text-body text-ink-2">
                            The typing is the quick part. The deciding is what makes a site
                            feel built for you rather than assembled from a template.
                        </p>
                    </div>

                    <figure className="lg:col-span-3 lg:col-start-10 lg:row-start-1">
                        <div className="js-figure relative aspect-[3/4] w-full max-w-[14rem] overflow-hidden rounded-md bg-paper-2">
                            <Image
                                src="/images/kean sakura.webp"
                                alt=""
                                fill
                                quality={85}
                                sizes="(min-width: 1024px) 14rem, 60vw"
                                className="scale-[1.18] object-cover object-center"
                            />
                        </div>
                        <figcaption className="js-close-in mt-4 font-mono text-label uppercase text-ink-3">
                            Away from the desk, still thinking about it
                        </figcaption>
                    </figure>
                </div>
            </div>
        </section>
    );
}

