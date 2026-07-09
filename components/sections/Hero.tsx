"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { personal } from "@/lib/data";

const roles = [
    "Full-Stack Developer",
    "Fresh IT Graduate",
    "Good Communicator eyy",
];

export default function Hero() {
    const [roleIndex, setRoleIndex] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [charIndex, setCharIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Typewriter effect
    useEffect(() => {
        const current = roles[roleIndex];
        let timeout: ReturnType<typeof setTimeout>;

        if (!deleting && charIndex < current.length) {
            timeout = setTimeout(() => {
                setDisplayed(current.slice(0, charIndex + 1));
                setCharIndex((i) => i + 1);
            }, 80);
        } else if (!deleting && charIndex === current.length) {
            timeout = setTimeout(() => setDeleting(true), 2000);
        } else if (deleting && charIndex > 0) {
            timeout = setTimeout(() => {
                setDisplayed(current.slice(0, charIndex - 1));
                setCharIndex((i) => i - 1);
            }, 40);
        } else if (deleting && charIndex === 0) {
            setDeleting(false);
            setRoleIndex((i) => (i + 1) % roles.length);
        }

        return () => clearTimeout(timeout);
    }, [charIndex, deleting, roleIndex]);

    // Parallax on scroll
    useEffect(() => {
        const onScroll = () => {
            if (containerRef.current) {
                const y = window.scrollY;
                containerRef.current.style.transform = `translateY(${y * 0.25}px)`;
                containerRef.current.style.opacity = `${1 - y / 600}`;
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <section
            id="hero"
            className="relative min-h-screen flex flex-col justify-center overflow-hidden snap-start"
            style={{ background: "var(--bg)" }}
        >
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            <div ref={containerRef} className="max-w-6xl mx-auto px-6 pt-24 pb-16">
                {/* Tag */}
                <p
                    className="font-mono text-sm mb-6 tracking-widest uppercase"
                    style={{ color: "var(--accent)" }}
                >
                    Available for work
                </p>

                {/* Headline */}
                <h1
                    className="font-display text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight mb-6"
                    style={{ color: "var(--fg)" }}
                >
                    {personal.name.split(" ")[0]}
                    <br />
                    <span
                        style={{
                            color: "var(--muted)",
                            fontStyle: "italic",
                            fontWeight: 400,
                        }}
                    >
                        {personal.name.split(" ").slice(1).join(" ")}
                    </span>
                </h1>

                {/* Typewriter role */}
                <div className="flex items-center gap-3 mb-10">
                    <span
                        className="font-mono text-lg md:text-2xl"
                        style={{ color: "var(--fg)" }}
                    >
                        {displayed}
                    </span>
                    <span
                        className="inline-block w-[2px] h-6 animate-cursor-blink"
                        style={{ background: "var(--accent)" }}
                    />
                </div>

                {/* Description */}
                <p
                    className="max-w-xl text-lg leading-relaxed mb-12"
                    style={{ color: "var(--muted)" }}
                >
                    {personal.bio}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 mb-16">
                    <Link
                        href="#projects"
                        className="inline-flex items-center gap-2 px-8 py-4 font-mono text-sm font-medium transition-all duration-300 hover:gap-4"
                        style={{ background: "var(--fg)", color: "var(--bg)" }}
                    >
                        View My Work
                        <ArrowDown size={14} />
                    </Link>
                    <Link
                        href="#contact"
                        className="inline-flex items-center gap-2 px-8 py-4 font-mono text-sm border transition-all duration-300"
                        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                "var(--surface-hover)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                    >
                        Get In Touch
                    </Link>
                </div>

                {/* Divider */}
                <div className="divider" />
            </div>

            {/* Scroll indicator */}
            <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                style={{ color: "var(--muted)" }}
            >
                <span className="font-mono text-xs tracking-widest uppercase">
                    Scroll
                </span>
                <div
                    className="w-[1px] h-12"
                    style={{
                        background: "linear-gradient(to bottom, var(--muted), transparent)",
                    }}
                />
            </div>
        </section>
    );
}