"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
    LiquidGlassCarouselHandle,
    LiquidGlassCarouselItem,
    LiquidGlassCarouselLeave,
} from "@/components/ui/liquid-glass-carousel";
import { TextMorph } from "@/components/ui/text-morph";
import { experience } from "@/lib/data";
import { useBackToClose } from "@/lib/history";
import { getLenis } from "@/lib/lenis";
import { gsap, motionEnabled, setCovered, useIsomorphicLayoutEffect } from "@/lib/motion";
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
/* — and no wider than this share of the row, so on every phone the card and
   the lens round it sit the same way: the middle card clear of it, the rim
   across the outer corners of the two beside it. */
const PANEL_WIDTH = 0.62;

/* The card's height on a row of this size, worked out as the carousel works it out. */
function cardHeight(rowW: number, rowH: number) {
    const byHeight = Math.max(120, Math.min(PANEL_H, Math.round(rowH * PANEL_RATIO)));
    return Math.max(120, Math.min(byHeight, Math.round((rowW * PANEL_WIDTH) / (CARD_W / CARD_H))));
}

/* A card with no photo yet: the same dark graphite on the canvas and on the
   open card, so the two meet without a seam. */
const PLACEHOLDER_TOP = "#3a3a3a";
const PLACEHOLDER_BOTTOM = "#141414";

type Phase = "closed" | "opening" | "open" | "closing";

/* An arrow the header's back and close are drawn with — the same box, line
   and ends — pointing on, or back. */
