"use client";

import { useEffect, useRef, useState } from "react";
import { personal } from "@/lib/data";
import { cn } from "@/lib/utils";

/** How long the exit animation is given before the dialog is dropped anyway. */
const EXIT_FALLBACK = 400;

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
 *
 * The dialog leaves as deliberately as it arrives, which is the only reason
 * there is a third state: `closing` keeps it mounted while its exit animation
 * plays out (see `.dialog-panel` in globals.css) and the animation's own end
 * retires it. The timeout behind that is a guarantee, not a duration — a
 * dialog that somehow never hears `animationend` still goes away.
 */
export default function ResumeButton({
    className,
    label = "Resume",
}: {
    className?: string;
    label?: string;
}) {
    const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
    const opener = useRef<HTMLButtonElement>(null);
    const confirm = useRef<HTMLAnchorElement>(null);
    const panel = useRef<HTMLDivElement>(null);

    const open = phase !== "closed";
    const close = () => setPhase((current) => (current === "open" ? "closing" : current));

    useEffect(() => {
        if (phase !== "closing") return;
        const drop = window.setTimeout(() => setPhase("closed"), EXIT_FALLBACK);
        return () => window.clearTimeout(drop);
    }, [phase]);

    useEffect(() => {
        if (!open) return;
        const trigger = opener.current;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        confirm.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
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
                onClick={() => setPhase("open")}
                aria-haspopup="dialog"
                className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded border border-ink px-4 py-2 font-mono text-label uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-on-ink",
                    className
                )}
            >
                {label}
                <DocumentIcon />
            </button>

            {open && (
                <div
                    data-closing={phase === "closing" ? "" : undefined}
                    onAnimationEnd={(e) => {
                        if (phase === "closing" && e.target === panel.current) {
                            setPhase("closed");
                        }
                    }}
                    className="fixed inset-0 z-[130] flex items-center justify-center p-5"
                >
                    <div
                        className="dialog-scrim absolute inset-0 bg-ink/50 backdrop-blur-sm"
                        onClick={close}
                    />

                    <div
                        ref={panel}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="resume-dialog-title"
                        aria-describedby="resume-dialog-body"
                        className="dialog-panel relative w-full max-w-md rounded-lg border border-rule bg-paper-2 p-7 shadow-xl md:p-8"
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
                                onClick={close}
                                className="inline-flex items-center gap-2 rounded border border-ink bg-ink px-6 py-3 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink"
                            >
                                Download
                                <DocumentIcon />
                            </a>
                            <button
                                type="button"
                                onClick={close}
                                className="rounded border border-rule-strong px-6 py-3 font-mono text-label uppercase text-ink-2 transition-colors duration-300 hover:border-ink hover:text-ink"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
