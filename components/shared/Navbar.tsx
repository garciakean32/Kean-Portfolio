"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { personal, routes } from "@/lib/data";
import { getLenis } from "@/lib/lenis";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import ResumeButton from "./ResumeButton";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
    const pathname = usePathname();
    const [condensed, setCondensed] = useState(false);
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();

    // One passive listener, no per-frame work: the bar only has two states.
    useEffect(() => {
        const onScroll = () => setCondensed(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        // Covers arriving part-way down the page (reload, or a hash link).
        const id = window.setTimeout(onScroll, 0);
        return () => {
            window.clearTimeout(id);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    // Close the menu whenever the route changes, including via back/forward.
    const [lastPath, setLastPath] = useState(pathname);
    if (lastPath !== pathname) {
        setLastPath(pathname);
        if (open) setOpen(false);
    }

    // Keep the page from scrolling underneath the open menu. Lenis drives
    // scroll itself, so overflow:hidden alone doesn't stop it — it needs to
    // be paused too.
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        getLenis()?.stop();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            getLenis()?.start();
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const t = reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT };

    return (
        <>
            {/* `data-chrome`: held out of frame while the hero's cinematic
                open runs — see the gate in globals.css. */}
            <header
                data-chrome
                className="fixed inset-x-0 top-0 z-50"
                data-condensed={condensed ? "true" : "false"}
            >
                {/* Backdrop — grows down from the top edge once the hero is behind us */}
                <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 origin-top bg-paper/80 backdrop-blur-md"
                    initial={false}
                    animate={{ scaleY: condensed ? 1 : 0, opacity: condensed ? 1 : 0 }}
                    transition={t}
                />
                <motion.div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px origin-left bg-rule"
                    initial={false}
                    animate={{ scaleX: condensed ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT }}
                />

                <motion.nav
                    className="relative flex items-center justify-between gap-6 pl-[var(--gutter)] pr-[var(--gutter)] lg:pl-[calc(var(--rail)+var(--gutter))]"
                    initial={false}
                    animate={{ paddingTop: condensed ? 14 : 30, paddingBottom: condensed ? 14 : 30 }}
                    transition={t}
                >
                    <Link href="/" aria-label={`${personal.name} — home`}>
                        <Logo condensed={condensed} reduce={!!reduce} />
                    </Link>

                    {/* Routes */}
                    <ul className="hidden items-center gap-8 lg:flex">
                        {routes.slice(1).map((route) => (
                            <li key={route.href} className="relative">
                                <Link
                                    href={route.href}
                                    aria-current={isActive(route.href) ? "page" : undefined}
                                    className={cn(
                                        "group flex items-baseline gap-1.5 py-1 font-mono text-label uppercase transition-colors duration-300",
                                        isActive(route.href)
                                            ? "text-ink"
                                            : "text-ink-3 hover:text-ink"
                                    )}
                                >
                                    <span className="text-[0.5625rem] text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        {route.index}
                                    </span>
                                    {route.label}
                                </Link>
                                {isActive(route.href) && (
                                    <motion.span
                                        layoutId="nav-active"
                                        className="absolute -bottom-0.5 left-0 right-0 h-px rounded-full bg-accent"
                                        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-3">
                        {/* `inline-flex`, not `inline-block` — the latter won a
                            tailwind-merge tie and dropped the button out of flex
                            layout, so the label and icon wrapped onto two rows. */}
                        <ResumeButton className="hidden lg:inline-flex" />
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={open}
                            aria-controls="mobile-menu"
                            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] lg:hidden"
                        >
                            <span className="h-px w-5 rounded-full bg-ink" />
                            <span className="h-px w-5 rounded-full bg-ink" />
                        </button>
                    </div>
                </motion.nav>
            </header>

            <MobileMenu open={open} onClose={() => setOpen(false)} isActive={isActive} />
        </>
    );
}

function MobileMenu({
    open,
    onClose,
    isActive,
}: {
    open: boolean;
    onClose: () => void;
    isActive: (href: string) => boolean;
}) {
    const reduce = useReducedMotion();

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    id="mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site menu"
                    className="fixed inset-0 z-[60] flex flex-col bg-paper lg:hidden"
                    initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                    animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
                    exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                    transition={reduce ? { duration: 0.15 } : { duration: 0.6, ease: EASE_OUT }}
                >
                    <div className="flex items-center justify-between px-[var(--gutter)] py-[30px]">
                        <Logo condensed reduce={!!reduce} />
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close menu"
                            autoFocus
                            className="relative h-9 w-9"
                        >
                            <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-ink" />
                            <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-ink" />
                        </button>
                    </div>

                    <nav className="flex flex-1 flex-col justify-center px-[var(--gutter)]">
                        <ul>
                            {routes.map((route, i) => (
                                <motion.li
                                    key={route.href}
                                    className="border-t border-rule last:border-b"
                                    initial={reduce ? false : { opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={
                                        reduce
                                            ? { duration: 0 }
                                            : { duration: 0.5, delay: 0.15 + i * 0.06, ease: EASE_OUT }
                                    }
                                >
                                    <Link
                                        href={route.href}
                                        onClick={onClose}
                                        aria-current={isActive(route.href) ? "page" : undefined}
                                        className="flex items-baseline justify-between gap-4 py-5"
                                    >
                                        <span className="flex items-baseline gap-3">
                                            <span className="font-mono text-label text-accent">
                                                {route.index}
                                            </span>
                                            <span
                                                className={cn(
                                                    "font-display text-d2 font-semibold tracking-[-0.03em]",
                                                    isActive(route.href) ? "text-ink" : "text-ink-2"
                                                )}
                                            >
                                                {route.label}
                                            </span>
                                        </span>
                                        <span className="font-jp text-sm text-ink-3">{route.jp}</span>
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex items-center justify-between gap-4 px-[var(--gutter)] pb-10 pt-6">
                        <a
                            href={`mailto:${personal.email}`}
                            className="font-mono text-meta lowercase text-ink-2"
                        >
                            {personal.email}
                        </a>
                        <ResumeButton />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