function Arrow({ back = false, className }: { back?: boolean; className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={cn("h-5 w-5", className)}
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

/* The other cards' return when an open card is closed waits this long, so
   they arrive as the card folds back down into its place, not under it — on
   a phone, longer, as the sheet goes down before the card folds. */
const RETURN_DELAY = 0.3;
const RETURN_DELAY_PHONE = 1;

/* How the other cards go when one is opened: down and away together with
   the card's own growing — over the same stretch and on the same curve —
   rather than clearing off first and leaving it to open after. On a phone
   that starts once the card's words are off and runs as long as the photo
   takes to fill the screen. */
const LEAVE: LiquidGlassCarouselLeave = { delay: 0, duration: 0.75, ease: "power3.inOut" };
const LEAVE_PHONE: LiquidGlassCarouselLeave = { delay: 0.3, duration: 1, ease: "power3.inOut" };

/* How much faster than as first designed the panel opens and closes from `md`. */
const DESK_PACE = 1.15;

/* The lens's blue, for the edge a slide to another stop is drawn with; and
   how far into that slide, in seconds, the next tap is taken — the wipe all
   but across by then. */
const LENS_BLUE = "#009dff";
const SLIDE_READY = 0.5;

/* Below `md`, an open card is the phone's full-screen page. */
const PHONE = "(max-width: 767px)";

/* The phone's sheet: where its top rests, as a share of the screen's height;
   how far the photo runs on under its rounded top; how far below its resting
   place a pull down puts the card away; and how hard it pulls back past the
   top (the lower, the stiffer). */
const PEEK = 0.46;
const OVERLAP = 20;
const DISMISS = 80;
const STRETCH = 0.55;

/* How far a sheet pulled `by` pixels past its stop, out of `size`, actually
   goes: all of it at first, less and less the further it is pulled. */
function rubber(by: number, size: number) {
    return (by * size * STRETCH) / (size + STRETCH * by);
}

/**
 * Brings the page round until `el` sits in the middle of the screen, so the
 * white spreads from the centre of a settled page rather than one that jumps.
 * Resolves at once if it is already there, or when motion is off.
 */
function centreOn(el: HTMLElement): Promise<void> | null {
    const r = el.getBoundingClientRect();
    const by = r.top + r.height / 2 - window.innerHeight / 2;
    if (Math.abs(by) < 8) return null;
    const lenis = getLenis();
    if (!lenis || !motionEnabled()) {
        window.scrollBy(0, by);
        return null;
    }
    const duration = Math.min(1, Math.max(0.5, Math.abs(by) / 900));
    return new Promise((resolve) => {
        lenis.scrollTo(lenis.scroll + by, {
            duration,
            easing: (t) => 1 - Math.pow(1 - t, 3),
            lock: true,
            force: true,
            onComplete: () => resolve(),
        });
    });
}

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
 * Inside, the carousel is the component as designed — a wheel tick or a
 * swipe moves it a card, a hard flick slides it several. Opening a card shows
 * its description over it, and from `md` takes the lights down round it; its
 * sides, and the screen beside them, are the stops either side. The back
 * arrow, Escape, or going back returns it. X, or Escape with no card open,
 * closes the whole page.
 * While the cards are still arriving they cannot be touched, and the page
 * says so.
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
    /* the open card's photo and story, between its tabs */
    const inner = useRef<HTMLDivElement>(null);
    /* the house lights from `md`: the page's shade, and the letterbox bars */
    const shade = useRef<HTMLDivElement>(null);
    const barTop = useRef<HTMLDivElement>(null);
    const barBottom = useRef<HTMLDivElement>(null);
    const status = useRef<HTMLSpanElement>(null);
    const header = useRef<HTMLElement>(null);
    const bar = useRef<HTMLElement>(null);
    /* the phone's sheet: where its top is, and which stop it is at or
       headed for */
    const sheetPos = useRef({ top: 0 });
    const sheetAt = useRef<"peek" | "full">("peek");
    /* the open card all the way out and settled — its sheet draggable on a
       phone, and the stops either side a tap away on any screen */
    const cardLive = useRef(false);
    /* a slide to the stop either side, while it runs */
    const slide = useRef<gsap.core.Timeline | null>(null);
    /* how fast, in px/ms, a sheet pulled down to put the card away was going */
    const fling = useRef(0);
    /* the open card's clip, as its four insets in pixels — see the morph */
    const cut = useRef({ t: 0, r: 0, b: 0, l: 0 });
    const control = useRef<LiquidGlassCarouselHandle | null>(null);
    const drawing = useRef<Promise<void> | null>(null);
    const wasShown = useRef(false);
    /* back pressed while the white was still spreading — closed once it lands */
    const backed = useRef(false);

    const [phase, setPhase] = useState<Phase>("closed");
    const [items, setItems] = useState<LiquidGlassCarouselItem[] | null>(null);
    const [active, setActive] = useState(0);
    const [cardOpen, setCardOpen] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    /* the cards have finished arriving and can be browsed */
    const [ready, setReady] = useState(false);
    const [phone, setPhone] = useState(false);

    useEffect(() => {
        const query = window.matchMedia(PHONE);
        const read = () => setPhone(query.matches);
        read();
        query.addEventListener("change", read);
        return () => query.removeEventListener("change", read);
    }, []);

    const shown = phase !== "closed";
    const stop = experience[active] ?? experience[0];
    const counter = `${String(active + 1).padStart(2, "0")} / ${String(experience.length).padStart(2, "0")}`;

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
        const held = beforeOpen?.();
        const scrolling = trigger.current ? centreOn(trigger.current) : null;
        if (held || scrolling) {
            // Back to its own words once the page has covered it — see the
            // spread — so the button never flicks back in view.
            setRedirecting(true);
            await Promise.all([held, scrolling]);
        }
        setPhase((p) => (p === "closed" ? "opening" : p));
    };
    const closeDialog = () => setPhase((p) => (p === "open" ? "closing" : p));
    const closeCard = () => control.current?.closeFocus();

    /* The phone's sheet's two stops, in the panel's pixels: all the way up,
       just under the header, and resting, a little under halfway down. */
    const sheetStops = () => {
        const H = panel.current?.offsetHeight ?? window.innerHeight;
        return { full: header.current?.offsetHeight ?? 64, peek: Math.round(H * PEEK), H };
    };
    // The sheet where `sheetPos` says; the photo down to just under it; and
    // the bar along the foot riding down with it whenever it is below rest,
    // so a sheet pulled down takes everything down with it.
    const placeSheet = () => {
        const el = panel.current;
        const text = words.current;
        const pic = photo.current;
        const foot = bar.current;
        if (!el || !text || !pic || !foot) return;
        const { top } = sheetPos.current;
        gsap.set(text, { y: top });
        gsap.set(foot, { y: Math.max(0, top - sheetStops().peek) });
        gsap.set(pic, { width: el.offsetWidth, height: Math.min(el.offsetHeight, top + OVERLAP) });
    };
    // Let go of, or sent to a stop: it eases in and settles softly.
    const settleSheet = (to: "peek" | "full") => {
        sheetAt.current = to;
        if (to === "peek") words.current?.scrollTo({ top: 0, behavior: "smooth" });
        gsap.to(sheetPos.current, {
            top: sheetStops()[to],
            duration: 0.75,
            ease: "expo.out",
            onUpdate: placeSheet,
            overwrite: true,
        });
    };

    // On to the stop either side, on any screen. What is showing is copied,
    // and the card itself changes to the next stop underneath — the row
    // moving there too, out of sight. Then the next is wiped on over the copy
    // from the side it lies on, behind a line of the lens's blue light, its
    // photo settling from a little closer in. The layer is solid, so nothing
    // of the copy shows through the next. On a phone, where the page is the
    // whole screen, the copy also draws back the other way inside its own
    // outline, and the header steps out and back in; from `md` the copy
    // holds still, so its photo stays whole until the line passes over it.
    //
    // Taps while it runs are let go by, so it cannot be hammered through,
    // until the wipe is all but done (`SLIDE_READY`); from then a tap lands
    // at once, bringing the slide to its end and starting the next.
    const shiftCard = (direction: number) => {
        // Only the layer between the tabs moves: the tabs hold still.
        const el = inner.current;
        const head = header.current;
        const pic = photo.current;
        const engine = control.current;
        if (!el || !head || !pic || !engine || !cardLive.current) return;
        if (slide.current && slide.current.time() < SLIDE_READY) return;
        slide.current?.progress(1);
        const onPhone = window.matchMedia(PHONE).matches;

        let ghost: HTMLElement | null = null;
        if (motionEnabled()) {
            // A picture only, but one that still takes the taps that land on
            // it, so none fall through to the row behind and close the card.
            ghost = el.cloneNode(true) as HTMLElement;
            ghost.setAttribute("aria-hidden", "true");
            ghost.querySelectorAll("button, a, [tabindex]").forEach((n) => n.setAttribute("tabindex", "-1"));
            el.before(ghost);
            const from = el.querySelectorAll<HTMLElement>("[data-scroll]");
            ghost.querySelectorAll<HTMLElement>("[data-scroll]").forEach((n, i) => {
                n.scrollTop = from[i]?.scrollTop ?? 0;
            });
        }

        // The number in the bar on show — the letterbox's, or the phone's —
        // copied as it is, to turn over with the card; see the slide below.
        const reels = ghost
            ? [...(dialog.current?.querySelectorAll<HTMLElement>("[data-reel]") ?? [])].filter((r) => r.offsetParent)
            : [];
        const reelCopies = reels.map((reel) => {
            const copy = reel.cloneNode(true) as HTMLElement;
            copy.removeAttribute("data-reel");
            copy.style.cssText = `position:absolute;left:${reel.offsetLeft}px;top:${reel.offsetTop}px;margin:0;pointer-events:none`;
            reel.after(copy);
            return copy;
        });

        engine.shift(direction);
        el.querySelectorAll<HTMLElement>("[data-scroll]").forEach((n) => (n.scrollTop = 0));
        if (onPhone) {
            gsap.killTweensOf(sheetPos.current);
            sheetAt.current = "peek";
            sheetPos.current.top = sheetStops().peek;
            placeSheet();
        }
        if (!ghost) return;

        // Everything here stays inside the layer's own outline — the incoming
        // stop, the outgoing copy and the line between them — so the slide
        // happens between the tabs and nothing shows past them. The line sits
        // in a frame the layer's size that cuts off its glow at the edge.
        const W = el.offsetWidth;
        const off = ghost;
        const frame = document.createElement("div");
        frame.setAttribute("aria-hidden", "true");
        frame.style.cssText = `position:absolute;top:${el.offsetTop}px;left:${el.offsetLeft}px;width:${W}px;height:${el.offsetHeight}px;overflow:hidden;z-index:35;pointer-events:none`;
        const edge = document.createElement("div");
        edge.style.cssText = `position:absolute;top:0;left:0;height:100%;width:2px;opacity:0;background:linear-gradient(to bottom,transparent,${LENS_BLUE} 18%,#fff 50%,${LENS_BLUE} 82%,transparent);box-shadow:0 0 22px 5px rgba(0,157,255,0.55)`;
        frame.appendChild(edge);
        el.after(frame);

        // How much of the next is still to come, 1 to 0; how far the next
        // still has to travel in; and how far the copy has drawn back. Each
        // clip is the wipe's, less whatever the card's own movement would
        // carry past its outline.
        const wipe = { p: 1 };
        const shove = { x: direction * W * 0.12 };
        const back = { x: 0 };
        const paint = () => {
            const s = shove.x;
            const left = (direction > 0 ? wipe.p * W : 0) + Math.max(0, -s);
            const right = (direction > 0 ? 0 : wipe.p * W) + Math.max(0, s);
            gsap.set(el, { x: s });
            el.style.clipPath = `inset(0px ${right}px 0px ${left}px)`;
            gsap.set(edge, { x: (direction > 0 ? wipe.p * W : W - wipe.p * W) + s - 1 });
            gsap.set(off, { x: back.x });
            off.style.clipPath =
                direction > 0 ? `inset(0px 0px 0px ${-back.x}px)` : `inset(0px ${back.x}px 0px 0px)`;
        };
        paint();

        // Off the mark the moment it is pressed — fastest at the start, so
        // the press is answered at once — and settling softly at the end.
        const move = { duration: 0.9, ease: "power3.out" };
        const tl = gsap
            .timeline({
                onComplete: () => {
                    off.remove();
                    frame.remove();
                    reelCopies.forEach((r) => r.remove());
                    el.style.clipPath = "none";
                    gsap.set(el, { clearProps: "x" });
                    gsap.set(pic.children, { scale: 1 });
                    gsap.set(head, { clearProps: "x,opacity,visibility" });
                    if (reels.length) gsap.set(reels, { clearProps: "x,opacity,visibility" });
                    slide.current = null;
                },
            })
            .to(back, { x: -direction * W * (onPhone ? 0.3 : 0), ...move }, 0)
            .to(shove, { x: 0, ...move }, 0)
            .to(wipe, { p: 0, ...move, onUpdate: paint }, 0)
            .fromTo(pic.children, { scale: 1.18 }, { scale: 1, ...move }, 0)
            .to(edge, { opacity: 1, duration: 0.12, ease: "power1.out" }, 0)
            .to(edge, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.35);
        // The number turns over with the card: the old one slides off the
        // way the card goes as the new one slides on, on the card's own curve.
        reels.forEach((reel, i) => {
            tl.fromTo(reel, { x: direction * 16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ...move }, 0).to(
                reelCopies[i],
                { x: -direction * 16, autoAlpha: 0, ...move },
                0
            );
        });
        if (onPhone) {
            tl.to(head, { x: -direction * 18, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0).fromTo(
                head,
                { x: direction * 18, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", immediateRender: false },
                0.25
            );
        }
        slide.current = tl;
    };

    const letGo = useEffectEvent(settleSheet);
    const place = useEffectEvent(placeSheet);

    // The phone's sheet by hand. Dragged up it opens to nearly the whole
    // screen, stretching and springing back if pulled on past that; dragged
    // down from rest it puts the card away. All the way up, the story inside
    // scrolls as usual — a drag down from its very top, or up past its end,
    // moves the sheet instead, and the handle always does. So does a drag on
    // the photo above it: down takes the sheet down and, far enough, the card
    // away; up opens the sheet.
    useEffect(() => {
        const text = words.current;
        const pic = photo.current;
        if (!text || !pic || !phone || !cardOpen) return;
        let drag: {
            y0: number;
            top0: number;
            y: number;
            t: number;
            v: number;
            handle: boolean;
            mode: "sheet" | "scroll" | null;
        } | null = null;

        const start = (e: TouchEvent) => {
            if (!cardLive.current) return;
            slide.current?.progress(1);
            const y = e.touches[0].clientY;
            const handle =
                e.target instanceof Element && (e.target.closest("[data-handle]") !== null || pic.contains(e.target));
            drag = { y0: y, top0: sheetPos.current.top, y, t: e.timeStamp, v: 0, handle, mode: null };
        };
        const move = (e: TouchEvent) => {
            if (!drag) return;
            const y = e.touches[0].clientY;
            const dy = y - drag.y0;
            const { full, H } = sheetStops();
            if (!drag.mode) {
                const up = sheetPos.current.top <= full + 1;
                if (up && dy === 0 && !drag.handle) return;
                const atTop = text.scrollTop <= 0;
                const atEnd = text.scrollTop + text.clientHeight >= text.scrollHeight - 1;
                drag.mode =
                    !up || drag.handle || (atTop && dy > 0) || (atEnd && dy < 0) ? "sheet" : "scroll";
                if (drag.mode === "sheet") gsap.killTweensOf(sheetPos.current);
            }
            if (drag.mode === "scroll") return;
            if (e.cancelable) e.preventDefault();
            const want = drag.top0 + dy;
            sheetPos.current.top = want < full ? full - rubber(full - want, H) : want;
            place();
            const dt = Math.max(1, e.timeStamp - drag.t);
            drag.v = drag.v * 0.4 + ((y - drag.y) / dt) * 0.6;
            drag.y = y;
            drag.t = e.timeStamp;
        };
        const end = () => {
            const d = drag;
            drag = null;
            if (!d || d.mode !== "sheet") return;
            const { full, peek } = sheetStops();
            const { top } = sheetPos.current;
            if (top > peek + DISMISS || (d.v > 0.6 && top > peek - 10)) {
                // On down off the screen at the speed it was let go at — see
                // the morph — and the card away behind it.
                fling.current = Math.max(d.v, 0.4);
                control.current?.closeFocus();
                return;
            }
            letGo(top + d.v * 180 < (full + peek) / 2 ? "full" : "peek");
        };

        for (const surface of [text, pic]) {
            surface.addEventListener("touchstart", start, { passive: true });
            surface.addEventListener("touchmove", move, { passive: false });
            surface.addEventListener("touchend", end);
            surface.addEventListener("touchcancel", end);
        }
        return () => {
            for (const surface of [text, pic]) {
                surface.removeEventListener("touchstart", start);
                surface.removeEventListener("touchmove", move);
                surface.removeEventListener("touchend", end);
                surface.removeEventListener("touchcancel", end);
            }
        };
    }, [phone, cardOpen]);

    // A card open as the window crosses `md`: each layout leaves its own
    // positions on the card — the phone's sheet and photo band, or nothing
    // but the stylesheet and the house lights from `md` — so the card is laid
    // out again, settled, for the one it is now in.
    const relayOut = useEffectEvent((nowPhone: boolean) => {
        const el = panel.current;
        const pic = photo.current;
        const text = words.current;
        if (!cardOpen || !el || !pic || !text) return;
        slide.current?.progress(1);
        // Caught mid-open, the morph is stopped where it is and the card set
        // out finished instead.
        const moving = [face.current, shade.current, barTop.current, barBottom.current].filter(
            (n): n is HTMLDivElement => n !== null
        );
        gsap.killTweensOf([sheetPos.current, cut.current, pic, text, el, ...moving]);
        cut.current = { t: 0, r: 0, b: 0, l: 0 };
        el.style.clipPath = "none";
        gsap.set(el, { autoAlpha: 1 });
        if (face.current) gsap.set(face.current, { opacity: 0 });
        cardLive.current = true;
        if (nowPhone) {
            gsap.set(pic, { left: 0, top: 0 });
            gsap.set(text, { autoAlpha: 1, x: 0 });
            sheetAt.current = "peek";
            sheetPos.current.top = sheetStops().peek;
            placeSheet();
        } else {
            gsap.set(pic, { clearProps: "left,top,width,height" });
            gsap.set(text, { clearProps: "transform", autoAlpha: 1 });
            if (shade.current) gsap.set(shade.current, { autoAlpha: 1 });
            const bars = [barTop.current, barBottom.current].filter((n): n is HTMLDivElement => n !== null);
            if (bars.length) gsap.set(bars, { autoAlpha: 1, yPercent: 0 });
        }
    });
    const wasPhone = useRef(phone);
    useEffect(() => {
        if (wasPhone.current === phone) return;
        wasPhone.current = phone;
        relayOut(phone);
    }, [phone]);

    // A phone turned, or its toolbars coming and going, with the page up:
    // the sheet goes back to its stop for the screen as it now is.
    useEffect(() => {
        if (!phone || !cardOpen) return;
        const onResize = () => {
            if (!cardLive.current) return;
            sheetPos.current.top = sheetStops()[sheetAt.current];
            place();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [phone, cardOpen]);

    // Reached for before the cards have arrived: the line saying so twitches,
    // so it is plain the row is not ignoring them by mistake.
    const nudge = () => {
        if (ready || !status.current || !motionEnabled()) return;
        gsap.fromTo(
            status.current,
            { x: -6 },
            { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)", overwrite: true }
        );
    };

    // The phone's back button is the X, not a way off the site — and with a
    // card open, it puts the card back first.
    useBackToClose(phase === "opening" || phase === "open", () => {
        if (phase === "opening") backed.current = true;
        else closeDialog();
    });
    useBackToClose(phase === "open" && cardOpen, closeCard);

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
                              setReady(false);
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

    // All the way open, it covers the page entirely: the page's own drawing
    // loops rest under it until it starts to fold back.
    useEffect(() => {
        if (phase !== "open") return;
        setCovered(true);
        return () => setCovered(false);
    }, [phase]);

    // While it is up: the page behind is still, inert, and out of reach.
    useEffect(() => {
        if (!shown) return;
        const html = document.documentElement;
        const lenis = getLenis();
        const behind = Array.from(document.body.children).filter(
            (el): el is HTMLElement => el instanceof HTMLElement && el !== dialog.current
        );

        // `overscroll-behavior` too: without it a drag down on a phone still
        // pulls the whole page (and, on Android, reloads it).
        lenis?.stop();
        html.style.overflow = "hidden";
        html.style.overscrollBehavior = "none";
        behind.forEach((el) => (el.inert = true));

        return () => {
            behind.forEach((el) => (el.inert = false));
            html.style.overflow = "";
            html.style.overscrollBehavior = "";
            lenis?.start();
        };
    }, [shown]);

    // Focus goes in with the page and comes back to the button after it.
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
        }
    }, [phase]);

    // Escape backs out one step at a time: the card first, then the page.
    // With a card open the carousel may already have handled the key itself
    // (it marks the event handled), and then there is nothing left to do.
    // With a card open, the arrow keys go to the stops either side.
    const stepCard = useEffectEvent(shiftCard);
    useEffect(() => {
        if (phase !== "open") return;
        const onKey = (e: KeyboardEvent) => {
            if (cardOpen && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                e.preventDefault();
                stepCard(e.key === "ArrowRight" ? 1 : -1);
                return;
            }
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
    //
    // On a phone it is a page of its own: the card grows straight to the
    // whole screen, its face fading to the bare photo; then the sheet rises
    // from the foot of the screen, pushing the photo up ahead of it into the
    // band it keeps at the top. Closing drops the sheet, the photo filling the
    // screen again behind it, and folds that back into the card.
    useIsomorphicLayoutEffect(() => {
        const el = panel.current;
        const pic = photo.current;
        const cover = face.current;
        const text = words.current;
        const stage = row.current;
        const foot = bar.current;
        if (!el || !pic || !cover || !text || !stage || !foot) return;
        const showing = Number(gsap.getProperty(el, "opacity")) > 0;
        if (!cardOpen && !showing) return;

        // A slide to another stop caught halfway is finished first, so the
        // card is measured from where it really is.
        if (slide.current) slide.current.progress(1);

        // The card, worked out the way the carousel works it out: its panel
        // height at 4:5, centred on the row — in the panel's own pixels, as
        // the panel is centred on the row from `md` but is the whole screen
        // below it.
        const W = el.offsetWidth;
        const H = el.offsetHeight;
        const box = el.getBoundingClientRect();
        const rowBox = stage.getBoundingClientRect();
        const ch = cardHeight(stage.clientWidth, stage.clientHeight);
        const cw = ch * (CARD_W / CARD_H);
        const card = {
            left: rowBox.left - box.left + (rowBox.width - cw) / 2,
            top: rowBox.top - box.top + (rowBox.height - ch) / 2,
            width: cw,
            height: ch,
        };
        const onPhone = window.matchMedia(PHONE).matches;
        // The photo lives in the layer between the tabs, so where it goes is
        // given in that layer's pixels; the clip stays in the card's.
        const layer = inner.current;
        const offL = layer?.offsetLeft ?? 0;
        const offT = layer?.offsetTop ?? 0;
        const local = (r: typeof card) => ({ ...r, left: r.left - offL, top: r.top - offT });
        // The house lights from `md` — see where they are drawn.
        const lights = shade.current;
        const barUp = barTop.current;
        const barDown = barBottom.current;
        if (!lights || !barUp || !barDown) return;
        const bars = [barUp, barDown];
        const picCard = local(card);

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

        if (onPhone && cardOpen) {
            const fill = { left: 0, top: 0, width: W, height: H };
            cardLive.current = false;
            if (!showing) {
                text.scrollTop = 0;
                cut.current = clip(card);
                draw();
                gsap.set(el, { autoAlpha: 1 });
                gsap.set(pic, picCard);
                gsap.set(cover, { opacity: 1 });
                gsap.set(text, { autoAlpha: 1, x: 0 });
                gsap.set(foot, { yPercent: 0 });
                sheetPos.current.top = H;
                gsap.set(text, { y: H });
                gsap.set(foot, { y: H });
            }
            sheetAt.current = "peek";
            // The card's words off first, leaving the bare photo; then the
            // photo out to the whole screen; then the sheet up — every move
            // easing in and settling softly rather than stopping dead.
            tl.to(el, { autoAlpha: 1, duration: 0.12 }, 0)
                .to(cover, { opacity: 0, duration: 0.4, ease: "power1.inOut" }, 0)
                .to(cut.current, { ...full, duration: 0.95, ease: "expo.inOut", onUpdate: draw }, 0.3)
                .to(pic, { ...local(fill), duration: 0.95, ease: "expo.inOut" }, 0.3)
                .to(
                    sheetPos.current,
                    { top: sheetStops().peek, duration: 1.1, ease: "power3.inOut", onUpdate: placeSheet },
                    1.05
                )
                .add(() => {
                    gsap.set(el, { clipPath: "none" });
                    cardLive.current = true;
                });
        } else if (onPhone) {
            cardLive.current = false;
            gsap.killTweensOf(sheetPos.current);
            draw();
            // The sheet down off the screen — carried on at the speed it was
            // let go at, if it was pulled down, or eased away if not — and
            // then the photo folds back into the card, the card's words
            // coming back as it lands.
            const left = Math.max(0, H - sheetPos.current.top);
            const thrown = fling.current;
            fling.current = 0;
            const drop = thrown
                ? {
                      duration: Math.min(0.7, Math.max(0.25, (2 * left) / (thrown * 1000))),
                      ease: "power1.out",
                  }
                : { duration: 0.65, ease: "power2.inOut" };
            const fold = drop.duration - 0.1;
            tl.to(sheetPos.current, { top: H, ...drop, onUpdate: placeSheet }, 0)
                .to(cut.current, { ...clip(card), duration: 0.95, ease: "expo.inOut", onUpdate: draw }, fold)
                .to(pic, { ...picCard, duration: 0.95, ease: "expo.inOut" }, fold)
                .to(cover, { opacity: 1, duration: 0.4, ease: "power1.inOut" }, fold + 0.6)
                .to(el, { autoAlpha: 0, duration: 0.12 }, fold + 1);
        } else if (cardOpen) {
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

            // First the card grows on its own, as itself, to the size its
            // photo will be in the open panel — the card's own shape at the
            // panel's full height, where there is room for it — centred, the
            // clip hugging it, so no black yet. Then the panel opens out from
            // its right as the photo, at that same size, moves over to the
            // left to make room, and the story slides out from behind it.
            const grown = { left: (W - end.width) / 2, top: (H - end.height) / 2, width: end.width, height: end.height };
            const beside = end.width < (layer?.offsetWidth ?? W);
            cardLive.current = false;

            if (!showing) {
                text.scrollTop = 0;
                cut.current = clip(card);
                draw();
                gsap.set(el, { autoAlpha: 1 });
                gsap.set(pic, picCard);
                gsap.set(cover, { opacity: 1 });
                gsap.set(text, { autoAlpha: 0, x: beside ? -40 : 0, y: beside ? 0 : -24 });
            }
            tl.timeScale(DESK_PACE);
            // The card grows forward on the page as it is; the house lights go
            // down only as it opens out into the story, over that same stretch
            // and on the same curve, so the two land together. From where
            // they are, if they were on their way back up.
            if (!showing) {
                gsap.set(lights, { autoAlpha: 0 });
                gsap.set(bars, { autoAlpha: 1 });
                gsap.set(barUp, { yPercent: -100 });
                gsap.set(barDown, { yPercent: 100 });
            }
            const grow = { duration: 0.7, ease: "power3.inOut" };
            const expand = { duration: 1, ease: "expo.inOut" };
            tl.to(lights, { autoAlpha: 1, ...expand }, 0.7).to(bars, { yPercent: 0, ...expand }, 0.7);
            // Every move eases in and settles softly, the story's slide out
            // longest of all, rather than stopping dead.
            tl.to(el, { autoAlpha: 1, duration: 0.15 }, 0)
                .to(cut.current, { ...clip(grown), ...grow, onUpdate: draw }, 0)
                .to(pic, { ...local(grown), ...grow }, 0)
                .to(cut.current, { ...full, ...expand, onUpdate: draw }, 0.7)
                .to(pic, { ...end, ...expand }, 0.7)
                .to(cover, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.95)
                .to(text, { autoAlpha: 1, x: 0, y: 0, duration: 1, ease: "expo.out" }, 1.2)
                // Settled: the shape goes back to the stylesheet, so a resize
                // or a turned phone lays the panel out afresh.
                .add(() => {
                    gsap.set(el, { clipPath: "none" });
                    gsap.set(pic, { clearProps: "left,top,width,height" });
                    cardLive.current = true;
                });
        } else {
            // Wherever it got to — all the way open, its clip handed back as
            // `none`, or caught partway — it folds back from there.
            cardLive.current = false;
            draw();
            tl.timeScale(DESK_PACE);
            tl.to(text, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0)
                .to(cut.current, { ...clip(card), duration: 0.8, ease, onUpdate: draw }, 0.05)
                .to(pic, { ...picCard, duration: 0.8, ease }, 0.05)
                .to(cover, { opacity: 1, duration: 0.4, ease: "power2.inOut" }, 0.35)
                // Folded back over the card, which is right where it was.
                .to(el, { autoAlpha: 0, duration: 0.15 }, 0.85)
                // And the house lights come up as it folds, in step with it.
                .to(lights, { autoAlpha: 0, duration: 0.8, ease }, 0.05)
                .to(barUp, { yPercent: -100, duration: 0.8, ease }, 0.05)
                .to(barDown, { yPercent: 100, duration: 0.8, ease }, 0.05);
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
                        // Nothing in it pans or zooms the page — only the
                        // story's own scrolling, which says so itself.
                        className="fixed inset-0 z-[110] touch-none bg-white text-[#111111] [clip-path:circle(0px_at_50%_50%)]"
                    >
                        <div ref={content} className="relative flex h-full flex-col opacity-0">
                            {/* The house lights, from `md`: as a card opens
                                the white page goes down to near-black, and
                                black bars close in from the top and bottom
                                edges like a film's — the header sits in the
                                top one. The two are always the same height:
                                whatever the open card, centred on the screen,
                                leaves above and below it, and never less than
                                the header — see the card. Moved by the card's
                                own morph, in step with it — see there. Out of
                                sight until then. */}
                            <div
                                ref={shade}
                                aria-hidden="true"
                                className="pointer-events-none invisible absolute inset-0 z-[15] hidden bg-[#1a1a1a] md:block"
                            />
                            <div
                                ref={barTop}
                                aria-hidden="true"
                                className="pointer-events-none invisible absolute inset-x-0 top-0 z-[16] hidden h-[calc((100%_-_min(40rem,_100%_-_10rem))_/_2)] bg-black md:block"
                            />
                            <div
                                ref={barBottom}
                                aria-hidden="true"
                                className="pointer-events-none invisible absolute inset-x-0 bottom-0 z-[16] hidden h-[calc((100%_-_min(40rem,_100%_-_10rem))_/_2)] items-center justify-center bg-black md:flex"
                            >
                                {/* Which stop this is, of how many — in the
                                    bar, as a film's reel number would be. */}
                                <span data-reel className="font-mono text-label tabular-nums tracking-[0.24em] text-white/60">
                                    {counter}
                                </span>
                            </div>

                            {/* Over everything but the card on every screen;
                                with a card open it turns white — over its
                                black bar from `md`, and on a phone over the
                                card's photo, shadowed to read over any of
                                them, with a shade down from the top behind it
                                — see the photo. */}
                            <header
                                ref={header}
                                className={cn(
                                    "relative z-40 flex h-16 shrink-0 items-center justify-center px-3 transition-colors duration-300 md:h-20 md:px-6",
                                    // back to black only once its bar has
                                    // started to lift off it
                                    cardOpen
                                        ? // from `md`, only once its bar is
                                          // most of the way in — see the morph
                                          "text-white delay-200 md:delay-[900ms] max-md:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)] max-md:[&_svg]:drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
                                        : "delay-200 md:delay-500"
                                )}
                            >
                                {/* The name in the corner, giving way to the
                                    way back out of an open card: an arrow, the
                                    X's twin — same size, line, colour and
                                    hover, mirrored across the header. */}
                                <span
                                    aria-hidden={cardOpen}
                                    className={cn(
                                        "absolute left-6 text-[15px] font-medium tracking-[-0.02em] transition-[opacity,translate] duration-300 sm:text-[17px] md:left-9",
                                        cardOpen && "-translate-x-2 opacity-0"
                                    )}
                                >
                                    Kean
                                </span>
                                <button
                                    type="button"
                                    onClick={closeCard}
                                    tabIndex={cardOpen ? 0 : -1}
                                    aria-hidden={!cardOpen}
                                    aria-label="Back to all cards"
                                    className={cn(
                                        "absolute left-3 grid h-11 w-11 place-items-center rounded-full transition-[background-color,opacity,translate] duration-300 hover:bg-current/10 md:left-6",
                                        !cardOpen && "pointer-events-none translate-x-2 opacity-0"
                                    )}
                                >
                                    <Arrow back />
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
                                    className="absolute right-3 grid h-11 w-11 place-items-center rounded-full transition-colors duration-300 hover:bg-current/10 md:right-6"
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
                            </header>

                            <div
                                ref={row}
                                onPointerDown={nudge}
                                onWheel={nudge}
                                className="relative min-h-0 flex-1"
                            >
                                {/* Mounted once the white has finished
                                    spreading, so its own entry plays in full
                                    view rather than behind the reveal. */}
                                {items && (phase === "open" || phase === "closing") && (
                                    <LiquidGlassCarousel
                                        items={items}
                                        panelHeight={PANEL_H}
                                        panelRatio={PANEL_RATIO}
                                        panelWidthRatio={PANEL_WIDTH}
                                        // The focused card holds still; the
                                        // reading panel below grows out of it.
                                        centerScale={1}
                                        returnDelay={phone ? RETURN_DELAY_PHONE : RETURN_DELAY}
                                        leave={phone ? LEAVE_PHONE : LEAVE}
                                        onEntryChange={setReady}
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

                                {/* The open card, as a wide reading panel: the
                                    photo on one side and the story on the
                                    other, stacked on a phone. It grows out of
                                    the card it opens from — see the morph
                                    above — and is always wider and taller than
                                    it, so the card, holding still underneath
                                    (`centerScale={1}`), never shows past it.

                                    Below `md` it is a page over the whole
                                    screen instead: the photo filling it, and
                                    the story on a sheet that rises over it —
                                    see the morph and the sheet above — with
                                    the stops either side a tap away along the
                                    foot. Pulling the sheet down, or going
                                    back, puts it away.

                                    From `md` it runs edge to edge, up to 40rem
                                    tall and centred on the whole screen — not
                                    the row, which the header and the line
                                    under it sit off-centre — so the letterbox
                                    bars, the same height top and bottom, meet
                                    it exactly. (In the row's terms: 1.5rem
                                    short of its height at most, 0.75rem above
                                    its middle.) The photo and the story are
                                    in a layer of their own
                                    down the middle, no wider than 104rem. All
                                    of either side of that is the stop that
                                    way: one button each, the arrow in the
                                    middle of it. They are the card itself, so
                                    they open out with it and nothing can show
                                    between them; and a slide to the next moves
                                    only the layer between them. */}
                                <article
                                    ref={panel}
                                    aria-hidden={!cardOpen}
                                    className={cn(
                                        "invisible absolute z-30 overflow-hidden bg-[#111111] text-white opacity-0 max-md:fixed max-md:inset-0 md:inset-x-0 md:top-[calc((100%_-_min(40rem,_100%_-_1.5rem))_/_2_-_0.75rem)] md:h-[min(40rem,_calc(100%_-_1.5rem))]",
                                        !cardOpen && "pointer-events-none"
                                    )}
                                >
                                    {([-1, 1] as const).map((direction) => (
                                        <button
                                            key={direction}
                                            type="button"
                                            onClick={() => shiftCard(direction)}
                                            tabIndex={cardOpen ? 0 : -1}
                                            aria-label={direction < 0 ? "Previous stop" : "Next stop"}
                                            className={cn(
                                                "group absolute inset-y-0 hidden place-items-center text-white outline-none md:grid md:w-[max(4.5rem,calc((100%-104rem)/2))] lg:w-[max(5.5rem,calc((100%-104rem)/2))]",
                                                direction < 0 ? "left-0" : "right-0"
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/[0.06] group-focus-visible:bg-white/[0.06]"
                                            />
                                            <span
                                                className={cn(
                                                    "relative transition-transform duration-300",
                                                    direction < 0 ? "group-hover:-translate-x-1.5" : "group-hover:translate-x-1.5"
                                                )}
                                            >
                                                <Arrow back={direction < 0} className="h-9 w-9" />
                                            </span>
                                        </button>
                                    ))}

                                    <div
                                        ref={inner}
                                        className="absolute inset-0 bg-[#111111] md:[container-type:size] md:left-[max(4.5rem,calc((100%-104rem)/2))] md:right-[max(4.5rem,calc((100%-104rem)/2))] lg:left-[max(5.5rem,calc((100%-104rem)/2))] lg:right-[max(5.5rem,calc((100%-104rem)/2))]"
                                    >
                                        <div
                                            ref={photo}
                                            className="absolute left-0 top-0 z-10 h-full w-full overflow-hidden md:w-[min(calc(100cqh*0.8),44%)]"
                                        >
                                            {/* The original, which drawing the
                                                cards has already fetched — so the
                                                stop either side is there the
                                                moment it slides on. */}
                                            {stop.image ? (
                                                <Image
                                                    src={stop.image}
                                                    alt=""
                                                    fill
                                                    unoptimized
                                                    loading="eager"
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
                                                        loading="eager"
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            {/* Shade down from the top on a phone,
                                                for the header over it. */}
                                            <div
                                                aria-hidden="true"
                                                className={cn(
                                                    "absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 md:hidden",
                                                    cardOpen ? "opacity-100 delay-200" : "opacity-0"
                                                )}
                                            />
                                        </div>

                                        {/* On a phone, the sheet: as tall as the
                                            screen under the header, moved up and
                                            down by the sheet above, and scrolling
                                            its story once it is all the way up.
                                            From `md`, the column beside the photo
                                            it always was. */}
                                        <div
                                            ref={words}
                                            data-scroll
                                            data-lenis-prevent
                                            className="absolute inset-x-0 top-0 z-20 h-[calc(100%-4rem)] touch-pan-y overflow-y-auto overscroll-contain rounded-t-[1.25rem] bg-[#111111] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2 md:bottom-0 md:left-[min(calc(100cqh*0.8),44%)] md:flex md:h-auto md:flex-col md:overflow-y-visible md:rounded-none md:bg-transparent md:p-6 lg:p-12"
                                        >
                                            {/* The handle: dragged, it moves the
                                                sheet; tapped, it opens it all the
                                                way or brings it back down. */}
                                            <button
                                                type="button"
                                                data-handle
                                                onClick={() => settleSheet(sheetAt.current === "full" ? "peek" : "full")}
                                                tabIndex={cardOpen ? 0 : -1}
                                                aria-label="Show more or less of the story"
                                                className="mx-auto mb-3 flex h-7 w-16 items-center justify-center md:hidden"
                                            >
                                                <span className="h-1 w-10 rounded-full bg-white/30" />
                                            </button>
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
                                                data-scroll
                                                data-lenis-prevent
                                                className="mt-6 flex-1 touch-pan-y md:mt-4 md:min-h-0 md:overflow-y-auto md:overscroll-contain lg:mt-6"
                                            >
                                                <div className="flex min-h-full flex-col md:justify-center">
                                                    <h3 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] md:text-4xl lg:text-5xl">
                                                        {stop.title}
                                                    </h3>
                                                    <p className="mt-4 max-w-prose text-base leading-relaxed text-white/85 lg:mt-6 lg:text-lg">
                                                        {stop.story}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>

                                {/* The stops either side, along the foot of a
                                    phone's page, without going back out to
                                    the row — outside the page, so a slide to
                                    the next never wipes or copies it and it is
                                    always there to tap. Starts off below the
                                    screen; the sheet brings it up with it. */}
                                <nav
                                    ref={bar}
                                    aria-label="Other stops"
                                    aria-hidden={!cardOpen}
                                    className={cn(
                                        "fixed inset-x-0 bottom-0 z-[31] flex items-center justify-between gap-3 border-t border-white/10 bg-[#111111] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white [transform:translateY(100vh)] md:hidden",
                                        !cardOpen && "pointer-events-none"
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => shiftCard(-1)}
                                        tabIndex={cardOpen ? 0 : -1}
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-white/80 active:bg-white/10"
                                    >
                                        <span aria-hidden="true">←</span> Previous
                                    </button>
                                    <span data-reel className="tabular-nums text-white/45">
                                        {counter}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => shiftCard(1)}
                                        tabIndex={cardOpen ? 0 : -1}
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-white/80 active:bg-white/10"
                                    >
                                        Next <span aria-hidden="true">→</span>
                                    </button>
                                </nav>
                            </div>

                            {/* While the cards are still arriving, what is
                                going on in place of how to use them — the
                                row takes nothing until they are in. */}
                            {/* From `md` exactly the height of the letterbox
                                bar that closes over it, so the open card,
                                filling the row above, meets the bar's edge. */}
                            <p className="grid shrink-0 px-4 pb-6 pt-2 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-black/50 md:h-14 md:content-center md:py-0">
                                <span
                                    ref={status}
                                    aria-hidden={ready}
                                    className={cn(
                                        "inline-flex items-center justify-center gap-2 transition-opacity duration-500 [grid-area:1/1]",
                                        ready && "opacity-0"
                                    )}
                                >
                                    <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-black/15 border-t-black/60" />
                                    Setting out the cards…
                                </span>
                                <span
                                    aria-hidden={!ready}
                                    className={cn(
                                        "transition-opacity duration-500 [grid-area:1/1]",
                                        !ready && "opacity-0"
                                    )}
                                >
                                    <span className="[@media(hover:hover)]:hidden">
                                        Swipe to browse · Tap a card to read it
                                    </span>
                                    <span className="hidden [@media(hover:hover)]:inline">
                                        Scroll or drag to browse · Click a card to read it
                                    </span>
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
