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
            className="py-32"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl mx-auto px-6">
                {/* Section label */}
                <p
                    className="font-mono text-sm tracking-widest uppercase mb-16"
                    style={{ color: "var(--accent)" }}
                >
                    Selected Work
                </p>

                <div className="flex flex-col gap-6 gsap-stagger">
                    {projects.map((project, i) => (
                        <div
                            key={project.id}
                            className="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded-lg overflow-hidden transition-all duration-100 group"
                            style={{ borderColor: "var(--border)" }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor =
                                    "var(--fg)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor =
                                    "var(--border)";
                            }}
                        >
                            {/* Image */}
                            <div
                                className="relative w-full aspect-video overflow-hidden"
                                style={{ background: "var(--surface-hover)" }}
                            >
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    sizes="(min-width: 768px) 50vw, 100vw"
                                    className="object-cover"
                                />
                                {/* Overlay on hover */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4"
                                    style={{ background: "rgba(0,0,0,0.6)" }}
                                >
                                    <a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-white border border-white hover:bg-white hover:text-black transition-all duration-200"
                                    >
                                        Live <ArrowUpRight size={12} />
                                    </a>
                                </div>
                            </div>

                            {/* Content */}
                            < div
                                className="flex flex-col justify-between p-8 border-l"
                                style={{ borderColor: "var(--border)" }}
                            >
                                <div>
                                    {/* Project number */}
                                    <span
                                        className="font-mono text-xs mb-4 block"
                                        style={{ color: "var(--muted)" }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>

                                    {/* Title */}
                                    <h3
                                        className="font-display text-2xl md:text-3xl font-bold mb-4"
                                        style={{ color: "var(--fg)" }}
                                    >
                                        {project.title}
                                    </h3>

                                    {/* Description */}
                                    <p
                                        className="text-base leading-relaxed mb-6"
                                        style={{ color: "var(--muted)" }}
                                    >
                                        {project.description}
                                    </p>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="font-mono text-xs px-3 py-1 border"
                                            style={{
                                                borderColor: "var(--border)",
                                                color: "var(--muted)",
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div >
        </section >
    );
}