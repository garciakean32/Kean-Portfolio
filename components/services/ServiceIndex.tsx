"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MaskLine } from "@/components/motion/Text";
import { services, servicesNote } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fadeUp, gsap, MASK_HIDDEN, riseMasks, ScrollTrigger, useGsap } from "@/lib/motion";
import { getLenis } from "@/lib/lenis";

/**
 * A running index that tracks what you are reading. The left column stays put
 * and re-letters itself; the entries pass it. Interaction here is navigation,
 * not decoration — the same list is the page's table of contents.
 */
export default function ServiceIndex() {
    const [active, setActive] = useState(0);
    const reduce = useReducedMotion();

    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        q(".js-entry").forEach((entry, i) => {
            ScrollTrigger.create({
                trigger: entry,
                start: "top 55%",
                end: "bottom 55%",
                onEnter: () => setActive(i),
                onEnterBack: () => setActive(i),
            });

            gsap.fromTo(
                entry.querySelectorAll(".js-mask-inner"),
                MASK_HIDDEN,
                {
                    yPercent: 0,
                    duration: 1,
                    ease: "power4.out",
                    stagger: 0.07,
                    scrollTrigger: { trigger: entry, start: "top 82%" },
                }
            );

            gsap.fromTo(
                entry.querySelectorAll(".js-body"),
                { opacity: 0, x: i % 2 === 0 ? -28 : 28 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1,
                    ease: "power4.out",
                    stagger: 0.07,
                    scrollTrigger: { trigger: entry, start: "top 78%" },
                }
            );
        });

        riseMasks(q(".js-lead .js-mask-inner"), { trigger: el, start: "top 80%" });
        fadeUp(q(".js-note"), { trigger: q(".js-note")[0], start: "top 90%" });
    });

    const jump = (index: string) => {
        const target = document.getElementById(`service-${index}`);
        if (!target) return;

        // An entry is active while it straddles the "55% down the viewport"
        // line the ScrollTriggers above key off. Land its middle on that line
        // rather than its top or bottom edge — an edge sits exactly on the
        // boundary and resolves to the neighbouring entry. Resolved to a
        // plain number (not the element) so Lenis doesn't also subtract the
        // entry's own scroll-margin-top on top of this.
        const rect = target.getBoundingClientRect();
        const y = rect.top + rect.height / 2 + window.scrollY - window.innerHeight * 0.55;

        // Lenis re-asserts its own scroll position every frame, so a plain
        // `scrollIntoView`/`window.scrollTo` gets fought and snapped back to
        // the wrong spot — go through its scrollTo instead whenever it's the
        // one driving scroll.
        const lenis = getLenis();
        if (lenis) {
            lenis.scrollTo(y, { immediate: reduce ?? false });
            return;
        }
        window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    };

    return (
        <section ref={scope} className="bg-gradient-to-b from-paper-3 to-paper py-16 md:py-24">
            <div className="shell mx-auto max-w-shell">
                <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-20">
                    {/* Running index */}
                    <div className="hidden lg:block">
                        <div className="sticky top-[calc(var(--nav-h)+3rem)]">
                            <div className="flex items-baseline gap-4">
                                <span className="font-display text-d3 font-extrabold leading-none text-ink">
                                    {services[active].index}
                                </span>
                                <span className="tate font-jp text-sm tracking-[0.3em] text-accent">
                                    仕事
                                </span>
                            </div>

                            <ul className="mt-10 space-y-3 border-t border-rule pt-6">
                                {services.map((service, i) => (
                                    <li key={service.index}>
                                        <button
                                            type="button"
                                            onClick={() => jump(service.index)}
                                            className={cn(
                                                "flex w-full items-baseline gap-3 text-left font-mono text-label uppercase transition-colors duration-300",
                                                i === active
                                                    ? "text-ink"
                                                    : "text-ink-3 hover:text-ink-2"
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "h-px w-4 shrink-0 origin-left transition-transform duration-500 ease-out",
                                                    i === active
                                                        ? "scale-x-100 bg-accent"
                                                        : "scale-x-50 bg-rule-strong"
                                                )}
                                            />
                                            {service.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Entries */}
                    <div>
                        <p className="js-lead max-w-3xl font-serif text-d2 text-ink">
                            <MaskLine>Eight starting points.</MaskLine>
                        </p>

                        <div className="mt-14 md:mt-20">
                            {services.map((service) => (
                                <article
                                    key={service.index}
                                    id={`service-${service.index}`}
                                    className="js-entry scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-rule py-12 last:border-b md:py-16"
                                >
                                    <div className="grid gap-6 md:grid-cols-[5rem_1fr] md:gap-10">
                                        <span className="js-body font-mono text-label text-accent">
                                            {service.index}
                                        </span>

                                        <div>
                                            <h2 className="font-display text-d2 font-medium tracking-[-0.02em] text-ink">
                                                <MaskLine>{service.title}</MaskLine>
                                            </h2>

                                            <p className="js-body mt-4 max-w-2xl font-serif text-lead text-ink">
                                                {service.outcome}
                                            </p>
                                            <p className="js-body mt-4 max-w-measure text-body text-ink-2">
                                                {service.body}
                                            </p>

                                            <ul className="js-body mt-8 flex flex-wrap gap-x-8 gap-y-2">
                                                {service.includes.map((item) => (
                                                    <li
                                                        key={item}
                                                        className="font-mono text-label uppercase text-ink-3"
                                                    >
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="js-note mx-auto mt-20 max-w-measure text-center font-mono text-meta leading-relaxed text-ink-3 md:mt-28">
                    {servicesNote}
                </p>
            </div>
        </section>
    );
}
