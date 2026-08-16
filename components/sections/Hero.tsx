"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { personal } from "@/lib/data";

export default function Hero() {
    return (
        <section
            id="hero"
            className="relative min-h-screen flex flex-col justify-end overflow-hidden snap-start pb-10 lg:pb-14"
            style={{ background: "var(--bg)" }}
        >
            <div className="w-full max-w-6xl mx-auto px-6 pt-16 lg:pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-8 items-start">
                    {/* Left — availability + role */}
                    <div className="order-3 lg:order-1 lg:self-start lg:pt-6">
                        <span
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--fg)",
                            }}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: "var(--accent)" }}
                            />
                            Available for Work
                        </span>
                        <h2
                            className="font-display text-2xl md:text-3xl font-semibold leading-snug"
                            style={{ color: "var(--fg)" }}
                        >
                            Full-Stack Developer
                            <br />
                            based in the Philippines
                        </h2>
                    </div>

                    {/* Center — portrait, faded at the edges so it blends into the page */}
                    <div className="order-1 lg:order-2 flex justify-center w-full mt-6 lg:mt-0">
                        <div
                            className="relative w-full max-w-[16.5rem] sm:max-w-sm lg:w-[26rem] lg:max-w-none h-[42vh] sm:h-[52vh] lg:h-[72vh] overflow-hidden"
                            style={{
                                WebkitMaskImage:
                                    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                                WebkitMaskComposite: "source-in",
                                maskImage:
                                    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                                maskComposite: "intersect",
                            }}
                        >
                            <Image
                                src="/images/kean hero.jpg"
                                alt={personal.name}
                                fill
                                priority
                                sizes="(min-width: 1024px) 26rem, 90vw"
                                className="object-cover object-[center_20%]"
                            />
                        </div>
                    </div>

                    {/* Right — intro + CTA */}
                    <div className="order-4 lg:order-3 lg:self-start lg:pt-6 lg:justify-self-end lg:max-w-xs">
                        <p
                            className="text-sm md:text-base leading-relaxed mb-6"
                            style={{ color: "var(--muted)" }}
                        >
                            Hi, I&apos;m {personal.name.split(" ")[0]} — a full-stack
                            developer who enjoys turning ideas into clean, working web
                            products from front to back.
                        </p>
                        <a
                            href="#projects"
                            className="inline-flex items-center gap-2 pl-2 pr-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 hover:opacity-90"
                            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
                        >
                            <span
                                className="flex items-center justify-center w-8 h-8 rounded-full"
                                style={{ background: "var(--accent-fg)", color: "var(--accent)" }}
                            >
                                <ArrowRight size={14} />
                            </span>
                            See my works
                        </a>
                    </div>

                    {/* Giant name — overlaps the bottom of the portrait */}
                    <h1
                        className="order-2 lg:order-4 lg:col-span-3 relative z-10 font-display font-black tracking-tight text-center leading-[0.8] select-none -mt-16 sm:-mt-24 lg:-mt-40 pb-4 text-[clamp(4rem,30vw,10rem)] lg:text-[clamp(3.5rem,15vw,16rem)]"
                        style={{ color: "var(--fg)" }}
                    >
                        {personal.name.split(" ")[0]}
                    </h1>
                </div>
            </div>
        </section>
    );
}
