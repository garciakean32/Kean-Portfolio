"use client";

import Image from "next/image";
import { MaskLine } from "@/components/motion/Text";
import ProjectStatus from "@/components/shared/ProjectStatus";
import type { projects } from "@/lib/data";
import { cn } from "@/lib/utils";
import { gsap, reveal, riseMasks, useGsap } from "@/lib/motion";

type Project = (typeof projects)[number];

/**
 * A case study, not a card. Odd entries lead with the screenshot on the left,
 * even entries flip — and the image always travels against the text so the two
 * columns never arrive together.
 */
export default function CaseStudy({
    project,
    position,
}: {
    project: Project;
    position: number;
}) {
    const flipped = position % 2 === 1;

    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        reveal(
            (cue) =>
                gsap.fromTo(
                    q(".js-shot"),
                    { clipPath: flipped ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" },
                    {
                        clipPath: "inset(0 0% 0 0%)",
                        duration: 1.5,
                        ease: "power3.inOut",
                        ...cue,
                    }
                ),
            { trigger: el, start: "top 76%" }
        );

        gsap.fromTo(
            q(".js-shot img"),
            { yPercent: -7, scale: 1.14 },
            {
                yPercent: 7,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 },
            }
        );

        riseMasks(q(".js-title .js-mask-inner"), { trigger: el, start: "top 74%", stagger: 0.09 });

        reveal(
            (cue) =>
                gsap.fromTo(q(".js-detail"), { opacity: 0, y: 28 }, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power4.out",
                    stagger: 0.08,
                    ...cue,
                }),
            { trigger: el, start: "top 70%" }
        );

        reveal(
            (cue) =>
                gsap.fromTo(q(".js-index"), { opacity: 0, xPercent: flipped ? 30 : -30 }, {
                    opacity: 1,
                    xPercent: 0,
                    duration: 1.2,
                    ease: "power4.out",
                    ...cue,
                }),
            { trigger: el, start: "top 78%" }
        );
    });

    return (
        <section
            ref={scope}
            className={cn(
                "bg-gradient-to-b py-16 md:py-24",
                // Alternating tone, so consecutive studies never share a flat
                // background and the page keeps drifting.
                flipped ? "from-paper to-paper-3" : "from-paper-3 to-paper"
            )}
        >
            <div className="shell mx-auto max-w-shell">
                <div
                    className={cn(
                        "grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16",
                        flipped && "lg:[&>*:first-child]:order-2"
                    )}
                >
                    <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.title} — open the live site`}
                        className="js-shot group relative block aspect-[4/3] w-full overflow-hidden rounded-md bg-paper-3"
                    >
                        <Image
                            src={project.image}
                            alt={`${project.title} — the live site`}
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-contain object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                        />
                    </a>

                    <div>
                        <div className="js-index flex items-baseline gap-4">
                            <span className="font-display text-d3 font-extrabold leading-none text-ink/10">
                                {String(position + 1).padStart(2, "0")}
                            </span>
                            <span className="font-jp text-lg text-accent">{project.jp}</span>
                        </div>

                        <h2 className="js-title mt-6 font-display text-d3 font-bold tracking-[-0.03em] text-ink">
                            <MaskLine>{project.title}</MaskLine>
                        </h2>

                        <ProjectStatus status={project.status} className="js-detail mt-6" />

                        <p className="js-detail mt-5 max-w-measure font-serif text-lead text-ink-2">
                            {project.description}
                        </p>
                        <p className="js-detail mt-5 max-w-measure text-body text-ink-2">
                            {project.note}
                        </p>

                        <dl className="js-detail mt-10 grid gap-6 border-t border-rule pt-6 sm:grid-cols-2">
                            <div>
                                <dt className="font-mono text-label uppercase text-ink-3">Role</dt>
                                <dd className="mt-2 text-body text-ink">{project.role}</dd>
                            </div>
                            <div>
                                <dt className="font-mono text-label uppercase text-ink-3">Type</dt>
                                <dd className="mt-2 text-body text-ink">{project.type}</dd>
                            </div>
                        </dl>

                        <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="js-detail group mt-10 inline-flex items-center gap-3 rounded border border-ink px-7 py-3.5 font-mono text-label uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-on-ink"
                        >
                            Open {project.title}
                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                ↗
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
