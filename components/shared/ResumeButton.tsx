"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { personal } from "@/lib/data";
import { useBackToClose } from "@/lib/history";
import { getLenis } from "@/lib/lenis";
import { cn } from "@/lib/utils";

/** How long the exit animation is given before the dialog is dropped anyway. */
const EXIT_FALLBACK = 400;

/* The PDF in the browser's own viewer, fitted to the frame's width and
   without the viewer's toolbar — the dialog has its own download. */
const PREVIEW = `${encodeURI(personal.resumeUrl)}#toolbar=0&navpanes=0&view=FitH`;

/* Whether the browser can show a PDF inline at all — most phones cannot,
   and hand the file off to be downloaded instead. Assumed so on the server. */
const canPreview = () => navigator.pdfViewerEnabled !== false;
/* Nothing to subscribe to — the browser does not change under a page. */
const still = () => () => {};

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
 * Not everyone wants the file — so the button opens the resume itself, in
 * a dialog, to be read there; downloading it is the dialog's to offer, with
 * Cancel and its X to back out. Where the browser cannot show a PDF inline,
 * the frame offers it in a new tab instead.
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
    const inline = useSyncExternalStore(still, canPreview, () => true);

    const open = phase !== "closed";
    const close = () => setPhase((current) => (current === "open" ? "closing" : current));

    // The phone's back button is Cancel, not a way off the site.
    useBackToClose(phase === "open", close);

    useEffect(() => {
        if (phase !== "closing") return;
        const drop = window.setTimeout(() => setPhase("closed"), EXIT_FALLBACK);
        return () => window.clearTimeout(drop);
    }, [phase]);

    useEffect(() => {
        if (!open) return;
        const trigger = opener.current;
        const previous = document.body.style.overflow;
        const lenis = getLenis();
        document.body.style.overflow = "hidden";
        lenis?.stop();
        confirm.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            lenis?.start();
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
                        // Black rather than `bg-ink/50`: `--ink` is the
                        // colour of *text* on whatever surface the button
                        // happens to stand on, which on this page's dark
                        // ground is white — so the scrim was washing the page
                        // out instead of dropping it back. A scrim is not
                        // themed by the panel it opens from; it darkens.
                        className="dialog-scrim absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={close}
                    />

                    <div
                        ref={panel}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="resume-dialog-title"
                        className="dialog-panel relative flex h-full max-h-[56rem] w-full max-w-3xl flex-col rounded-lg border border-rule bg-paper-2 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4 p-5 md:px-7 md:pt-6">
                            <div>
                                <p className="font-mono text-label uppercase text-ink-3">Resume</p>
                                <h2
                                    id="resume-dialog-title"
                                    className="mt-2 font-display text-d1 font-bold tracking-[-0.02em] text-ink"
                                >
                                    {personal.name}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Close"
                                className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 transition-colors duration-300 hover:bg-ink/10 hover:text-ink"
                            >
                                <X size={20} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mx-5 min-h-0 flex-1 overflow-hidden rounded border border-rule bg-paper-3 md:mx-7">
                            {inline ? (
                                <iframe
                                    src={PREVIEW}
                                    title={`${personal.name}'s resume`}
                                    className="h-full w-full bg-white"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                                    <DocumentIcon className="h-8 w-8 text-ink-3" />
                                    <p className="max-w-xs text-body text-ink-2">
                                        This browser can&apos;t show the PDF here.
                                    </p>
                                    <a
                                        href={personal.resumeUrl}
                                        target="_blank"
                                        rel="noopener"
                                        className="link-rule font-mono text-label uppercase text-ink"
                                    >
                                        Open it in a new tab
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 p-5 md:px-7 md:pb-6">
                            <button
                                type="button"
                                onClick={close}
                                className="rounded border border-rule-strong px-6 py-3 font-mono text-label uppercase text-ink-2 transition-colors duration-300 hover:border-ink hover:text-ink"
                            >
                                Cancel
                            </button>
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
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
