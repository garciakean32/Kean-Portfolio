"use client";

import Image from "next/image";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { personal, stats } from "@/lib/data";

export default function About() {
    const ref = useScrollReveal<HTMLElement>();

    return (
        <section
            id="about"
            ref={ref}
            className="py-32 gsap-fade-up snap-start"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl mx-auto px-6">
                {/* Section label */}
                <p
                    className="font-mono text-sm tracking-widest uppercase mb-16"
                    style={{ color: "var(--accent)" }}
                >
                    About Me
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                    {/* Left — Text */}
                    <div>
                        <h2
                            className="font-display text-4xl md:text-5xl font-bold leading-tight mb-8"
                            style={{ color: "var(--fg)" }}
                        >
                            I turn ideas into
                            <span style={{ fontStyle: "italic", fontWeight: 400 }}>
                                {" "}real products.
                            </span>
                        </h2>
                        <p
                            className="text-lg leading-relaxed mb-6"
                            style={{ color: "var(--muted)" }}
                        >
                            {personal.bio}
                        </p>
                        <p
                            className="text-lg leading-relaxed"
                            style={{ color: "var(--muted)" }}
                        >
                            {personal.bioExtended}
                        </p>
                    </div>

                    {/* Right — Image + Stats */}
                    <div className="flex flex-col gap-10">
                        {/* Profile image */}
                        <div
                            className="w-full aspect-square relative overflow-hidden"
                            style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}
                        >
                            <Image
                                src="/images/kean.png"
                                alt="Kean"
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="object-cover"
                            />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6">
                            {stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col gap-1">
                                    <span
                                        className="font-display text-4xl font-bold"
                                        style={{ color: "var(--fg)" }}
                                    >
                                        {stat.value}
                                    </span>
                                    <span
                                        className="font-mono text-xs tracking-wide"
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
