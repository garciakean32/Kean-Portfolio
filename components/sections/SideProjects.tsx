"use client";

import { MessageCircle } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { sideProjects } from "@/lib/data";

export default function SideProjects() {
    const ref = useScrollReveal<HTMLElement>();

    return (
        <section
            id="side-projects"
            ref={ref}
            className="py-24 md:py-28 snap-start flex flex-col justify-center"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl w-full mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
                    <div>
                        <p
                            className="text-sm tracking-widest uppercase font-medium mb-4"
                            style={{ color: "var(--accent)" }}
                        >
                            Internship & Side Builds
                        </p>
                        <h2
                            className="font-display text-3xl md:text-5xl font-bold leading-tight max-w-2xl"
                            style={{ color: "var(--fg)" }}
                        >
                            Learning at work, then{" "}
                            <span style={{ color: "var(--accent)" }}>building</span> on my
                            own time
                        </h2>
                    </div>
                    <p
                        className="text-sm md:text-base leading-relaxed max-w-sm"
                        style={{ color: "var(--muted)" }}
                    >
                        {sideProjects.intro}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 gsap-stagger">
                    {sideProjects.highlights.map((item) => (
                        <div
                            key={item.title}
                            className="flex flex-col gap-3 rounded-3xl p-8"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <span
                                className="text-xs font-medium"
                                style={{ color: "var(--accent)" }}
                            >
                                {item.label}
                            </span>
                            <h3
                                className="font-display text-xl font-bold"
                                style={{ color: "var(--fg)" }}
                            >
                                {item.title}
                            </h3>
                            <p
                                className="text-sm md:text-base leading-relaxed"
                                style={{ color: "var(--muted)" }}
                            >
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Chatbot note */}
                <div
                    className="flex items-start gap-4 rounded-3xl p-7 md:p-8"
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <span
                        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                        style={{
                            background: "var(--accent)",
                            color: "var(--accent-fg)",
                        }}
                    >
                        <MessageCircle size={16} />
                    </span>
                    <p
                        className="text-sm md:text-base leading-relaxed max-w-3xl"
                        style={{ color: "var(--muted)" }}
                    >
                        {sideProjects.note}
                    </p>
                </div>
            </div>
        </section>
    );
}
