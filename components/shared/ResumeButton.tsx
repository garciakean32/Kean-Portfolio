"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { personal } from "@/lib/data";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function DocumentIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={cn("h-3.5 w-3.5 shrink-0", className)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.5 1.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5z" />
            <path d="M9.5 1.5v3h3" />
            <path d="M5.75 8.5h4.5M5.75 11h3" />
        </svg>
    );
}

/**
 * Downloading is a decision, not a side effect of a stray click — so the
 * button asks first and the visitor confirms or backs out.
 */
export default function ResumeButton({
    className,
    label = "Resume",
}: {
    className?: string;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();
    const opener = useRef<HTMLButtonElement>(null);
    const confirm = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (!open) return;
        const trigger = opener.current;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        confirm.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
            trigger?.focus();
        };
    }, [open]);

    return (
        <>
            <button
                ref={opener}
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                className={cn(
                    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded border border-ink px-4 py-2 font-mono text-label uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-on-ink",
                    className
                )}
            >
                {label}
                <DocumentIcon />
            </button>

            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-5">
                        <motion.div
                            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.25 }}
                            onClick={() => setOpen(false)}
                        />

                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="resume-dialog-title"
                            aria-describedby="resume-dialog-body"
                            className="relative w-full max-w-md rounded-lg border border-rule bg-paper-2 p-7 shadow-xl md:p-8"
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: reduce ? 0.12 : 0.35, ease: EASE_OUT }}
                        >
                            <p className="font-mono text-label uppercase text-ink-3">
                                Download
                            </p>
                            <h2
                                id="resume-dialog-title"
                                className="mt-3 font-display text-d1 font-bold tracking-[-0.02em] text-ink"
                            >
                                Save my resume?
                            </h2>
                            <p
                                id="resume-dialog-body"
                                className="mt-3 text-body text-ink-2"
                            >
                                A PDF of {personal.name}&apos;s resume will be saved to your
                                device.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <a
                                    ref={confirm}
                                    href={personal.resumeUrl}
                                    download
                                    onClick={() => setOpen(false)}
                                    className="inline-flex items-center gap-2 rounded border border-ink bg-ink px-6 py-3 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink"
                                >
                                    Download
                                    <DocumentIcon />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="rounded border border-rule-strong px-6 py-3 font-mono text-label uppercase text-ink-2 transition-colors duration-300 hover:border-ink hover:text-ink"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
