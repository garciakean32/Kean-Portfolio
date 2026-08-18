"use client";

import Image from "next/image";
import Link from "next/link";
import SectionMark from "@/components/shared/SectionMark";
import { MaskLine } from "@/components/motion/Text";
import { projects } from "@/lib/data";
import { fadeUp, gsap, riseMasks, sideScroll, useGsap, wipeIn } from "@/lib/motion";

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
                        Keep scrolling — the work moves sideways
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
 * Below `lg` the track unfolds as a plain vertical stack: a fake horizontal
 * scroll on a phone is a trap.
 */
export default function SelectedWork() {
    const scope = useGsap<HTMLElement>((el) => {
        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            const stage = el.querySelector<HTMLElement>(".js-stage");
            const track = el.querySelector<HTMLElement>(".js-track");
            if (!stage || !track) return;

            sideScroll(el, { stage, track });
        });

        mm.add("(max-width: 1023.98px)", () => {
            const q = gsap.utils.selector(el);
            wipeIn(q(".js-shot"), { trigger: el, start: "top 82%", stagger: 0.12 });
            fadeUp(q(".js-meta"), { trigger: el, start: "top 82%", stagger: 0.08 });
        });
    });

    return (
        <section ref={scope} aria-labelledby="selected-work" className="relative">
            <div className="js-stage hscroll-stage">
                <div className="js-track hscroll-track shell flex flex-col gap-20 pb-[12vh] md:gap-28 md:pb-[16vh] lg:gap-32">
                    {projects.map((project, i) => (
                        <article
                            key={project.id}
                            className="hscroll-panel group [--hs-h:auto] [--hs-w:min(62vw,44rem)]"
                        >
                            <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="js-shot relative aspect-[16/10] w-full overflow-hidden rounded-md bg-paper-3">
                                    <Image
                                        src={project.image}
                                        alt={`${project.title} — screenshot of the live site`}
                                        fill
                                        sizes="(min-width: 1024px) 62vw, 100vw"
                                        className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-out group-hover:scale-x-100"
                                    />
                                </div>

                                <div className="js-meta mt-8 flex items-start justify-between gap-6">
                                    <div>
                                        <span className="font-mono text-label text-ink-3">
                                            0{i + 1} / {project.type}
                                        </span>
                                        <h3 className="mt-4 flex items-baseline gap-3 font-display text-d1 font-bold text-ink">
                                            {project.title}
                                            <span className="font-jp text-base font-normal text-accent">
                                                {project.jp}
                                            </span>
                                        </h3>
                                        <p className="mt-4 max-w-measure text-body text-ink-2">
                                            {project.summary}
                                        </p>
                                    </div>
                                    <span className="mt-1 shrink-0 font-mono text-label uppercase text-ink-3 transition-colors group-hover:text-ink">
                                        Live ↗
                                    </span>
                                </div>
                            </a>
                        </article>
                    ))}

                    {/* Closing panel */}
                    <div className="hscroll-panel [--hs-h:auto] [--hs-w:20rem]">
                        <Link href="/projects" className="group block border-t border-rule pt-6">
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
