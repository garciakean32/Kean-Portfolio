"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
    LiquidGlassCarouselHandle,
    LiquidGlassCarouselItem,
} from "@/components/ui/liquid-glass-carousel";
import { TextMorph } from "@/components/ui/text-morph";
import { experience } from "@/lib/data";
import { getLenis } from "@/lib/lenis";
import { gsap, motionEnabled, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* WebGL and all of three.js, fetched when the button is first reached for
   rather than with the rest of the page. */
const loadCarousel = () => import("@/components/ui/liquid-glass-carousel");
const LiquidGlassCarousel = dynamic(() => loadCarousel().then((m) => m.LiquidGlassCarousel), {
    ssr: false,
});

/* The card face, in texture pixels: 4:5, and sharp at the size a focused card
   reaches on a 2x screen. */
const CARD_W = 960;
const CARD_H = 1200;
const PAD = 76;

/* The carousel's own panel size — 450px, or 52% of the row when that is
   less — handed to it rather than left to its defaults, because the open
   card's morph starts from exactly where the carousel draws the card. */
const PANEL_H = 450;
const PANEL_RATIO = 0.52;

/* A card with no photo yet: the same dark graphite on the canvas and on the
   open card, so the two meet without a seam. */
const PLACEHOLDER_TOP = "#3a3a3a";
const PLACEHOLDER_BOTTOM = "#141414";

type Phase = "closed" | "opening" | "open" | "closing";

async function loadPhoto(src: string) {
    if (!src) return null;
    const img = new window.Image();
    img.src = src;
    try {
        await img.decode();
        return img;
    } catch {
        return null;
    }
}

/**
 * Each stop of the story as a card face — the carousel only shows images, so
 * the photo, its title and what it was are composed onto a canvas together.
 * The description is held back for when the card is opened.
 *
 * Drawn with the page's own fonts, read off the variables next/font puts on
 * <html>, and only once those have loaded — otherwise the canvas paints the
 * fallback face and keeps it.
 */
async function drawCards(): Promise<LiquidGlassCarouselItem[]> {
    const root = getComputedStyle(document.documentElement);
    const sans = root.getPropertyValue("--font-sans").trim() || "system-ui, sans-serif";
    const mono = root.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace";
    const [photos] = await Promise.all([
        Promise.all(experience.map((stop) => loadPhoto(stop.image))),
        document.fonts.load(`700 92px ${sans}`).catch(() => undefined),
        document.fonts.load(`400 30px ${mono}`).catch(() => undefined),
    ]);

    return experience.map((stop, i) => {
        const canvas = document.createElement("canvas");
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return { src: "", title: stop.title, aspect: CARD_W / CARD_H };

        // `letterSpacing` is newer than the rest of the canvas API; where it
        // is missing the text is simply set at its natural tracking.
        const track = (value: string) => {
            if ("letterSpacing" in ctx) ctx.letterSpacing = value;
        };

        // The photo, cover-cropped about its centre — the same crop the open
        // card's `object-cover` makes — or the placeholder.
        const photo = photos[i];
        if (photo) {
            const scale = Math.max(CARD_W / photo.naturalWidth, CARD_H / photo.naturalHeight);
            const w = photo.naturalWidth * scale;
            const h = photo.naturalHeight * scale;
            ctx.drawImage(photo, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
        } else {
            const fill = ctx.createLinearGradient(0, 0, 0, CARD_H);
            fill.addColorStop(0, PLACEHOLDER_TOP);
            fill.addColorStop(1, PLACEHOLDER_BOTTOM);
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, CARD_W, CARD_H);
        }

        // Shade at both ends, so white type reads over any photo.
        const top = ctx.createLinearGradient(0, 0, 0, CARD_H * 0.22);
        top.addColorStop(0, "rgba(0,0,0,0.45)");
        top.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = top;
        ctx.fillRect(0, 0, CARD_W, CARD_H * 0.22);
        const bottom = ctx.createLinearGradient(0, CARD_H * 0.38, 0, CARD_H);
        bottom.addColorStop(0, "rgba(0,0,0,0)");
        bottom.addColorStop(1, "rgba(0,0,0,0.88)");
        ctx.fillStyle = bottom;
        ctx.fillRect(0, CARD_H * 0.38, CARD_W, CARD_H * 0.62);

        // What it was, and when.
        ctx.font = `400 30px ${mono}`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.textBaseline = "top";
        track("5px");
        ctx.textAlign = "left";
        ctx.fillText(stop.label.toUpperCase(), PAD, PAD);
        ctx.textAlign = "right";
        ctx.fillText(stop.timeline.toUpperCase(), CARD_W - PAD, PAD);

        // The way in.
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = `400 28px ${mono}`;
        ctx.fillText("READ MORE +", PAD, CARD_H - PAD);

        // The title, wrapped and stood on the line above it.
        ctx.font = `700 92px ${sans}`;
        ctx.fillStyle = "#ffffff";
        track("-2px");
        const lines: string[] = [];
        for (const word of stop.title.split(" ")) {
            const last = lines[lines.length - 1];
            const joined = last ? `${last} ${word}` : word;
            if (last && ctx.measureText(joined).width > CARD_W - PAD * 2) lines.push(word);
            else if (last) lines[lines.length - 1] = joined;
            else lines.push(word);
        }
        const base = CARD_H - PAD - 96;
        lines.forEach((line, n) => {
            ctx.fillText(line, PAD, base - (lines.length - 1 - n) * 98);
        });

        return { src: canvas.toDataURL("image/png"), title: stop.title, aspect: CARD_W / CARD_H };
    });
}

/**
 * The way into the story: a white button that opens the experience carousel
 * as a full-screen white page.
 *
 * The page arrives as white spreading out from the button itself, a circle
 * growing from its centre until it has covered the screen, while the button
 * fades from under it; closing runs the same thing backwards into the button.
 * The page behind is held still and inert for as long as it is open.
 *
 * Inside, the carousel is the component as designed — scroll or drag to move
 * through it. Opening a card shows its description over it, and a Back
 * button top left; clicking anywhere off the card, Back, or Escape returns
 * it. X, or Escape with no card open, closes the whole page.
 *
 * `beforeOpen` can hold the page back: given a promise, the button reads
 * "Redirecting…" until it settles, and only then does the white spread.
 * `onClosed` is told once the page has folded all the way back into it.
 */
export default function ExperienceDialog({
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
    const row = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLElement>(null);
    const photo = useRef<HTMLDivElement>(null);
    const face = useRef<HTMLDivElement>(null);
    const words = useRef<HTMLDivElement>(null);
    /* the open card's clip, as its four insets in pixels — see the morph */
    const cut = useRef({ t: 0, r: 0, b: 0, l: 0 });
    const control = useRef<LiquidGlassCarouselHandle | null>(null);
    const drawing = useRef<Promise<void> | null>(null);
    const wasShown = useRef(false);

    const [phase, setPhase] = useState<Phase>("closed");
    const [items, setItems] = useState<LiquidGlassCarouselItem[] | null>(null);
    const [active, setActive] = useState(0);
    const [cardOpen, setCardOpen] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    const shown = phase !== "closed";
    const stop = experience[active] ?? experience[0];

    /* Start fetching the carousel and drawing its cards the moment the button
       is reached for, so both are usually ready by the time the white has
       finished spreading. */
    const warm = () => {
        loadCarousel();
        drawing.current ??= drawCards()
            .then(setItems)
            .catch(() => undefined);
    };

    const openDialog = async () => {
        if (phase !== "closed" || redirecting) return;
        warm();
        const wait = beforeOpen?.();
        if (wait) {
            // Back to its own words once the page has covered it — see the
            // spread — so the button never flicks back in view.
            setRedirecting(true);
            await wait;
        }
        setPhase((p) => (p === "closed" ? "opening" : p));
    };
    const closeDialog = () => setPhase((p) => (p === "open" ? "closing" : p));
    const closeCard = () => control.current?.closeFocus();

    // The spread, both ways, from wherever the button is on screen.
    useIsomorphicLayoutEffect(() => {
        if (phase !== "opening" && phase !== "closing") return;
        const el = dialog.current;
        const inner = content.current;
        const btn = trigger.current;
        if (!el || !inner || !btn) return;

        const r = btn.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        const point = `circle(0px at ${x}px ${y}px)`;
        const full = `circle(${radius}px at ${x}px ${y}px)`;

        const tl =
            phase === "opening"
                ? gsap
                      .timeline({
                          onComplete: () => {
                              // Fully open: drop the circle, so turning a phone
                              // to landscape cannot leave a corner uncovered.
                              gsap.set(el, { clipPath: "none" });
                              setRedirecting(false);
                              setPhase("open");
                          },
                      })
                      .to(btn, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, 0)
                      .fromTo(
                          el,
                          { clipPath: point },
                          { clipPath: full, duration: 0.9, ease: "power3.inOut" },
                          0.05
                      )
                      .fromTo(
                          inner,
                          { autoAlpha: 0, y: 16 },
                          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
                          0.75
                      )
                : gsap
                      .timeline({
                          onComplete: () => {
                              setCardOpen(false);
                              setActive(0);
                              setPhase("closed");
                              onClosed?.();
                          },
                      })
                      .to(inner, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 0)
                      .fromTo(
                          el,
                          { clipPath: full },
                          { clipPath: point, duration: 0.75, ease: "power3.inOut" },
                          0.1
                      )
                      .to(btn, { autoAlpha: 1, duration: 0.35, ease: "power2.out" }, 0.6);

        if (!motionEnabled()) tl.progress(1);
        return () => {
            tl.kill();
        };
    }, [phase]);

    // While it is up: the page behind is still, inert, and out of reach.
    useEffect(() => {
        if (!shown) return;
        const html = document.documentElement;
        const lenis = getLenis();
        const behind = Array.from(document.body.children).filter(
            (el): el is HTMLElement => el instanceof HTMLElement && el !== dialog.current
        );

        lenis?.stop();
        html.style.overflow = "hidden";
        behind.forEach((el) => (el.inert = true));

        return () => {
            behind.forEach((el) => (el.inert = false));
            html.style.overflow = "";
            lenis?.start();
        };
    }, [shown]);

    // Focus goes in with the page and comes back to the button after it.
    useEffect(() => {
        if (phase === "open") {
            closeButton.current?.focus();
            wasShown.current = true;
        } else if (phase === "closed" && wasShown.current) {
            wasShown.current = false;
            trigger.current?.focus({ preventScroll: true });
        }
    }, [phase]);

    // Escape backs out one step at a time: the card first, then the page.
    // With a card open the carousel may already have handled the key itself
    // (it marks the event handled), and then there is nothing left to do.
    useEffect(() => {
        if (phase !== "open") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (cardOpen) {
                if (!e.defaultPrevented) control.current?.closeFocus();
                return;
            }
            setPhase((p) => (p === "open" ? "closing" : p));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, cardOpen]);

    // The open card grows out of the card it was opened from and forms into
    // the reading panel; closing folds it back. The panel starts clipped to
    // the card's own rectangle, the photo filling exactly that and wearing
    // the card's face. It grows, then the clip opens out to the panel, the
    // photo slides to its side, the face fades to the bare photo, and the
    // story slides out from under it. Closing folds straight back.
    // Interrupted either way, it carries on from where it is.
    useIsomorphicLayoutEffect(() => {
        const el = panel.current;
        const pic = photo.current;
        const cover = face.current;
        const text = words.current;
        const stage = row.current;
        if (!el || !pic || !cover || !text || !stage) return;
        const showing = Number(gsap.getProperty(el, "opacity")) > 0;
        if (!cardOpen && !showing) return;

        // The card, worked out the way the carousel works it out: its panel
        // height at 4:5, centred on the row — which the panel is centred on.
        const W = el.offsetWidth;
        const H = el.offsetHeight;
        const ch = Math.max(120, Math.min(PANEL_H, Math.round(stage.clientHeight * PANEL_RATIO)));
        const cw = ch * (CARD_W / CARD_H);
        const card = { left: (W - cw) / 2, top: (H - ch) / 2, width: cw, height: ch };

        // The clip, tweened as its four insets and written out whole. Read
        // back, a browser shortens `inset()` — to two values when it is
        // symmetric, one when they are all the same — and a tween starting
        // from that would start the sides it no longer names from nothing,
        // flashing the black in from the edge.
        const clip = (r: typeof card) => ({
            t: r.top,
            r: W - r.left - r.width,
            b: H - r.top - r.height,
            l: r.left,
        });
        const full = { t: 0, r: 0, b: 0, l: 0 };
        const draw = () => {
            const c = cut.current;
            el.style.clipPath = `inset(${c.t}px ${c.r}px ${c.b}px ${c.l}px)`;
        };
        const ease = "expo.inOut";
        const tl = gsap.timeline();

        if (cardOpen) {
            // Where the photo ends up, read off its own classes.
            const held = pic.style.cssText;
            pic.style.cssText = "";
            const end = {
                left: pic.offsetLeft,
                top: pic.offsetTop,
                width: pic.offsetWidth,
                height: pic.offsetHeight,
            };
            pic.style.cssText = held;

            // First the card grows on its own, as itself, to the largest it
            // can be inside the panel — the clip hugging it, so no black yet.
            // Then the panel opens out from its far side — the right, or
            // below on a phone — as the card moves over to make room, and the
            // story slides out from behind it.
            const g = Math.min(H / ch, W / cw);
            const grown = { left: (W - cw * g) / 2, top: (H - ch * g) / 2, width: cw * g, height: ch * g };
            const beside = end.width < W;

            if (!showing) {
                cut.current = clip(card);
                draw();
                gsap.set(el, { autoAlpha: 1 });
                gsap.set(pic, card);
                gsap.set(cover, { opacity: 1 });
                gsap.set(text, { autoAlpha: 0, x: beside ? -40 : 0, y: beside ? 0 : -24 });
            }
            tl.to(el, { autoAlpha: 1, duration: 0.15 }, 0)
                .to(cut.current, { ...clip(grown), duration: 0.6, ease: "power3.out", onUpdate: draw }, 0)
                .to(pic, { ...grown, duration: 0.6, ease: "power3.out" }, 0)
                .to(cut.current, { ...full, duration: 0.9, ease: "power3.inOut", onUpdate: draw }, 0.75)
                .to(pic, { ...end, duration: 0.9, ease: "power3.inOut" }, 0.75)
                .to(cover, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 1)
                .to(text, { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: "power3.out" }, 1.15)
                // Settled: the shape goes back to the stylesheet, so a resize
                // or a turned phone lays the panel out afresh.
                .add(() => {
                    gsap.set(el, { clipPath: "none" });
                    gsap.set(pic, { clearProps: "left,top,width,height" });
                });
        } else {
            // Wherever it got to — all the way open, its clip handed back as
            // `none`, or caught partway — it folds back from there.
            draw();
            tl.to(text, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0)
                .to(cut.current, { ...clip(card), duration: 0.8, ease, onUpdate: draw }, 0.05)
                .to(pic, { ...card, duration: 0.8, ease }, 0.05)
                .to(cover, { opacity: 1, duration: 0.4, ease: "power2.inOut" }, 0.35)
                // Folded back over the card, which is right where it was.
                .to(el, { autoAlpha: 0, duration: 0.15 }, 0.85);
        }

        if (!motionEnabled()) tl.progress(1, false);
        return () => {
            tl.kill();
        };
    }, [cardOpen]);

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
                className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-7 font-mono text-label uppercase tracking-[0.16em] text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.85)] transition-colors duration-300 hover:bg-white/85"
            >
                {/* One size whatever it says: both labels share a cell
                    sized by the longer one, and the mark beside them has a
                    slot of its own, the spinner's size. */}
                <span className="grid justify-items-center">
                    <span aria-hidden="true" className="invisible [grid-area:1/1]">
                        View my experience
                    </span>
                    <TextMorph
                        words={["View my experience", "Redirecting…"]}
                        index={redirecting ? 1 : 0}
                        morphDuration={480}
                        className="[grid-area:1/1]"
                    />
                </span>
                <span aria-hidden="true" className="grid w-3 place-items-center">
                    {redirecting ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-black/20 border-t-black" />
                    ) : (
                        <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                            ↗
                        </span>
                    )}
                </span>
            </button>

            {shown &&
                createPortal(
                    <div
                        ref={dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="experience-dialog-title"
                        // Starts as a point; the spread above opens it from the button.
                        className="fixed inset-0 z-[110] bg-white text-[#111111] [clip-path:circle(0px_at_50%_50%)]"
                    >
                        <div ref={content} className="flex h-full flex-col opacity-0">
                            <header className="relative flex h-16 shrink-0 items-center justify-center px-3 md:h-20 md:px-6">
                                {/* The name in the corner, and the way back
                                    out of an open card: one word morphing into
                                    the other and back, rather than a button
                                    appearing over a label. A button either
                                    way, but only a working one — and only in
                                    the tab order — while a card is open. */}
                                <button
                                    type="button"
                                    onClick={closeCard}
                                    disabled={!cardOpen}
                                    aria-label={cardOpen ? "Back to all cards" : "Kean"}
                                    className="absolute left-3 inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-medium tracking-[-0.02em] transition-colors duration-300 enabled:hover:bg-black/5 disabled:cursor-default sm:text-[17px] md:left-6"
                                >
                                    <TextMorph
                                        words={["Kean", "← Back"]}
                                        index={cardOpen ? 1 : 0}
                                        morphDuration={480}
                                    />
                                </button>

                                <h2
                                    id="experience-dialog-title"
                                    className="text-[15px] font-medium tracking-[-0.02em] sm:text-[17px]"
                                >
                                    Experience
                                </h2>

                                <button
                                    ref={closeButton}
                                    type="button"
                                    onClick={closeDialog}
                                    aria-label="Close experience"
                                    className="absolute right-3 grid h-11 w-11 place-items-center rounded-full transition-colors duration-300 hover:bg-black/5 md:right-6"
                                >
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        strokeLinecap="round"
                                    >
                                        <path d="M6 6l12 12M18 6L6 18" />
                                    </svg>
                                </button>
                            </header>

                            <div ref={row} className="relative min-h-0 flex-1">
                                {/* Mounted once the white has finished
                                    spreading, so its own entry plays in full
                                    view rather than behind the reveal. */}
                                {items && (phase === "open" || phase === "closing") && (
                                    <LiquidGlassCarousel
                                        items={items}
                                        panelHeight={PANEL_H}
                                        panelRatio={PANEL_RATIO}
                                        // The focused card holds still; the
                                        // reading panel below grows out of it.
                                        centerScale={1}
                                        showTitle={false}
                                        showClose={false}
                                        label="My experience"
                                        controlRef={control}
                                        onActiveChange={setActive}
                                        onFocusChange={setCardOpen}
                                        // No "View" label trailing the pointer.
                                        showCursor={false}
                                        // Fill the row exactly, however short.
                                        className="min-h-0"
                                    />
                                )}

                                {/* A click anywhere in the row but the card
                                    sends it back. */}
                                {cardOpen && (
                                    <div
                                        aria-hidden="true"
                                        onClick={closeCard}
                                        className="absolute inset-0 z-20"
                                    />
                                )}

                                {/* The open card, as a wide reading panel: the
                                    photo on one side and the story on the
                                    other, stacked on a phone. It grows out of
                                    the card it opens from — see the morph
                                    above — and is always wider and taller than
                                    it, so the card, holding still underneath
                                    (`centerScale={1}`), never shows past it. */}
                                <article
                                    ref={panel}
                                    aria-hidden={!cardOpen}
                                    className={cn(
                                        "invisible absolute left-1/2 top-1/2 z-30 h-[calc(100%-3rem)] w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-[#111111] text-white opacity-0 md:h-[min(40rem,calc(100%-2rem))] md:w-[min(72rem,calc(100%-3rem))]",
                                        !cardOpen && "pointer-events-none"
                                    )}
                                >
                                    <div
                                        ref={photo}
                                        className="absolute left-0 top-0 z-10 h-[38%] w-full overflow-hidden md:h-full md:w-[44%]"
                                    >
                                        {stop.image ? (
                                            <Image
                                                src={stop.image}
                                                alt=""
                                                fill
                                                quality={85}
                                                sizes="(min-width: 768px) 40rem, 100vw"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a] to-[#141414]" />
                                        )}
                                        {/* The card's own face, title and all,
                                            for the morph to start from and
                                            fade off as it grows. */}
                                        <div ref={face} className="absolute inset-0">
                                            {items?.[active] && (
                                                <Image
                                                    src={items[active].src}
                                                    alt=""
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        ref={words}
                                        className="absolute inset-x-0 bottom-0 top-[38%] flex flex-col p-5 md:left-[44%] md:top-0 md:p-6 lg:p-12"
                                    >
                                        <div className="flex shrink-0 items-start justify-between gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white/70 md:text-xs">
                                            <span>{stop.label}</span>
                                            <span>{stop.timeline}</span>
                                        </div>

                                        {/* Where a stop has more story than the
                                            panel is tall, it scrolls inside it
                                            rather than spilling off. `min-h-full`
                                            on the inner block keeps it centred
                                            when it fits and scrollable from the
                                            top when it does not.
                                            `data-lenis-prevent` lets the wheel
                                            through: the page behind is held
                                            still, and Lenis would otherwise
                                            swallow it here too. */}
                                        <div
                                            data-lenis-prevent
                                            className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain lg:mt-6"
                                        >
                                            <div className="flex min-h-full flex-col justify-center">
                                                <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] md:text-4xl lg:text-5xl">
                                                    {stop.title}
                                                </h3>
                                                <p className="mt-4 max-w-prose text-base leading-relaxed text-white/85 lg:mt-6 lg:text-lg">
                                                    {stop.story}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white/50 lg:mt-6">
                                            <span className="[@media(hover:hover)]:hidden">Tap</span>
                                            <span className="hidden [@media(hover:hover)]:inline">
                                                Click
                                            </span>{" "}
                                            outside to close
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <p className="shrink-0 px-4 pb-6 pt-2 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-black/50 md:pb-8">
                                <span className="[@media(hover:hover)]:hidden">
                                    Swipe to browse · Tap a card to read it
                                </span>
                                <span className="hidden [@media(hover:hover)]:inline">
                                    Scroll or drag to browse · Click a card to read it
                                </span>
                            </p>
                        </div>

                        {/* The canvas is a picture to a screen reader; the
                            story itself, in order, is here. */}
                        <ol className="sr-only">
                            {experience.map((s) => (
                                <li key={s.title}>
                                    {s.title} ({s.label}, {s.timeline}): {s.story}
                                </li>
                            ))}
                        </ol>
                    </div>,
                    document.body
                )}
        </>
    );
}
