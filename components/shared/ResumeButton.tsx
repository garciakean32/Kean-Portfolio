"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";
import ResumeFocus from "@/components/shared/ResumeFocus";
import { personal } from "@/lib/data";
import { useBackToClose } from "@/lib/history";
import { getLenis } from "@/lib/lenis";
import { drawPage, pdfPage } from "@/lib/pdf";
import { cn } from "@/lib/utils";

/** How long the exit animation is given before the dialog is dropped anyway. */
const EXIT_FALLBACK = 400;

const TITLE = `${personal.name}'s résumé`;

/**
 * The page in the dialog, drawn by PDF.js to the size it is shown at — and
 * drawn again, sharper, only if it is shown larger. The whole of it is a
 * button into the up-close view.
 */
function PagePreview({ onOpen, opener }: { onOpen: () => void; opener: React.RefObject<HTMLButtonElement | null> }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

    useEffect(() => {
        const box = opener.current;
        const c = canvas.current;
        if (!box || !c) return;
        let gone = false;
        let drawn = 0;
        let task: ReturnType<typeof drawPage> | null = null;
        let observer: ResizeObserver | null = null;
        pdfPage(personal.resumeUrl)
            .then((page) => {
                if (gone) return;
                const draw = () => {
                    const width = Math.round(box.clientWidth * Math.min(window.devicePixelRatio || 1, 2.5));
                    if (width <= drawn) return;
                    drawn = width;
                    task?.cancel();
                    task = drawPage(page, c, width);
                    task.promise.then(
                        () => !gone && setState("ready"),
                        () => undefined
                    );
                };
                draw();
                observer = new ResizeObserver(draw);
                observer.observe(box);
            })
            .catch(() => !gone && setState("failed"));
        return () => {
            gone = true;
            task?.cancel();
            observer?.disconnect();
        };
    }, [opener]);

    if (state === "failed") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-[#111111]">
                <DocumentIcon className="h-8 w-8 opacity-50" />
                <p className="max-w-[16rem] text-body opacity-70">The preview couldn&apos;t load.</p>
                <a
                    href={personal.resumeUrl}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-label uppercase underline underline-offset-4"
                >
                    Open it in a new tab
                </a>
            </div>
        );
    }

    return (
        <button
            ref={opener}
            type="button"
            onClick={onOpen}
            aria-label={`${TITLE} — open up close to zoom`}
            className="group relative block h-full w-full cursor-zoom-in"
        >
            <canvas
                ref={canvas}
                aria-hidden="true"
                className={cn("h-full w-full transition-opacity duration-300", state === "ready" ? "opacity-100" : "opacity-0")}
            />
            {state === "loading" && (
                <span className="absolute inset-0 grid place-items-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/15 border-t-black/60" />
                </span>
            )}
            {/* The way in, said on the page itself. */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-white shadow-lg transition-[opacity,scale] duration-300 group-hover:scale-105",
                    state === "ready" ? "opacity-100" : "opacity-0"
                )}
            >
                <ZoomIn size={13} strokeWidth={2} />
                <span className="[@media(hover:hover)]:hidden">Tap to zoom</span>
                <span className="hidden [@media(hover:hover)]:inline">Click to zoom</span>
            </span>
        </button>
    );
}

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
 * Cancel and its X to back out. The page is drawn by PDF.js, the same on
 * every device, and tapped or clicked it opens up close, over the whole
 * screen, to be zoomed and moved about — see ResumeFocus.
 *
 * The button is glass, the doodle dock's own, and sits beside it: "Résumé"
 * and the icon on every screen — accented, so it never reads as the video
 * player's "resume".
 *
 * The page is shown whole and the shape it is (A4), as large as the dialog
 * allows, so there is never a grey field round it. On a phone the dialog is
 * the whole screen; from `sm` a panel over the page. Cancel and Download
 * share the foot evenly — two halves on a phone, a matched pair at the right
 * from `sm`.
 *
 * The dialog is put on the body, out of whatever the button sits in — the
 * dock is fixed and glass, and either would hold a fixed dialog inside it.
 *
 * The dialog leaves as deliberately as it arrives, which is the only reason
 * there is a third state: `closing` keeps it mounted while its exit animation
 * plays out (see `.dialog-panel` in globals.css) and the animation's own end
 * retires it. The timeout behind that is a guarantee, not a duration — a
 * dialog that somehow never hears `animationend` still goes away.
 */
