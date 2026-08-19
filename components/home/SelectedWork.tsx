"use client";

import Image from "next/image";
import Link from "next/link";
import SectionMark from "@/components/shared/SectionMark";
import ProjectStatus from "@/components/shared/ProjectStatus";
import { MaskLine } from "@/components/motion/Text";
import { projects } from "@/lib/data";
import { DUR, EASE, fadeUp, gsap, riseMasks, sideScroll, useGsap, wipeIn } from "@/lib/motion";

/**
 * The heading that opens the page's light region.
 *
 * Split from the track below because it is `RevealUnder`'s `under`: it is
 * uncovered from beneath the dark section that scrolls away above it rather
 * than scrolling into view itself, so it drifts against the scroll while that
 * happens and its own position is a bad reference for "has the reader seen
 * this yet" — see `js-reveal-cover` in `RevealUnder`. Its reveals read the
 * cover's bottom edge instead.
 *
 * A reveal uncovers from the bottom up, so the deeper a line sits in this
 * block the sooner it appears: the paragraphs are showing while the heading
 * is still behind the cover, which is why they fire first here and the
 * heading — the thing furthest up — fires second.
 *
 * The track stays outside the drifting wrapper on purpose: it measures its
 * own scroll budget off its document position, and the wrapper is displaced
 * from that position for as long as the seam runs.
 */
