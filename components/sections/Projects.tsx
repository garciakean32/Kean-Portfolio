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
                            className="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded-lg overflow-hidden transition-all duration-300 group"
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
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{ color: "var(--muted)" }}
                                >
                                    <span className="font-mono text-sm">
                                        [ Project Image Here ]
                                    </span>
                                </div>
                                {/* Overlay on hover */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4"
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
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-white border border-white hover:bg-white hover:text-black transition-all duration-200"
                                    >
                                        Code{" "}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                                        </svg>
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