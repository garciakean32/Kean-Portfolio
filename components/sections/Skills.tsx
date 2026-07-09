"use client";

import { useScrollReveal } from "@/lib/useScrollReveal";
import { skills } from "@/lib/data";

export default function Skills() {
    const ref = useScrollReveal<HTMLElement>();

    return (
        <section
            id="skills"
            ref={ref}
            className="py-32"
            style={{ background: "var(--surface)" }}
        >
            <div className="max-w-6xl mx-auto px-6">
                {/* Section label */}
                <p
                    className="font-mono text-sm tracking-widest uppercase mb-16"
                    style={{ color: "var(--accent)" }}
                >
                    Skills & Stack
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 gsap-stagger">
                    {skills.map((group, i) => (
                        <div key={group.category}>
                            {/* Category number + title */}
                            <div className="flex items-center gap-4 mb-8">
                                <span
                                    className="font-mono text-xs"
                                    style={{ color: "var(--muted)" }}
                                >
                                    0{i + 1}
                                </span>
                                <div className="flex-1 divider" />
                                <span
                                    className="font-display text-xl font-bold"
                                    style={{ color: "var(--fg)" }}
                                >
                                    {group.category}
                                </span>
                            </div>

                            {/* Skills list */}
                            <ul className="flex flex-col gap-4">
                                {group.items.map((skill) => (
                                    <li
                                        key={skill}
                                        className="flex items-center justify-between py-3 border-b transition-all duration-200 group rounded-sm"
                                        style={{ borderColor: "var(--border)" }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.paddingLeft = "8px";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.paddingLeft = "0px";
                                        }}
                                    >
                                        <span
                                            className="font-mono text-sm transition-colors duration-200"
                                            style={{ color: "var(--fg)" }}
                                        >
                                            {skill}
                                        </span>
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: "var(--accent)" }}
                                        />
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