export function SelectedWorkIntro() {
    const scope = useGsap<HTMLDivElement>((el) => {
        const q = gsap.utils.selector(el);
        const cover = document.querySelector<HTMLElement>(".js-reveal-cover") ?? el;

        fadeUp(q(".js-hint"), { trigger: cover, start: "bottom 86%" });
        riseMasks(q(".js-title .js-mask-inner"), {
            trigger: cover,
            start: "bottom 76%",
            stagger: 0.1,
        });
    });

    return (
        <div ref={scope} className="pt-[24vh] md:pt-[30vh]">
            <div className="shell mx-auto max-w-shell">
                <SectionMark index="03" label="Selected work" className="js-hint" />

                <h2
                    id="selected-work"
                    className="js-title mt-12 max-w-4xl font-display text-d3 font-bold tracking-[-0.03em] text-ink md:mt-16"
                >
                    <MaskLine>Work worth showing,</MaskLine>
                    <MaskLine className="text-ink-2">built end to end.</MaskLine>
                </h2>

                <div className="js-hint mt-14 grid gap-10 md:mt-20 lg:grid-cols-12 lg:gap-x-10">
                    <p className="max-w-measure text-body text-ink-2 lg:col-span-5">
                        A look at some of the projects I&apos;ve made — chosen to
                        show the kind of work I take on.
                    </p>
                    <p className="max-w-measure font-serif text-lead leading-snug text-ink lg:col-span-5 lg:col-start-8">
                        Each one is shaped around a real idea and carried through
                        end to end.
                    </p>
                </div>

                <div className="js-hint mt-16 flex justify-end pb-[10vh] md:pb-[14vh]">
                    <span className="hidden shrink-0 items-center gap-3 font-mono text-label uppercase text-ink-3 lg:flex">
                        Keep scrolling — one project at a time, moving sideways
                        <span aria-hidden="true" className="h-px w-12 bg-accent" />
                        <span aria-hidden="true">→</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * The work travelling sideways, picked up by scrolling on from the heading.
 *
 * One project per screen, the way the process steps run on /services: every
 * panel is a full viewport wide, so a whole screen of scrolling is spent on a
 * project before the next one arrives. The length follows from that on its
 * own — `sideScroll` sizes the section off the track's width, so wider panels
 * buy more scroll without a number to tune here.
 *
 * Below `lg` the track unfolds as a plain vertical stack: a fake horizontal
 * scroll on a phone is a trap.
 */
export default function SelectedWork() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            const stage = el.querySelector<HTMLElement>(".js-stage");
            const track = el.querySelector<HTMLElement>(".js-track");
            if (!stage || !track) return;

            const drift = sideScroll(el, { stage, track });

            q(".js-panel").forEach((panel, i) => {
                // The first panel is on screen before the stage is ever held,
                // and a `containerAnimation` trigger reads a position along a
                // track that has not started moving yet — so the opener
                // reveals on its own sighting and only the rest ride the track.
                const at =
                    i === 0
                        ? { trigger: el, start: "top 80%" }
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

                // Sideways parallax: the frame travels with the track, the
                // screenshot inside it lags a little behind.
                gsap.fromTo(
                    panel.querySelector(".js-panel-img"),
                    { xPercent: -5, scale: 1.12 },
                    {
                        xPercent: 5,
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
            q(".js-panel").forEach((panel) => {
                wipeIn(panel.querySelectorAll(".js-shot"), { trigger: panel, start: "top 82%" });
                fadeUp(panel.querySelectorAll(".js-panel-in"), {
                    trigger: panel,
                    start: "top 82%",
                    stagger: 0.08,
                });
            });
        });
    });

    return (
        <section ref={scope} aria-labelledby="selected-work" className="relative">
            <div className="js-stage hscroll-stage">
                <div className="js-track hscroll-track flex flex-col pb-[12vh] md:pb-[16vh]">
                    {projects.map((project, i) => (
                        <article
                            key={project.id}
                            className="js-panel hscroll-panel shell flex items-center py-16 lg:py-[calc(var(--nav-h)+2rem)]"
                        >
                            <div className="mx-auto grid w-full max-w-shell items-center gap-y-10 lg:grid-cols-12 lg:gap-x-14">
                                <a
                                    href={project.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${project.title} — open the live site`}
                                    className="js-shot group relative block aspect-[16/10] w-full overflow-hidden rounded-md bg-paper-3 lg:col-span-7 lg:aspect-auto lg:h-[62svh]"
                                >
                                    <div className="js-panel-img absolute inset-0">
                                        <Image
                                            src={project.image}
                                            alt={`${project.title} — screenshot of the live site`}
                                            fill
                                            quality={90}
                                            sizes="(min-width: 1024px) 58vw, 100vw"
                                            className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                                        />
                                    </div>
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-0 z-10 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-out group-hover:scale-x-100"
                                    />
                                </a>

                                <div className="lg:col-span-5">
                                    <span className="js-panel-in block font-mono text-label uppercase text-ink-3">
                                        0{i + 1} / {project.type}
                                    </span>

                                    <h3 className="js-panel-in mt-5 flex items-baseline gap-3 font-display text-d2 font-bold tracking-[-0.03em] text-ink">
                                        {project.title}
                                        <span className="font-jp text-lg font-normal text-accent">
                                            {project.jp}
                                        </span>
                                    </h3>

                                    <ProjectStatus
                                        status={project.status}
                                        className="js-panel-in mt-6"
                                    />

                                    <p className="js-panel-in mt-6 max-w-measure font-serif text-lead leading-snug text-ink-2">
                                        {project.summary}
                                    </p>

                                    <a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="js-panel-in group mt-10 inline-flex items-center gap-3 font-mono text-label uppercase text-ink-3 transition-colors hover:text-ink"
                                    >
                                        Visit live site
                                        <span
                                            aria-hidden="true"
                                            className="transition-transform duration-300 group-hover:translate-x-1"
                                        >
                                            ↗
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </article>
                    ))}

                    {/* Closing panel */}
                    <div className="hscroll-panel shell flex items-center py-16 [--hs-w:min(56vw,34rem)] lg:py-0">
                        <Link href="/projects" className="group block w-full border-t border-rule pt-6">
                            <span className="font-mono text-label uppercase text-ink-3">Next</span>
                            <span className="mt-3 flex items-baseline gap-3 font-display text-d2 font-bold text-ink">
                                All work
                                <span className="transition-transform duration-500 ease-out group-hover:translate-x-2">
                                    →
                                </span>
                            </span>
                            <span className="mt-3 block max-w-xs text-body text-ink-2">
                                Full case notes and what each one was for.
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
