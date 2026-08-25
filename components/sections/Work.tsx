"use client";

import Image from "next/image";
import ProjectStatus from "@/components/shared/ProjectStatus";
import SectionMark from "@/components/shared/SectionMark";
import { MaskLine } from "@/components/motion/Text";
import { projects, projectsNote } from "@/lib/data";
import { DUR, EASE, fadeUp, gsap, riseMasks, sideScroll, useGsap, wipeIn } from "@/lib/motion";

/**
 * The heading that opens the page's light region.
 *
 * Split from the track below because it is `RevealUnder`'s `under`: it is
 * uncovered from beneath the dark region scrolling away above it rather than
 * scrolling into view itself, so it drifts against the scroll while that
 * happens and its own position is a bad reference for "has the reader seen
 * this yet". Its reveals read the cover's bottom edge instead.
 *
 * A reveal uncovers from the bottom up, so the deeper a line sits in this
 * block the sooner it appears — which is why the copy furthest down fires
 * first here and the heading, the thing furthest up, fires second.
 *
 * The track stays outside the drifting wrapper on purpose: it measures its own
 * scroll budget off its document position, and the wrapper is displaced from
 * that position for as long as the seam runs.
 */
export function WorkIntro() {
    const scope = useGsap<HTMLDivElement>((el) => {
        const q = gsap.utils.selector(el);
        const cover = document.querySelector<HTMLElement>(".js-reveal-cover") ?? el;

        fadeUp(q(".js-hint"), { trigger: cover, start: "bottom 86%", stagger: 0.1 });
        riseMasks(q(".js-title .js-mask-inner"), {
            trigger: cover,
            start: "bottom 76%",
            stagger: 0.1,
        });
    });

    return (
        <div id="work" ref={scope} className="pt-[30vh] md:pt-[36vh]">
            <div className="shell mx-auto max-w-shell">
                <div className="js-hint flex flex-wrap items-center justify-between gap-6">
                    <SectionMark as="h2" label="Selected work" />
                    <span className="font-jp text-sm font-medium tracking-[0.3em] text-ink-3">
                        作品
                    </span>
                </div>

                <p className="js-title mt-10 max-w-3xl font-display text-d3 font-bold tracking-[-0.035em] text-ink md:mt-14">
                    <MaskLine>Two products,</MaskLine>
                    <MaskLine className="pl-[8%] font-serif font-normal italic text-ink-2">
                        both live.
                    </MaskLine>
                </p>

                <div className="js-hint mt-10 flex flex-wrap items-center justify-between gap-6 pb-[8vh] md:pb-[12vh] md:mt-14">
                    <p className="max-w-measure text-lead text-ink-2">
                        Built end to end, from an empty repository to something anyone can
                        open.
                    </p>
                    <span className="hidden shrink-0 items-center gap-3 font-mono text-label uppercase text-ink-3 lg:flex">
                        One at a time, moving sideways
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
 * One project per screen: every panel is a full viewport wide, so a whole
 * screen of scrolling is spent on a project before the next one arrives. The
 * length follows from that on its own — `sideScroll` sizes the section off the
 * track's width, so wider panels buy more scroll without a number to tune.
 *
 * Below `lg` the track unfolds as a plain vertical stack: a fake horizontal
 * scroll on a phone is a trap.
 */
export default function Work() {
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
                // screenshot inside it lags a little behind. The closing panel
                // has no screenshot, so there is nothing to lag.
                const img = panel.querySelector(".js-panel-img");
                if (!img) return;

                gsap.fromTo(
                    img,
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
            // The stacked layout owns no scroll budget, and says so.
            //
            // `sideScroll` sizes the section to hold the sideways track's
            // budget and re-sizes it on every refresh — from `onRefreshInit`,
            // which fires long after the context that created it finished, so
            // GSAP has no record of those later writes. Reverting the desktop
            // context undoes the first write and nothing after it.
            //
            // In practice that first write is the one whose recorded starting
            // value is "no inline height", so a revert does land back there.
            // This is the belt to that braces: asserted on the way *in* to the
            // stacked layout rather than cleaned up on the way out, so it does
            // not depend on two contexts reverting and activating in any
            // particular order. A plain style write, because what it is
            // undoing is a plain style write.
            el.style.height = "";

            q(".js-panel").forEach((panel) => {
                // The closing panel carries no screenshot, so there is nothing
                // for the wipe to uncover there.
                const shot = panel.querySelectorAll(".js-shot");
                if (shot.length) wipeIn(shot, { trigger: panel, start: "top 82%" });

                fadeUp(panel.querySelectorAll(".js-panel-in"), {
                    trigger: panel,
                    start: "top 82%",
                    stagger: 0.08,
                });
            });
        });
    });

    return (
        <section ref={scope} className="relative">
            <div className="js-stage hscroll-stage">
                <div className="js-track hscroll-track flex flex-col pb-[12vh] md:pb-[16vh]">
                    {projects.map((project) => (
                        <article
                            key={project.id}
                            className="js-panel hscroll-panel shell flex items-center py-16 lg:py-24"
                        >
                            <div className="mx-auto grid w-full max-w-shell items-center gap-y-10 lg:grid-cols-12 lg:gap-x-14">
                                <a
                                    href={project.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${project.title} — open the live site`}
                                    className="js-shot group relative block aspect-[4/3] w-full overflow-hidden rounded-md bg-paper-3 lg:col-span-6"
                                >
                                    <div className="js-panel-img absolute inset-0">
                                        <Image
                                            src={project.image}
                                            alt={`${project.title} — screenshot of the live site`}
                                            fill
                                            quality={90}
                                            sizes="(min-width: 1024px) 48vw, 100vw"
                                            className="object-contain object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                                        />
                                    </div>
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-0 z-10 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-out group-hover:scale-x-100"
                                    />
                                </a>

                                <div className="lg:col-span-5 lg:col-start-8">
                                    <div className="js-panel-in flex items-baseline gap-4">
                                        <span className="font-mono text-label uppercase text-ink-3">
                                            {project.type}
                                        </span>
                                        <span className="font-jp text-lg text-accent">
                                            {project.jp}
                                        </span>
                                    </div>

                                    <h3 className="js-panel-in mt-5 font-display text-d2 font-bold tracking-[-0.035em] text-ink">
                                        {project.title}
                                    </h3>

                                    <p className="js-panel-in mt-6 max-w-measure font-serif text-lead leading-snug text-ink-2">
                                        {project.summary}
                                    </p>

                                    <ProjectStatus
                                        status={project.status}
                                        className="js-panel-in mt-8"
                                    />

                                    <ul className="js-panel-in mt-8 flex flex-wrap gap-x-5 gap-y-2">
                                        {project.stack.map((tech) => (
                                            <li
                                                key={tech}
                                                className="font-mono text-meta uppercase text-ink-3"
                                            >
                                                {tech}
                                            </li>
                                        ))}
                                    </ul>

                                    <a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="js-panel-in group mt-10 inline-flex min-h-11 items-center gap-3 rounded border border-ink px-7 py-3.5 font-mono text-label uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-on-ink"
                                    >
                                        Visit {project.title}
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                                            ↗
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </article>
                    ))}

                    {/* Closing panel — narrower than a full screen, so it reads
                        as the end of the run rather than a third project. */}
                    <div className="js-panel hscroll-panel shell flex items-center py-16 [--hs-w:min(56vw,34rem)] lg:py-0">
                        <div className="js-panel-in w-full border-t border-rule pt-8">
                            <span className="font-mono text-label uppercase text-ink-3">
                                Worth knowing
                            </span>
                            <p className="mt-6 max-w-sm font-serif text-d1 leading-snug text-ink">
                                {projectsNote}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
