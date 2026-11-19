"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppWindow } from "lucide-react";
import type { CardRect, CurvedGlassHandle, CurvedGlassItem } from "@/components/ui/curved-glass-carousel";
import { PAGE_BUTTON, PageButtonLabel } from "@/components/shared/PageButton";
import { works, type Work } from "@/lib/data";
import { useBackToClose } from "@/lib/history";
import { setCovered, useIsomorphicLayoutEffect } from "@/lib/motion";
import { centreOn, scrollToSection } from "@/lib/sections";
import { spread, useHoldPage } from "@/lib/spread";
import { cn } from "@/lib/utils";

/* three.js and the carousel, fetched when the button is first reached for
   rather than with the rest of the page. */
const loadCarousel = () => import("@/components/ui/curved-glass-carousel");
const CurvedGlassCarousel = dynamic(() => loadCarousel().then((m) => m.CurvedGlassCarousel), {
    ssr: false,
});

/* While there are fewer works than this, "your site next?" cards make up the
   difference — so there is always a card either side of the centred one.
   They give way to real works as works are added. */
const FILL = 3;

type Slide = { kind: "work"; work: Work } | { kind: "next" };

const SLIDES: Slide[] = [
    ...works.map((work): Slide => ({ kind: "work", work })),
    ...Array.from({ length: Math.max(0, FILL - works.length) }, (): Slide => ({ kind: "next" })),
];

const STATUS: Record<Work["status"], string> = {
    live: "Live",
    testing: "Not live yet",
};

/* The small marks in the page's four corners. */
const MARK = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-black/55";

const pad = (n: number) => String(n).padStart(2, "0");

/* An arrow for the buttons either side — the same line as the X. */
function Arrow({ back = false }: { back?: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={back ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
        </svg>
    );
}

/* What is said under the centred card: a work's name and what it is; or, for
   a "your site next?" card, the offer. Words only — the card itself is what
   opens, and the link above it. */
function SlideWords({ slide }: { slide: Slide }) {
    if (slide.kind === "work") {
        return (
            <>
                <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] md:text-3xl lg:text-4xl">
                    {slide.work.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/60 md:text-[0.9375rem]">
                    {slide.work.description}
                </p>
            </>
        );
    }
    return (
        <>
            <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] md:text-3xl lg:text-4xl">
                Your site here?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/60 md:text-[0.9375rem]">
                Have a website in mind? Tell me about it — this card takes you straight to the contact form.
            </p>
        </>
    );
}

/* The centred work's status: a mark like the others in the corners, in
   orange while the site is not live yet and green once it is. */
function Status({ work }: { work: Work }) {
    return (
        <span
            className={cn(
                MARK,
                "inline-flex items-center gap-2",
                work.status === "live" ? "text-emerald-700" : "text-orange-700"
            )}
        >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS[work.status]}
        </span>
    );
}

/* On a phone the works are shown as a phone shows them: upright, from each
   site's own phone capture — see `imageMobile` in lib/data. */
const PHONE = "(max-width: 639px)";
const PHONE_ASPECT = 430 / 932;

function usePhone() {
    const [phone, setPhone] = useState(false);
    useEffect(() => {
        const query = window.matchMedia(PHONE);
        const read = () => setPhone(query.matches);
        read();
        query.addEventListener("change", read);
        return () => query.removeEventListener("change", read);
    }, []);
    return phone;
}

/**
 * The face of a "your site next?" card, drawn on a canvas in the page's own
 * fonts — once they have loaded, or the canvas keeps the fallback face — at
 * the shape of the works' own pictures, `W` by `H`: a plus in a ring, the
 * offer, and the way to take it up, all as big as fits and centred; the
 * offer broken over more lines on an upright card.
 */
