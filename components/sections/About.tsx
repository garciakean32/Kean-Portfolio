"use client";

import Image from "next/image";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { personal, skills, stats } from "@/lib/data";

const marqueeItems = skills.flatMap((group) => group.items);

export default function About() {
    const ref = useScrollReveal<HTMLElement>();

    return (
        <section
            id="about"
            ref={ref}
            className="py-24 md:py-28 gsap-fade-up snap-start flex flex-col justify-center"
            style={{ background: "var(--bg)" }}
        >
            {/* Tech marquee */}
            <div className="marquee mb-20 md:mb-24" aria-hidden="true">
                {[0, 1].map((track) => (
                    <div key={track} className="marquee-track">
                        {marqueeItems.map((item) => (
                            <span
                                key={`${track}-${item}`}
                                className="flex items-center gap-6 pr-6 font-display text-2xl md:text-3xl font-bold whitespace-nowrap"
                                style={{ color: "var(--muted)", opacity: 0.5 }}
                            >
                                {item}
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: "var(--accent)" }}
                                />
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <div className="max-w-6xl w-full mx-auto px-6">
                <p
                    className="text-sm tracking-widest uppercase font-medium mb-4"
                    style={{ color: "var(--accent)" }}
                >
                    About Me
                </p>
                <h2
                    className="font-display text-3xl md:text-5xl font-bold leading-tight mb-14 max-w-2xl"
                    style={{ color: "var(--fg)" }}
                >
                    Turning ideas into{" "}
                    <span style={{ color: "var(--accent)" }}>real products</span> that
                    work end to end
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-16 items-start">
                    {/* Left — portrait */}
                    <div
                        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden"
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <Image
                            src="/images/kean about me.png"
                            alt={personal.name}
                            fill
                            sizes="(min-width: 1024px) 340px, 100vw"
                            className="object-cover object-[center_35%]"
                        />
                    </div>

                    {/* Right — bio + stats */}
                    <div>
                        <p
                            className="text-base md:text-lg leading-relaxed mb-4 max-w-2xl"
                            style={{ color: "var(--muted)" }}
                        >
                            {personal.bio}
                        </p>
                        <p
                            className="text-base md:text-lg leading-relaxed mb-12 max-w-2xl"
                            style={{ color: "var(--muted)" }}
                        >
                            {personal.bioExtended}
                        </p>

                        <div className="grid grid-cols-3 gap-4 max-w-lg">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex flex-col gap-1 rounded-2xl p-5"
                                    style={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <span
                                        className="font-display text-3xl md:text-4xl font-bold"
                                        style={{ color: "var(--accent)" }}
                                    >
                                        {stat.value}
                                    </span>
                                    <span
                                        className="text-xs md:text-sm"
                                        style={{ color: "var(--muted)" }}
                                    >
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
