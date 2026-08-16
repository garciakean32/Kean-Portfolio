"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Download } from "lucide-react";
import { personal } from "@/lib/data";
import Link from "next/link";

const navLinks = [
    { label: "About", href: "#about" },
    { label: "Work", href: "#projects" },
    { label: "Contact", href: "#contact" },
];

export default function Navbar() {
    const { resolvedTheme, setTheme } = useTheme();

    return (
        <header className="fixed top-4 left-0 right-0 z-50">
            <nav className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo pill */}
                <a
                    href="#"
                    className="flex items-center gap-2 h-11 px-5 rounded-full font-display font-bold tracking-tight"
                    style={{
                        background: "var(--surface)",
                        color: "var(--fg)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--accent)" }}
                    />
                    {personal.name.split(" ")[0]}
                </a>

                {/* Links pill */}
                <div
                    className="hidden md:flex items-center gap-1 h-11 px-2 rounded-full"
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                    }}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                            style={{ color: "var(--muted)" }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Actions pill */}
                <div
                    className="flex items-center gap-1 h-11 px-2 rounded-full"
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <button
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-full transition-colors duration-200 hover:bg-[var(--surface-hover)]"
                        style={{ color: "var(--muted)" }}
                        aria-label="Toggle theme"
                    >
                        <Sun size={16} className="hidden dark:block" />
                        <Moon size={16} className="dark:hidden" />
                    </button>
                    <a
                        href={personal.resumeUrl}
                        download
                        className="hidden md:inline-flex items-center gap-2 pl-4 pr-5 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 hover:opacity-90"
                        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
                    >
                        <Download size={14} />
                        Resume
                    </a>
                </div>
            </nav>
        </header>
    );
}
