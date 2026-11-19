"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";
import GlassFrame from "@/components/shared/GlassFrame";
import ResumeFocus from "@/components/shared/ResumeFocus";
import { personal } from "@/lib/data";
import { useBackToClose } from "@/lib/history";
import { getLenis } from "@/lib/lenis";
import { drawPage, pdfPage } from "@/lib/pdf";
import { cn } from "@/lib/utils";

/** How long the exit animation is given before the dialog is dropped anyway. */
const EXIT_FALLBACK = 400;

const TITLE = `${personal.name}'s résumé`;

/* The dialog's two pills: the one that does it, and the one beside it. */
const PILL =
    "group inline-flex h-12 items-center justify-center gap-2.5 rounded-full font-mono text-label uppercase tracking-[0.16em] transition-colors duration-300";
const PILL_SOLID = cn(PILL, "bg-ink text-on-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.85)] hover:bg-ink/85");
const PILL_GHOST = cn(PILL, "border border-rule-strong text-ink-2 hover:border-ink hover:text-ink");

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
            {/* The way in, said on the page only while a pointer is over it —
                at rest the page is left clean, and "View up close" beside it
                says the same. */}
            <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-4 mx-auto hidden w-fit items-center gap-1.5 rounded-full bg-black/80 px-3.5 py-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white opacity-0 shadow-lg backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:inline-flex"
            >
                <ZoomIn size={13} strokeWidth={2} />
                Click to zoom
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
 * a dialog, to be read there; downloading it is the dialog's to offer —
 * asked first, in a small question over the resume that either answer puts
 * away while the resume stays open — with its X, Escape or the scrim to back
 * out. The page is drawn by PDF.js, the
 * same on every device, and tapped or clicked — or "Up close" — it opens up
 * close, over the whole screen, to be zoomed and moved about — see
 * ResumeFocus.
 *
 * The button is glass, the doodle dock's own, and sits beside it: "Résumé"
 * and the icon on every screen — accented, so it never reads as the video
 * player's "resume".
 *
 * The page is shown whole and the shape it is (A4), as large as the dialog
 * allows, in the same glass frame as every picture on the site. On a phone
 * the dialog is the whole screen — name above the page, "Up close" and
 * Download as two halves below it; from `sm` a panel over the page; from
 * `md` a split panel, the page on the left and a column on the right with
 * the name, a few facts and the two pills stacked at its foot.
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
    const download = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const page = useRef<HTMLButtonElement>(null);
    const [zoomed, setZoomed] = useState(false);
    const [asking, setAsking] = useState(false);

    const open = phase !== "closed";
    const unzoom = () => {
        setZoomed(false);
        requestAnimationFrame(() => page.current?.focus());
    };
    // Either answer puts the question away and leaves the resume open.
    const answered = () => {
        setAsking(false);
        requestAnimationFrame(() => download.current?.focus());
    };
    const close = () => {
        setZoomed(false);
        setAsking(false);
        setPhase((current) => (current === "open" ? "closing" : current));
    };

    // The phone's back button is Cancel, not a way off the site — and with
    // the page up close, or the question up, it puts that away first.
    useBackToClose(phase === "open", close);
    useBackToClose(phase === "open" && zoomed, unzoom);
    useBackToClose(phase === "open" && asking, answered);

    // Escape answers "no" — caught ahead of the dialog's own, which would
    // close the resume as well.
    useEffect(() => {
        if (!asking) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            answered();
        };
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [asking]);

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
        download.current?.focus();

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
                        className="dialog-panel relative flex h-full w-full flex-col bg-paper-2 pt-[env(safe-area-inset-top)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_80px_-30px_rgba(0,0,0,0.9)] [--h:min(46rem,calc(100dvh_-_2.5rem))] sm:h-[min(56rem,100%)] sm:max-w-xl sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:pt-0 md:h-[var(--h)] md:w-[min(100%,calc((var(--h)_-_5rem)*595/842_+_27.5rem))] md:max-w-none md:flex-row md:gap-10 md:p-10"
                    >
                        {/* The page, whole and A4-shaped, in the glass every
                            picture on the site sits in, as big as its room
                            lets it be — the room is measured as a size
                            container, and the page takes whichever of its
                            width or height runs out first. From `md` the
                            panel is as wide as that page plus its column, so
                            nothing is left over round it. */}
                        <div className="order-2 flex min-h-0 flex-1 items-center justify-center px-6 py-4 [container-type:size] md:order-1 md:p-0">
                            <GlassFrame inner="h-[min(100cqh,calc(100cqw*842/595))] w-[min(100cqw,calc(100cqh*595/842))] bg-white">
                                <PagePreview opener={page} onOpen={() => setZoomed(true)} />
                            </GlassFrame>
                        </div>

                        {/* The column: who, what, and what to do with it. On
                            a phone its parts fall either side of the page —
                            the name above, the buttons below. */}
                        <div className="contents md:order-2 md:flex md:w-80 md:shrink-0 md:flex-col md:py-1">
                            <div className="order-1 flex items-start justify-between gap-4 px-5 pb-2 pt-5 md:order-none md:p-0 md:pr-10">
                                <div className="min-w-0">
                                    <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-3">Résumé</p>
                                    <h2
                                        id="resume-dialog-title"
                                        className="mt-2 font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em] text-ink md:mt-4 md:text-d1"
                                    >
                                        {personal.name}
                                    </h2>
                                    <p className="mt-1.5 text-sm text-ink-2 md:mt-3 md:text-base">{personal.role}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Close"
                                    className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 transition-colors duration-300 hover:bg-ink/10 hover:text-ink md:absolute md:right-5 md:top-5 md:m-0"
                                >
                                    <X size={20} strokeWidth={1.8} aria-hidden="true" />
                                </button>
                            </div>

                            <dl className="mt-10 hidden border-t border-rule font-mono text-label uppercase tracking-[0.12em] md:block">
                                {[
                                    ["Format", "PDF · 1 page"],
                                    ["Based in", personal.location],
                                    ["Time zone", personal.timezone],
                                ].map(([term, value]) => (
                                    <div key={term} className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5">
                                        <dt className="text-ink-3">{term}</dt>
                                        <dd className="text-right text-ink">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            <div className="order-3 grid grid-cols-2 gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 md:order-none md:mt-auto md:grid-cols-1 md:p-0">
                                <button
                                    ref={download}
                                    type="button"
                                    onClick={() => setAsking(true)}
                                    aria-haspopup="dialog"
                                    className={cn(PILL_SOLID, "md:order-1")}
                                >
                                    Download
                                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">
                                        ↓
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoomed(true)}
                                    className={cn(PILL_GHOST, "-order-1 md:order-2")}
                                >
                                    <ZoomIn size={14} strokeWidth={1.8} aria-hidden="true" />
                                    Up close
                                </button>
                            </div>
                        </div>

                        {/* Download, asked first — over the resume, which
                            stays open whichever way it is answered. */}
                        {asking && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center p-5 sm:rounded-[1.75rem]">
                                <div
                                    aria-hidden="true"
                                    onClick={answered}
                                    className="dialog-scrim absolute inset-0 bg-black/60 backdrop-blur-[2px] sm:rounded-[1.75rem]"
                                />
                                <div
                                    role="alertdialog"
                                    aria-modal="true"
                                    aria-labelledby="resume-ask-title"
                                    aria-describedby="resume-ask-body"
                                    className="dialog-panel relative w-full max-w-sm rounded-[1.375rem] border border-white/10 bg-paper-3 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_60px_-20px_rgba(0,0,0,0.9)] sm:p-7"
                                >
                                    <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-3">Download</p>
                                    <h3
                                        id="resume-ask-title"
                                        className="mt-3 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink"
                                    >
                                        Download the résumé?
                                    </h3>
                                    <p id="resume-ask-body" className="mt-2 text-sm leading-relaxed text-ink-2">
                                        A one-page PDF will be saved to your device.
                                    </p>
                                    <div className="mt-7 grid grid-cols-2 gap-3">
                                        <button type="button" onClick={answered} className={PILL_GHOST}>
                                            No
                                        </button>
                                        <a
                                            href={personal.resumeUrl}
                                            download
                                            autoFocus
                                            onClick={answered}
                                            className={PILL_SOLID}
                                        >
                                            Yes
                                            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">
                                                ↓
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {zoomed && <ResumeFocus url={personal.resumeUrl} title={TITLE} from={page} onClose={unzoom} />}
                </div>,
                    document.body
                )}
        </>
    );
}
