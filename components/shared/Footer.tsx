"use client";

import Link from "next/link";
import { personal, routes } from "@/lib/data";
import ResumeButton from "./ResumeButton";

const socials = [
    { href: personal.social.github, label: "GitHub" },
    { href: personal.social.instagram, label: "Instagram" },
    { href: personal.social.facebook, label: "Facebook" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-rule bg-paper-2">
            <div className="shell mx-auto max-w-shell py-14 md:py-20">
                <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
                    <div>
                        <p className="font-display text-[1.0625rem] font-medium tracking-[-0.01em] text-ink">
                            {personal.name}
                        </p>
                        <p className="mt-6 max-w-xs font-serif text-lead text-ink-2">
                            Available for new work.
                        </p>
                        <a
                            href={`mailto:${personal.email}`}
                            className="link-rule tap mt-3 inline-block font-mono text-meta lowercase text-ink"
                        >
                            {personal.email}
                        </a>
                        <div className="mt-8">
                            <ResumeButton />
                        </div>
                    </div>

                    <nav aria-label="Footer">
                        <h2 className="font-mono text-label uppercase text-ink-3">Index</h2>
                        <ul className="mt-5 space-y-5">
                            {routes.map((route) => (
                                <li key={route.href}>
                                    <Link
                                        href={route.href}
                                        className="link-rule tap inline-flex items-baseline gap-2.5 text-body text-ink-2 transition-colors hover:text-ink"
                                    >
                                        <span className="font-mono text-label text-ink-3">
                                            {route.index}
                                        </span>
                                        {route.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <h2 className="font-mono text-label uppercase text-ink-3">Elsewhere</h2>
                        <ul className="mt-5 space-y-5">
                            {socials.map((social) => (
                                <li key={social.label}>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-rule tap inline-block text-body text-ink-2 transition-colors hover:text-ink"
                                    >
                                        {social.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-14 flex flex-col gap-3 border-t border-rule pt-6 font-mono text-meta uppercase tracking-[0.12em] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        © {year} {personal.name}
                    </span>
                    <span>{personal.coordinates}</span>
                    <span>
                        {personal.location} · {personal.timezone}
                    </span>
                </div>
            </div>
        </footer>
    );
}
