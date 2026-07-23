"use client";

import { useScrollReveal } from "@/lib/useScrollReveal";
import { projects } from "@/lib/data";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export default function Projects() {
    const ref = useScrollReveal<HTMLElement>();

    return (
        <section
            id="projects"
            ref={ref}
            className="py-24 md:py-28 snap-start flex flex-col justify-center"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl w-full mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
                    <div>
                        <p
                            className="text-sm tracking-widest uppercase font-medium mb-4"
                            style={{ color: "var(--accent)" }}
                        >
                            Selected Work
                        </p>
                        <h2
                            className="font-display text-3xl md:text-5xl font-bold leading-tight"
                            style={{ color: "var(--fg)" }}
                        >
                            Projects I&apos;ve built
                        </h2>
                    </div>
                    <p
                        className="text-sm md:text-base max-w-xs"
                        style={{ color: "var(--muted)" }}
                    >
                        Full-stack products, live and in use — click one to try it
                        yourself.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 gsap-stagger">
                    {projects.map((project, i) => (
                        <a
                            key={project.id}
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-5"
                        >
                            {/* Image */}
                            <div
                                className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden"
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    sizes="(min-width: 768px) 50vw, 100vw"
                                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            </div>

                            {/* Meta */}
                            <div className="flex items-start justify-between gap-4 px-1">
                                <div>
                                    <span
                                        className="text-xs font-medium block mb-1"
                                        style={{ color: "var(--muted)" }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <h3
                                        className="font-display text-xl md:text-2xl font-bold mb-2"
                                        style={{ color: "var(--fg)" }}
                                    >
                                        {project.title}
                                    </h3>
                                    <p
                                        className="text-sm md:text-base leading-relaxed"
                                        style={{ color: "var(--muted)" }}
                                    >
                                        {project.description}
                                    </p>
                                </div>
                                <span
                                    className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 mt-1 transition-colors duration-200 group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-fg)] group-hover:border-transparent"
                                    style={{
                                        border: "1px solid var(--border)",
                                        color: "var(--fg)",
                                    }}
                                >
                                    <ArrowUpRight size={16} />
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