export default function ResumeButton({ className }: { className?: string }) {
    const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
    const opener = useRef<HTMLButtonElement>(null);
    const confirm = useRef<HTMLAnchorElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const page = useRef<HTMLButtonElement>(null);
    const [zoomed, setZoomed] = useState(false);

    const open = phase !== "closed";
    const unzoom = () => {
        setZoomed(false);
        requestAnimationFrame(() => page.current?.focus());
    };
    const close = () => {
        setZoomed(false);
        setPhase((current) => (current === "open" ? "closing" : current));
    };

    // The phone's back button is Cancel, not a way off the site — and with
    // the page up close, it puts that away first.
    useBackToClose(phase === "open", close);
    useBackToClose(phase === "open" && zoomed, unzoom);

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
                // The page and its renderer start coming the moment the
                // button is reached for.
                onPointerEnter={() => void pdfPage(personal.resumeUrl).catch(() => undefined)}
                onFocus={() => void pdfPage(personal.resumeUrl).catch(() => undefined)}
                aria-haspopup="dialog"
                className={cn("h-11 shrink-0 rounded-full transition-transform duration-200 active:scale-95", className)}
            >
                {/* The glass is a layer of its own, as on the dock's buttons. */}
                <span className="gpane flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 font-mono text-label uppercase text-ink">
                    Résumé
                    <DocumentIcon />
                </span>
            </button>

            {open &&
                createPortal(
                <div
                    data-closing={phase === "closing" ? "" : undefined}
                    onAnimationEnd={(e) => {
                        if (phase === "closing" && e.target === panel.current) {
                            setPhase("closed");
                        }
                    }}
                    className="fixed inset-0 z-[130] flex items-center justify-center sm:p-5"
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
                        className="dialog-panel relative flex h-full w-full flex-col bg-paper-2 pt-[env(safe-area-inset-top)] shadow-xl sm:h-[min(56rem,100%)] sm:max-w-3xl sm:rounded-lg sm:border sm:border-rule sm:pt-0"
                    >
                        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
                            <div className="min-w-0">
                                <p className="font-mono text-label uppercase text-ink-3">Résumé</p>
                                <h2
                                    id="resume-dialog-title"
                                    className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink sm:mt-2 sm:text-d1"
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

                        {/* The page, whole and A4-shaped, as big as the room
                            between the header and the foot lets it be — the
                            room is measured as a size container, and the page
                            takes whichever of its width or height runs out
                            first. */}
                        <div className="flex min-h-0 flex-1 items-center justify-center px-5 [container-type:size] sm:px-7">
                            <div className="h-[min(100cqh,calc(100cqw*842/595))] w-[min(100cqw,calc(100cqh*595/842))] overflow-hidden rounded-sm bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]">
                                <PagePreview opener={page} onOpen={() => setZoomed(true)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:flex sm:justify-end sm:px-7 sm:pb-6">
                            <button
                                type="button"
                                onClick={close}
                                className="inline-flex h-12 items-center justify-center rounded border border-rule-strong font-mono text-label uppercase text-ink-2 transition-colors duration-300 hover:border-ink hover:text-ink sm:w-44"
                            >
                                Cancel
                            </button>
                            <a
                                ref={confirm}
                                href={personal.resumeUrl}
                                download
                                onClick={close}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded border border-ink bg-ink font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink sm:w-44"
                            >
                                Download
                                <DocumentIcon />
                            </a>
                        </div>
                    </div>
                    {zoomed && <ResumeFocus url={personal.resumeUrl} title={TITLE} onClose={unzoom} />}
                </div>,
                    document.body
                )}
        </>
    );
}
