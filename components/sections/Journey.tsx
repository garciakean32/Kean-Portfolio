"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { journey, personal } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function Journey() {
    const ref = useScrollReveal<HTMLElement>();
    const portraitRef = useRef<HTMLDivElement>(null);
    const copyRef = useRef<HTMLDivElement>(null);

    // Copy slides in from the left, portrait slides in from the right.
    useEffect(() => {
        const portrait = portraitRef.current;
        const copy = copyRef.current;
        const section = ref.current;
        if (!portrait || !copy || !section) return;

        const mm = gsap.matchMedia();

        mm.add("(prefers-reduced-motion: no-preference)", () => {
            const scrollTrigger = {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none none",
            } as const;

            gsap.fromTo(
                copy,
                { opacity: 0, x: -70 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger,
                }
            );

            gsap.fromTo(
                portrait,
                { opacity: 0, x: 70 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger,
                }
            );
        });

        return () => mm.revert();
    }, [ref]);

    return (
        <section
            id="journey"
            ref={ref}
            className="py-24 md:py-28 snap-start flex flex-col justify-center overflow-hidden"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl w-full mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-center">
                    {/* Mobile-only heading — sits above the image; hidden on desktop where the heading lives in the left column */}
                    <div className="lg:hidden">
                        <p
                            className="text-sm tracking-widest uppercase font-medium mb-4"
                            style={{ color: "var(--accent)" }}
                        >
                            How It Started
                        </p>
                        <h2
                            className="font-display text-3xl font-bold leading-tight"
                            style={{ color: "var(--fg)" }}
                        >
                            One thing simply{" "}
                            <span style={{ color: "var(--accent)" }}>
                                led to the next
                            </span>
                        </h2>
                    </div>

                    {/* Right — portrait; mobile crops off the top 20% and bottom 30%, desktop shows the full natural ratio */}
                    <div
                        ref={portraitRef}
                        className="w-full max-w-[360px] mx-auto lg:mx-0 lg:order-last rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-auto"
                        style={{ border: "1px solid var(--border)" }}
                    >
                        <Image
                            src="/images/kean grad.jpg"
                            alt={personal.name}
                            width={1366}
                            height={2048}
                            quality={95}
                            sizes="(min-width: 1024px) 360px, (min-width: 640px) 360px, 100vw"
                            className="w-full h-full object-cover object-[50%_40%] lg:h-auto lg:object-contain"
                        />
                    </div>

                    {/* Left — story */}
                    <div ref={copyRef}>
                        <p
                            className="hidden lg:block text-sm tracking-widest uppercase font-medium mb-4"
                            style={{ color: "var(--accent)" }}
                        >
                            How It Started
                        </p>
                        <h2
                            className="hidden lg:block font-display text-3xl md:text-5xl font-bold leading-tight mb-6"
                            style={{ color: "var(--fg)" }}
                        >
                            One thing simply{" "}
                            <span style={{ color: "var(--accent)" }}>
                                led to the next
                            </span>
                        </h2>
                        <p
                            className="text-base md:text-lg leading-relaxed mb-10 max-w-2xl"
                            style={{ color: "var(--muted)" }}
                        >
                            {journey.intro}
                        </p>

                        <ol className="flex flex-col">
                            {journey.steps.map((step, i) => (
                                <li key={step.title} className="flex gap-5">
                                    {/* Rail */}
                                    <div className="flex flex-col items-center">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full mt-2 shrink-0"
                                            style={{ background: "var(--accent)" }}
                                        />
                                        {i < journey.steps.length - 1 && (
                                            <span
                                                className="w-px flex-1 my-2"
                                                style={{ background: "var(--border)" }}
                                            />
                                        )}
                                    </div>

                                    <div
                                        className={
                                            i < journey.steps.length - 1 ? "pb-8" : ""
                                        }
                                    >
                                        <h3
                                            className="font-display text-lg md:text-xl font-bold mb-2"
                                            style={{ color: "var(--fg)" }}
                                        >
                                            {step.title}
                                        </h3>
                                        <p
                                            className="text-sm md:text-base leading-relaxed max-w-xl"
                                            style={{ color: "var(--muted)" }}
                                        >
                                            {step.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    );
}