async function drawNextCard(W: number, H: number) {
    const root = getComputedStyle(document.documentElement);
    const sans = root.getPropertyValue("--font-sans").trim() || "system-ui, sans-serif";
    const mono = root.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace";
    await Promise.all([
        document.fonts.load(`700 112px ${sans}`).catch(() => undefined),
        document.fonts.load(`400 30px ${mono}`).catch(() => undefined),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const track = (value: string) => {
        if ("letterSpacing" in ctx) ctx.letterSpacing = value;
    };

    const tall = H > W;
    const lines = tall ? ["Your", "website", "could be", "next"] : ["Your website", "could be next"];
    ctx.font = `700 100px ${sans}`;
    track("-3px");
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const size = Math.min(tall ? 140 : 112, Math.floor((W * 0.8 * 100) / widest));
    const lead = size * 1.06;
    const r = size * 0.5;
    const small = Math.round(size * 0.27);
    let y = (H - (2 * r + size * 0.7 + lines.length * lead + size * 0.6 + small)) / 2;

    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#111111";
    ctx.lineWidth = size * 0.045;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(W / 2, y + r, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 - r * 0.4, y + r);
    ctx.lineTo(W / 2 + r * 0.4, y + r);
    ctx.moveTo(W / 2, y + r * 0.6);
    ctx.lineTo(W / 2, y + r * 1.4);
    ctx.stroke();
    y += 2 * r + size * 0.7;

    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${size}px ${sans}`;
    track(`${(-size * 0.027).toFixed(1)}px`);
    lines.forEach((line, i) => ctx.fillText(line, W / 2, y + size * 0.82 + i * lead));
    y += lines.length * lead + size * 0.6;

    ctx.font = `400 ${small}px ${mono}`;
    track(`${(small * 0.2).toFixed(1)}px`);
    ctx.fillStyle = "#6b6b6b";
    ctx.fillText("GET IN TOUCH →", W / 2, y + small);

    return canvas.toDataURL("image/png");
}

type Phase = "closed" | "opening" | "open" | "closing";

/**
 * The way into the works: a white button that opens them as a full-screen
 * white page, spreading out of the button and folding back into it the way
 * the experience page does — see `spread`.
 *
 * Its layout is its own. No bar across the top: four small marks in the
 * corners — what this is, the way out, how far through, and whether the
 * centred work is live yet, in orange or green. The works themselves are the
 * curved glass carousel across the middle, as big as the screen allows, the
 * centred one whole with nothing laid over it, where it lives online just
 * above it, and its name and what it is centred underneath, changing with
 * it. Arrows either side, a drag, a swipe, a wheel or the arrow keys move it
 * on. The centred card comes forward under the mouse or a held finger, and
 * it and its address both open the site itself, in a new tab; a "your site
 * next?" card folds the page away and takes the reader to the contact form
 * instead.
 *
 * `beforeOpen` can hold the page back: given a promise, the button reads
 * "Redirecting…" until it settles. `onClosed` is told once the page has
 * folded all the way back into it.
 */
export default function WorksDialog({
    beforeOpen,
    onClosed,
}: {
    beforeOpen?: () => Promise<void> | void;
    onClosed?: () => void;
}) {
    const trigger = useRef<HTMLButtonElement>(null);
    const dialog = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const control = useRef<CurvedGlassHandle | null>(null);
    const drawing = useRef<Promise<void> | null>(null);
    const wasShown = useRef(false);
    /* back pressed while the white was still spreading — closed once it lands */
    const backed = useRef(false);
    /* where to go once the page has folded away: the contact form, from a
       "your site next?" card */
    const afterClose = useRef<(() => void) | null>(null);

    const [phase, setPhase] = useState<Phase>("closed");
    const [faces, setFaces] = useState<{ wide: string; tall: string } | null>(null);
    const [active, setActive] = useState(0);
    const [card, setCard] = useState<CardRect | null>(null);
    /* the cards have come to rest at the end of their way in */
    const [arrived, setArrived] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const phone = usePhone();

    const shown = phase !== "closed";
    const slide = SLIDES[active] ?? SLIDES[0];

    // The cards: each work as it looks on a desktop — or, on a phone, as a
    // phone shows it — and the "your site next?" face to match.
    const items = useMemo<CurvedGlassItem[] | null>(
        () =>
            faces &&
            SLIDES.map((s) =>
                s.kind === "work"
                    ? {
                          src: phone ? s.work.imageMobile : s.work.image,
                          alt: `The top of the ${s.work.title} home page`,
                      }
                    : { src: phone ? faces.tall : faces.wide, alt: "Your website could be next" }
            ),
        [faces, phone]
    );

    /* Start fetching the carousel and drawing its cards the moment the button
       is reached for, so both are usually ready by the time the white has
       finished spreading. */
    const warm = () => {
        loadCarousel();
        drawing.current ??= Promise.all([drawNextCard(1600, 1000), drawNextCard(860, 1864)])
            .then(([wide, tall]) => setFaces({ wide, tall }))
            .catch(() => undefined);
    };

    const openDialog = async () => {
        if (phase !== "closed" || redirecting) return;
        warm();
        const held = beforeOpen?.();
        const scrolling = trigger.current ? centreOn(trigger.current) : null;
        if (held || scrolling) {
            // Back to its own words once the page has covered it.
            setRedirecting(true);
            await Promise.all([held, scrolling]);
        }
        setPhase((p) => (p === "closed" ? "opening" : p));
    };
    const closeDialog = () => setPhase((p) => (p === "open" ? "closing" : p));

    // The page folds away, and the contact form comes up behind it.
    const toContact = () => {
        afterClose.current = () => scrollToSection("contact");
        closeDialog();
    };

    const openSlide = (index: number) => {
        const s = SLIDES[index];
        if (!s) return;
        if (s.kind === "work") window.open(s.work.url, "_blank", "noopener,noreferrer");
        else toContact();
    };

    // The phone's back button is the X, not a way off the site.
    useBackToClose(phase === "opening" || phase === "open", () => {
        if (phase === "opening") backed.current = true;
        else closeDialog();
    });

    // The spread, both ways, from wherever the button is on screen.
    useIsomorphicLayoutEffect(() => {
        if (phase !== "opening" && phase !== "closing") return;
        const el = dialog.current;
        const inner = content.current;
        const btn = trigger.current;
        if (!el || !inner || !btn) return;

        const tl =
            phase === "opening"
                ? spread("open", { page: el, inner, button: btn }, () => {
                      setRedirecting(false);
                      setPhase("open");
                  })
                : spread("close", { page: el, inner, button: btn }, () => {
                      setActive(0);
                      setCard(null);
                      setArrived(false);
                      setPhase("closed");
                      onClosed?.();
                  });
        return () => {
            tl.kill();
        };
    }, [phase]);

    // All the way open, it covers the page entirely: the page's own drawing
    // loops rest under it until it starts to fold back.
    useEffect(() => {
        if (phase !== "open") return;
        setCovered(true);
        return () => setCovered(false);
    }, [phase]);

    // While it is up: the page behind is still, inert, and out of reach.
    useHoldPage(shown, dialog);

    // Focus goes in with the page and comes back to the button after it —
    // and from a "your site next?" card, on down to the contact form.
    useEffect(() => {
        if (phase === "open") {
            closeButton.current?.focus();
            wasShown.current = true;
            if (backed.current) {
                backed.current = false;
                closeDialog();
            }
        } else if (phase === "closed" && wasShown.current) {
            wasShown.current = false;
            trigger.current?.focus({ preventScroll: true });
            afterClose.current?.();
            afterClose.current = null;
        }
    }, [phase]);

    // Escape closes it; the arrow keys move the carousel on.
    useEffect(() => {
        if (phase !== "open") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                if (e.key === "ArrowRight") control.current?.next();
                else control.current?.previous();
            } else if (e.key === "Escape") {
                setPhase((p) => (p === "open" ? "closing" : p));
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase]);

    return (
        <>
            <button
                ref={trigger}
                type="button"
                onClick={openDialog}
                onPointerEnter={warm}
                onFocus={warm}
                aria-haspopup="dialog"
                aria-busy={redirecting}
                className={PAGE_BUTTON}
            >
                <PageButtonLabel label="View my works" busy={redirecting} />
            </button>

            {shown &&
                createPortal(
                    <div
                        ref={dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="works-dialog-title"
                        // Starts as a point; the spread opens it from the button.
                        className="fixed inset-0 z-[110] touch-none bg-white text-[#111111] [clip-path:circle(0px_at_50%_50%)]"
                    >
                        <div ref={content} className="relative flex h-full flex-col opacity-0">
                            {/* The top row, one line on every screen: what this is, as the
                                dock's own icon for it — the X's twin across the row; where the centred work
                                lives online — or, over a "your site next?" card, the way to
                                the contact form — in the middle; and the way out. */}
                            <div className="absolute inset-x-0 top-0 z-20 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 md:h-20 md:px-6">
                                <h2 id="works-dialog-title" className="grid h-11 w-11 place-items-center justify-self-start">
                                    <AppWindow aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                                    <span className="sr-only">Works</span>
                                </h2>
                                <div className="justify-self-center">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={active}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        {slide.kind === "work" ? (
                                            <a
                                                href={slide.work.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn(
                                                    MARK,
                                                    "inline-block whitespace-nowrap tracking-[0.12em] transition-colors duration-300 hover:text-black sm:tracking-[0.2em]"
                                                )}
                                            >
                                                {new URL(slide.work.url).host} ↗
                                                <span className="sr-only"> (opens in a new tab)</span>
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={toContact}
                                                className={cn(
                                                    MARK,
                                                    "inline-block whitespace-nowrap tracking-[0.12em] transition-colors duration-300 hover:text-black sm:tracking-[0.2em]"
                                                )}
                                            >
                                                Get in touch →
                                            </button>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                                </div>
                            <button
                                ref={closeButton}
                                type="button"
                                onClick={closeDialog}
                                aria-label="Close works"
                                className="grid h-11 w-11 place-items-center justify-self-end rounded-full transition-colors duration-300 hover:bg-black/[0.06]"
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                            </div>

                            {/* From `lg`, the bottom corners: how far through,
                                and the centred work's status — a "your site
                                next?" card has none. Below it, both go under
                                the words, with the arrows. */}
                            <span
                                aria-hidden="true"
                                className={cn(MARK, "absolute bottom-7 left-8 z-20 hidden tabular-nums lg:block")}
                            >
                                {pad(active + 1)} / {pad(SLIDES.length)}
                            </span>
                            <div className="absolute bottom-7 right-8 z-20 hidden lg:block">
                                <AnimatePresence mode="wait" initial={false}>
                                    {slide.kind === "work" && (
                                        <motion.div
                                            key={active}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <Status work={slide.work} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* The carousel, under the top corners and filling
                                the screen down to the words. Mounted once the
                                white has finished spreading, so its own turn-in
                                plays in full view. From `lg` the buttons either
                                side are placed from where the centred card
                                actually is; nothing is laid over the card
                                itself. */}
                            <div className="relative mt-16 min-h-0 flex-1 md:mt-20">
                                {items && (phase === "open" || phase === "closing") && (
                                    <CurvedGlassCarousel
                                        items={items}
                                        label="My works"
                                        aspect={phone ? PHONE_ASPECT : undefined}
                                        controlRef={control}
                                        onActiveChange={setActive}
                                        onCardRect={setCard}
                                        onCardClick={openSlide}
                                        onArrive={() => setArrived(true)}
                                        wheelTarget={dialog}
                                        className="absolute inset-0"
                                    />
                                )}

                                {card &&
                                    ([-1, 1] as const).map((direction) => (
                                        <button
                                            key={direction}
                                            type="button"
                                            onClick={() => (direction < 0 ? control.current?.previous() : control.current?.next())}
                                            aria-label={direction < 0 ? "Previous work" : "Next work"}
                                            style={{ top: card.top + card.height / 2 }}
                                            className={cn(
                                                "absolute z-10 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors duration-300 hover:bg-white lg:grid",
                                                direction < 0 ? "left-6" : "right-6"
                                            )}
                                        >
                                            <Arrow back={direction < 0} />
                                        </button>
                                    ))}
                            </div>

                            {/* The centred work's name and what it is, changing
                                with it — out of a blur, the way the page's
                                words arrive. Not until the cards have come in,
                                though: they arrive as the centred card comes
                                to rest, so the two land together.

                                Every slide's words are laid in the same cell
                                as well, unseen, so the block is always as tall
                                as the tallest of them. Were it to grow or
                                shrink between slides, the carousel above would
                                change size with it — and the whole row being
                                laid out afresh reads as a nudge and a blink.

                                Below `lg`, under the words: the arrows either
                                side of how far through, and under them the
                                status — in a line of its own that keeps its
                                height whether a card has one or not. */}
                            <div className="relative shrink-0 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-center md:pt-6 lg:pb-20">
                                <div aria-live="polite" className="grid">
                                    {SLIDES.map((s, i) => (
                                        <div key={i} aria-hidden="true" className="invisible [grid-area:1/1]">
                                            <SlideWords slide={s} />
                                        </div>
                                    ))}
                                    <AnimatePresence mode="wait" initial={false}>
                                        {arrived && (
                                            <motion.div
                                                key={active}
                                                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                                                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                                className="[grid-area:1/1]"
                                            >
                                                <SlideWords slide={slide} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-5 flex items-center justify-center gap-6 lg:hidden">
                                    {([-1, 1] as const).map((direction) => (
                                        <button
                                            key={direction}
                                            type="button"
                                            onClick={() => (direction < 0 ? control.current?.previous() : control.current?.next())}
                                            aria-label={direction < 0 ? "Previous work" : "Next work"}
                                            className={cn(
                                                "grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors duration-300 hover:bg-white",
                                                direction > 0 && "order-last"
                                            )}
                                        >
                                            <Arrow back={direction < 0} />
                                        </button>
                                    ))}
                                    <span aria-hidden="true" className={cn(MARK, "tabular-nums")}>
                                        {pad(active + 1)} / {pad(SLIDES.length)}
                                    </span>
                                </div>
                                <div className="mt-3 flex h-4 items-center justify-center lg:hidden">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {slide.kind === "work" && (
                                            <motion.div
                                                key={active}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <Status work={slide.work} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
