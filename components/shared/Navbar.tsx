"use client";

import { useEffect, useState } from "react";
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
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
                background: scrolled ? "var(--bg)" : "transparent",
                borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
            }}
        >
            <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <a
                    href="#"
                    className="font-display text-lg font-bold tracking-tight"
                    style={{ color: "var(--fg)" }}
                >
                    {personal.name.split(" ")[0]}.
                </a>

                {/* Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="font-mono text-sm transition-colors duration-200"
                            style={{ color: "var(--muted)" }}
                            onMouseEnter={(e) =>
                                ((e.target as HTMLElement).style.color = "var(--fg)")
                            }
                            onMouseLeave={(e) =>
                                ((e.target as HTMLElement).style.color = "var(--muted)")
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-full transition-colors duration-200"
                            style={{ color: "var(--muted)" }}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    )}
                    <a
                        href={personal.resumeUrl}
                        download
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-mono border transition-all duration-200"
                        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--fg)";
                            (e.currentTarget as HTMLElement).style.color = "var(--bg)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "var(--fg)";
                        }}
                    >
                        <Download size={14} />
                        Resume
                    </a>
                </div >
            </nav >
        </header >
    );
}