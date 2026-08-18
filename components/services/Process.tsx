"use client";

import Image from "next/image";
import SectionMark from "@/components/shared/SectionMark";
import { MaskWords } from "@/components/motion/Text";
import { process } from "@/lib/data";
import { DUR, EASE, fadeUp, gsap, riseMasks, sideScroll, useGsap } from "@/lib/motion";

/**
 * How a project runs. Each step gets the whole screen and the steps travel
 * sideways as you scroll, so the measure of the process is the page itself.
 *
 * The stage is held with `sticky` and the track scrubbed across it — see
 * `sideScroll` — so the turn from vertical to horizontal is continuous
 * rather than a pin catching the page a frame late.
 *
 * Below `lg` — and anywhere motion is off — the `.hscroll` gate in
 * globals.css leaves the panels stacked, because a fake horizontal scroll on
 * a phone is a trap.
 */
export default function Process() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        riseMasks(q(".js-lead .js-mask-inner"), { trigger: el, start: "top 76%", stagger: 0.04 });
        fadeUp(q(".js-hint"), { trigger: el, start: "top 76%" });

        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            const rail = q(".js-rail")[0];
            const stage = q(".js-stage")[0];
            const track = q(".js-track")[0];
            if (!rail || !stage || !track) return;

            const drift = sideScroll(rail, { stage, track });

            q(".js-panel").forEach((panel, i) => {
                // The first step is on screen well before the stage is held,
                // so it reveals on its own sighting like every other section.
                // A `containerAnimation` trigger cannot: it reads a position
                // along the track, which does not start moving until the hold
                // begins — that is what left the opening step blank until the
                // horizontal scroll took over.
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

                // Sideways parallax: the frame travels with the track, the
                // photograph inside it lags a little behind.
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
            q(".js-panel").forEach((panel) => {
                fadeUp(panel.querySelectorAll(".js-panel-in"), {
                    trigger: panel,
                    start: "top 78%",
                    stagger: 0.07,
                });
            });
        });
    });

    return (
        <section ref={scope} className="bg-gradient-to-b from-paper-3 to-paper pt-20 md:pt-28">
            <div className="shell mx-auto max-w-shell">
                <SectionMark as="h2" label="How a project runs" />

                <p className="js-lead mt-10 max-w-4xl font-display text-d2 font-medium tracking-[-0.02em] text-ink md:mt-14">
                    <MaskWords text="Four steps, and you can see the thing working from the third one onward." />
                </p>

                <p className="js-hint mt-10 flex items-center gap-3 font-mono text-label uppercase text-ink-3 md:mt-14">
                    <span className="hidden lg:inline">Keep scrolling — the steps move sideways</span>
                    <span className="lg:hidden">Four steps, one at a time</span>
                    <span aria-hidden="true" className="h-px w-12 bg-accent" />
                    <span aria-hidden="true" className="hidden lg:inline">
                        →
                    </span>
                    <span aria-hidden="true" className="lg:hidden">
                        ↓
                    </span>
                </p>
            </div>

            <div className="js-rail relative mt-14 md:mt-20">
                <div className="js-stage hscroll-stage">
                    <ol className="js-track hscroll-track flex flex-col">
                        {process.map((step, i) => (
                            <li
                                key={step.index}
                                className="js-panel hscroll-panel shell flex items-center py-16 lg:py-[calc(var(--nav-h)+2rem)]"
                            >
                                <div className="mx-auto grid w-full max-w-shell items-center gap-y-10 lg:grid-cols-12 lg:gap-x-12">
                                    <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-paper-3 sm:aspect-[3/2] lg:col-span-5 lg:aspect-auto lg:h-[58svh]">
                                        <div className="js-panel-img absolute inset-0">
                                            <Image
                                                src={step.image}
                                                alt=""
                                                fill
                                                quality={90}
                                                sizes="(min-width: 1024px) 42vw, 100vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    </figure>

                                    <div className="lg:col-span-6 lg:col-start-7">
                                        <SectionMark
                                            index={step.index}
                                            label={`Step ${i + 1} of ${process.length}`}
                                            className="js-panel-in"
                                        />

                                        <h3 className="js-panel-in mt-8 max-w-measure font-display text-d3 font-bold tracking-[-0.03em] text-ink">
                                            {step.title}
                                        </h3>

                                        <p className="js-panel-in mt-6 max-w-measure font-serif text-lead leading-snug text-ink-2">
                                            {step.body}
                                        </p>

                                        <ul className="mt-10 max-w-measure divide-y divide-rule border-y border-rule">
                                            {step.points.map((point) => (
                                                <li key={point.en} className="js-panel-in py-4">
                                                    <span className="block font-jp text-lead leading-tight text-ink">
                                                        {point.jp}
                                                    </span>
                                                    <span className="mt-1.5 block font-mono text-meta uppercase text-ink-3">
                                                        {point.en}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
