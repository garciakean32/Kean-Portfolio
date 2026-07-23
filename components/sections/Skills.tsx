"use client";

import { useScrollReveal } from "@/lib/useScrollReveal";
import { skills } from "@/lib/data";

export default function Skills() {
    const ref = useScrollReveal<HTMLElement>();

    return (
        <section
            id="skills"
            ref={ref}
            className="py-24 md:py-28 snap-start flex flex-col justify-center"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl w-full mx-auto px-6">
                <p
                    className="text-sm tracking-widest uppercase font-medium mb-4"
                    style={{ color: "var(--accent)" }}
                >
                    Skills & Stack
                </p>
                <h2
                    className="font-display text-3xl md:text-5xl font-bold leading-tight mb-14"
                    style={{ color: "var(--fg)" }}
                >
                    Tools I work with
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 gsap-stagger">
                    {skills.map((group, i) => (
                        <div
                            key={group.category}
                            className="rounded-3xl p-8"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span
                                    className="font-display text-xl font-bold"
                                    style={{ color: "var(--fg)" }}
                                >
                                    {group.category}
                                </span>
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: "var(--muted)" }}
                                >
                                    0{i + 1}
                                </span>
                            </div>

                            <ul className="flex flex-wrap gap-2">
                                {group.items.map((skill) => (
                                    <li
                                        key={skill}
                                        className="px-4 py-2 rounded-full text-sm font-medium"
                                        style={{
                                            background: "var(--bg)",
                                            border: "1px solid var(--border)",
                                            color: "var(--fg)",
                                        }}
                                    >
                                        {skill}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
