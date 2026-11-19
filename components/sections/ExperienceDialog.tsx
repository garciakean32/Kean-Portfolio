"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness } from "lucide-react";
import type {
    CardRect,
    CurvedGlassHandle,
    CurvedGlassItem,
    CurvedGlassLeave,
} from "@/components/ui/curved-glass-carousel";
import type { GlassStillHandle } from "@/components/ui/glass-still";
import { PAGE_BUTTON, PageButtonLabel } from "@/components/shared/PageButton";
import { experience } from "@/lib/data";
import { useBackToClose } from "@/lib/history";
import { gsap, motionEnabled, setCovered, useIsomorphicLayoutEffect } from "@/lib/motion";
import { centreOn } from "@/lib/sections";
import { spread, useHoldPage } from "@/lib/spread";
import { cn } from "@/lib/utils";

/* WebGL and all of three.js, fetched when the button is first reached for
   rather than with the rest of the page — the works' own carousel, turned on
   its side into a reel. */
const loadCarousel = () => import("@/components/ui/curved-glass-carousel");
const CurvedGlassCarousel = dynamic(() => loadCarousel().then((m) => m.CurvedGlassCarousel), {
    ssr: false,
});

/* The open card as a film still behind the same glass, fetched along with it. */
const loadStill = () => import("@/components/ui/glass-still");
const GlassStill = dynamic(() => loadStill().then((m) => m.GlassStill), { ssr: false });

/* The cards: each stop's photo on its own, 4:5 and cropped about its middle —
   the crop the open card's photo makes, so the one grows out of the other
   without a seam. What the stop was is said beside it, not on it. */
const CARD_ASPECT = 4 / 5;
const ITEMS: CurvedGlassItem[] = experience.map((stop) => ({ src: stop.image, alt: "" }));
const STILLS = experience.map((stop) => stop.image);

/* The small marks round the edges — the works' own. */
const MARK = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-black/55";

/* The reel's buttons: the works' glass ones. */
const GLASS_BUTTON =
    "grid place-items-center rounded-full border border-black/10 bg-white/55 backdrop-blur-md transition-colors duration-300 hover:bg-white";

type Phase = "closed" | "opening" | "open" | "closing";

/* An arrow the header's back, the open card's sides and the reel's buttons
   are drawn with — the same box, line and ends — pointing whichever way it
   is told. */
const ARROWS = {
    left: "M19 12H5M11 6l-6 6 6 6",
    right: "M5 12h14M13 6l6 6-6 6",
    up: "M12 19V5M6 11l6-6 6 6",
    down: "M12 5v14M6 13l6 6 6-6",
};

function Arrow({ way, className }: { way: keyof typeof ARROWS; className?: string }) {
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
            <path d={ARROWS[way]} />
        </svg>
    );
}

/* From `lg`, the words and the buttons sit this far either side of the
   centred card, the words no wider than this, and neither nearer the screen's
   edge than the corners' marks. In CSS pixels. */
const BESIDE = 72;
const WORDS_WIDTH = 480;
const EDGE = 32;

/* The centred stop's name, beside it — under it, below `lg` — changing with
   it, out of a blur, the way the page's words arrive. Not until the cards
   have come in, though: it arrives as the centred card comes to rest, so the
   two land together. It opens the stop's story, as the card does.

   Every stop's name is laid in the same cell as well, unseen, so the block
   is always as tall as the longest of them: were it to grow or shrink between
   stops, the reel would change size with it, and the whole row being laid
   out afresh reads as a nudge and a blink. */
const STOP_TITLE = "font-display text-2xl font-bold leading-tight tracking-[-0.02em] md:text-3xl lg:text-4xl xl:text-5xl";

function ReelWords({ active, arrived, onRead }: { active: number; arrived: boolean; onRead: () => void }) {
    const stop = experience[active] ?? experience[0];
    return (
        <div aria-live="polite" className="grid">
            {experience.map((s) => (
                <h3 key={s.title} aria-hidden="true" className={cn(STOP_TITLE, "invisible [grid-area:1/1]")}>
                    {s.title}
                </h3>
            ))}
            <AnimatePresence mode="wait" initial={false}>
                {arrived && (
                    <motion.h3
                        key={active}
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(STOP_TITLE, "[grid-area:1/1]")}
                    >
                        <button
                            type="button"
                            onClick={onRead}
                            className="transition-opacity duration-300 [text-align:inherit] hover:opacity-60"
                        >
                            {stop.title}
                        </button>
                    </motion.h3>
                )}
            </AnimatePresence>
        </div>
    );
}

/* Putting an open card back, from `md`: when the card starts down from where
   it came forward to, into its place in the reel, and how long it takes —
   in the close's own time, which runs at `DESK_PACE`. The other cards come
   back round it over that very stretch and on its curve, from just out of
   sight, and the reel's words and buttons with them — see `WORDS_BACK`,
   which keeps the same numbers in real time — so all of it moves as one. */
const PLACE_AT = 0.85;
const PLACE_TIME = 0.6;

/* How the other cards go when one is opened: on round the reel and away,
   together with the card's own growing — over the same stretch and on the
   same curve — rather than clearing off first and leaving it to open after.
   On a phone, as long as the photo takes to fill the screen. */
const LEAVE: CurvedGlassLeave = { delay: 0, duration: 0.75, ease: "power3.inOut" };
const LEAVE_PHONE: CurvedGlassLeave = { delay: 0.1, duration: 1, ease: "power3.inOut" };

/* The reel's words and buttons, with a card open: away with the other cards,
   over the same stretch and on the same curve as they go, `LEAVE` — and back
   with them, and with the card itself, as it is put back down into its place:
   `PLACE_AT` and `PLACE_TIME` at `DESK_PACE`, on its curve. */
const WORDS_AWAY = "pointer-events-none opacity-0 duration-[750ms] ease-[cubic-bezier(0.65,0,0.35,1)]";
const WORDS_BACK = "delay-[810ms] duration-[570ms] ease-[cubic-bezier(0.65,0,0.35,1)]";

/* At the end of a close the reel's own card is put back under the photo this
   long, in seconds, before the photo goes: the two are the same, so there is
   never a frame with neither. */
const HANDOFF = 0.05;

/* How much faster than as first designed the panel opens and closes from `md`
   — only a hair: any quicker and the card is open before the eye has
   followed it there. */
const DESK_PACE = 1.05;

/* Going through the reel to the stop either side: how long the card rests
   back down in the reel before the reel turns, and how long at least the
   reel turns for before the next card comes out — never before the reel is
   at rest on it. The card folds and comes out again at its own pace, as by
   hand. */
const THROUGH_GAP = 0.25;
const THROUGH_TURN = 0.5;

/* A wheel tick or a trackpad swipe with a card open, as on the reel: the
   scroll that makes a step, and the quiet that ends a gesture. */
const WHEEL_STEP = 30;
const WHEEL_GAP_MS = 220;

/* The arrows either side of the reel number, in the bar under an open card. */
const BAR_ARROW =
    "pointer-events-auto grid h-11 w-11 place-items-center rounded-full text-white/60 transition-colors duration-300 hover:bg-white/[0.08] hover:text-white focus-visible:text-white";

/* Below `md`, an open card is the phone's full-screen page. */
const PHONE = "(max-width: 767px)";

/* The phone's sheet: where its top rests, as a share of the screen's height;
   how far below its resting place a pull down puts the card away; and how
   hard it pulls back past the top (the lower, the stiffer). */
const PEEK = 0.46;
const DISMISS = 80;
const STRETCH = 0.55;

/* On a phone, how far below the sheet's top the open photo reaches, under
   the sheet's round corners. */
const SHEET_ROUND = 20;

/* How far a sheet pulled `by` pixels past its stop, out of `size`, actually
   goes: all of it at first, less and less the further it is pulled. */
function rubber(by: number, size: number) {
    return (by * size * STRETCH) / (size + STRETCH * by);
}

/**
 * The way into the story: a white button that opens the experience as a
 * full-screen white page.
 *
 * The page arrives as white spreading out from the button itself, a circle
 * growing from its centre until it has covered the screen, while the button
 * fades from under it; closing runs the same thing backwards into the button.
 * The page behind is held still and inert for as long as it is open.
 *
 * Inside, the stops are the works' glass carousel turned on its side: a
 * reel, the centred card's photo behind the same glass, the ones above and
 * below it tilting back, soft and pale, cut off by the screen's top and
 * bottom. The page is laid out the way the works' is — what this is, the
 * stop's dates and the way out along the top; how far through and what the
 * stop was in the bottom corners; and its name and the start of its story
 * beside it from `lg`, or under it, coming in as the cards come to rest. A
 * wheel tick, a swipe or a drag up or down, the arrows, or the arrow keys
 * move it on; the cards cannot be touched until they are in.
 *
 * Opening a card brings it forward as itself, glass and all, the reel's words
 * and buttons going with the other cards; from `md` it then goes over to the
 * left of a pane of glass across the screen, its story beside it, between
 * two black bars as the lights go down. The stops either side are either
 * side of the reel number under it, each gone to back through the reel. The
 * back arrow, Escape, or going back returns it. X, or Escape with no card
 * open, closes the whole page.
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
    const words = useRef<HTMLDivElement>(null);
    /* the open card's words, in the layer they sit in */
    const inner = useRef<HTMLDivElement>(null);
    /* the house lights from `md`: the page's shade, and the letterbox bars */
    const shade = useRef<HTMLDivElement>(null);
    const barTop = useRef<HTMLDivElement>(null);
    const barBottom = useRef<HTMLDivElement>(null);
    const header = useRef<HTMLElement>(null);
    const bar = useRef<HTMLElement>(null);
    /* the phone's sheet: where its top is, and which stop it is at or
       headed for */
    const sheetPos = useRef({ top: 0 });
    const sheetAt = useRef<"peek" | "full">("peek");
    /* the open card all the way out and settled — its sheet draggable on a
       phone, and the stops either side a tap away on any screen */
    const cardLive = useRef(false);
    /* how fast, in px/ms, a sheet pulled down to put the card away was going */
    const fling = useRef(0);
    const control = useRef<CurvedGlassHandle | null>(null);
    /* the open card as a film still behind glass; and, wider than a phone,
       its photo's box as the page lays it out, for it to draw the photo in */
    const still = useRef<GlassStillHandle | null>(null);
    const photoBox = useRef<HTMLDivElement>(null);
    /* going through the reel to the stop either side: which way, while it
       goes, and the next step of it, waiting */
    const through = useRef<number | null>(null);
    const throughCall = useRef<gsap.core.Tween | null>(null);
    const wasShown = useRef(false);
    /* back pressed while the white was still spreading — closed once it lands */
    const backed = useRef(false);

    const [phase, setPhase] = useState<Phase>("closed");
    const [active, setActive] = useState(0);
    const [cardOpen, setCardOpen] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    /* where the reel draws its centred card, and whether the cards have come
       to rest at the end of their way in */
    const [reelCard, setReelCard] = useState<CardRect | null>(null);
    const [arrived, setArrived] = useState(false);
    const [phone, setPhone] = useState(false);
    /* the still could be had — WebGL — or the plain photo stands in for it */
    const [stillLive, setStillLive] = useState(true);

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

    /* Start fetching the carousel and the still the moment the button is
       reached for, so both are usually there by the time the white has
       finished spreading. */
    const warm = () => {
        loadCarousel();
        loadStill();
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
    const closeDialog = () => {
        through.current = null;
        throughCall.current?.kill();
        setPhase((p) => (p === "open" ? "closing" : p));
    };

    // A card opened — from the reel, or from its title — and put back: the
    // others part away round the reel as it comes out, and come back as it
    // folds. Put back by hand, any way through the reel is called off.
    const openCard = () => {
        if (phase !== "open" || cardOpen || through.current !== null) return;
        control.current?.hold(phone ? LEAVE_PHONE : LEAVE);
        setCardOpen(true);
    };
    const closeCard = () => {
        if (!cardOpen) return;
        through.current = null;
        throughCall.current?.kill();
        setCardOpen(false);
    };

    /* The phone's sheet's two stops, in the panel's pixels: all the way up,
       just under the header, and resting, a little under halfway down. */
    const sheetStops = () => {
        const H = panel.current?.offsetHeight ?? window.innerHeight;
        return { full: header.current?.offsetHeight ?? 64, peek: Math.round(H * PEEK), H };
    };
    // The sheet where `sheetPos` says; the bar along the foot riding down
    // with it whenever it is below rest, so a sheet pulled down takes
    // everything down with it; and the photo's box down to the sheet's top,
    // so the photo — the still draws it in that box — fills the screen with
    // the sheet away, and shrinks to fit above it as it comes up, however
    // far up it is pulled.
    const placeSheet = () => {
        const text = words.current;
        const foot = bar.current;
        const box = photoBox.current;
        if (!text || !foot || !box) return;
        const { top } = sheetPos.current;
        const { peek, H } = sheetStops();
        gsap.set(text, { y: top });
        gsap.set(foot, { y: Math.max(0, top - peek) });
        gsap.set(box, { height: Math.max(SHEET_ROUND, Math.min(H, top + SHEET_ROUND)) });
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

    // On to the stop either side, on any screen — back through the reel,
    // exactly as by hand: the open card is put back down into it, the others
    // coming back round it and the reel's words and buttons with it; the
    // reel turns on a stop, the next stop's name coming in; and that card
    // comes out. Nothing else is taken until it is through.
    const shiftCard = (direction: number) => {
        if (!cardOpen || !cardLive.current || through.current !== null) return;
        through.current = direction;
        setCardOpen(false);
    };

    // Once the card is back down in the reel, the reel turns on — let go
    // and still, a moment after; and once it has come to rest on the next
    // stop, the card there comes out — see the morph. It reads only refs, so
    // the morph can call it from any render.
    const turnOn = () => {
        const direction = through.current;
        const engine = control.current;
        if (direction === null || !engine) {
            through.current = null;
            return;
        }
        const whenResting = (after: number, then: () => void) => {
            throughCall.current = gsap.delayedCall(after, () => {
                if (through.current === null) return;
                if (engine.resting()) then();
                else whenResting(1 / 30, then);
            });
        };
        whenResting(THROUGH_GAP, () => {
            if (direction > 0) engine.next();
            else engine.previous();
            whenResting(THROUGH_TURN, () => {
                throughCall.current = null;
                engine.hold(window.matchMedia(PHONE).matches ? LEAVE_PHONE : LEAVE);
                setCardOpen(true);
            });
        });
    };

    const letGo = useEffectEvent(settleSheet);
    const place = useEffectEvent(placeSheet);
    const putAway = useEffectEvent(closeCard);
    const shut = useEffectEvent(closeDialog);

    // The phone's sheet by hand. Dragged up it opens to nearly the whole
    // screen, stretching and springing back if pulled on past that; dragged
    // down from rest it puts the card away. All the way up, the story inside
    // scrolls as usual — a drag down from its very top, or up past its end,
    // moves the sheet instead, and the handle always does. So does a drag on
    // the photo above it: down takes the sheet down and, far enough, the card
    // away; up opens the sheet.
    useEffect(() => {
        const text = words.current;
        const page = panel.current;
        if (!text || !page || !phone || !cardOpen) return;
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
            const y = e.touches[0].clientY;
            const handle =
                e.target instanceof Element && (e.target.closest("[data-handle]") !== null || !text.contains(e.target));
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
                putAway();
                return;
            }
            letGo(top + d.v * 180 < (full + peek) / 2 ? "full" : "peek");
        };

        // The page holds the sheet as well, so one set of listeners takes both.
        page.addEventListener("touchstart", start, { passive: true });
        page.addEventListener("touchmove", move, { passive: false });
        page.addEventListener("touchend", end);
        page.addEventListener("touchcancel", end);
        return () => {
            page.removeEventListener("touchstart", start);
            page.removeEventListener("touchmove", move);
            page.removeEventListener("touchend", end);
            page.removeEventListener("touchcancel", end);
        };
    }, [phone, cardOpen]);

    // A card open as the window crosses `md`: each layout leaves its own
    // positions on the card — the phone's sheet, or nothing but the
    // stylesheet and the house lights from `md` — so the card is laid out
    // again, settled, for the one it is now in.
    const relayOut = useEffectEvent((nowPhone: boolean) => {
        const el = panel.current;
        const text = words.current;
        if (!cardOpen || !el || !text) return;
        // Caught mid-open, the morph is stopped where it is and the card set
        // out finished instead.
        const s = still.current?.state;
        const moving = [shade.current, barTop.current, barBottom.current].filter(
            (n): n is HTMLDivElement => n !== null
        );
        gsap.killTweensOf([sheetPos.current, text, el, ...moving, ...(s ? [s] : [])]);
        if (s) Object.assign(s, { on: 1, grow: 1, spread: 1, fill: 1, pane: 1, dark: nowPhone ? 0 : 1 });
        gsap.set(el, { autoAlpha: 1 });
        cardLive.current = true;
        if (nowPhone) {
            gsap.set(text, { autoAlpha: 1, x: 0 });
            sheetAt.current = "peek";
            sheetPos.current.top = sheetStops().peek;
            placeSheet();
        } else {
            gsap.set(text, { clearProps: "transform", autoAlpha: 1 });
            if (photoBox.current) gsap.set(photoBox.current, { clearProps: "height" });
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

        const tl =
            phase === "opening"
                ? spread("open", { page: el, inner, button: btn }, () => {
                      setRedirecting(false);
                      setPhase("open");
                  })
                : spread("close", { page: el, inner, button: btn }, () => {
                      through.current = null;
                      throughCall.current?.kill();
                      setCardOpen(false);
                      setActive(0);
                      setReelCard(null);
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
    // The arrow keys move the reel on — or, with a card open, go to the
    // stops either side, up and down left to scroll its story.
    const stepCard = useEffectEvent(shiftCard);
    useEffect(() => {
        if (phase !== "open") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (cardOpen) putAway();
                // Between two cards, going through the reel: it stops there.
                else if (through.current !== null) {
                    through.current = null;
                    throughCall.current?.kill();
                } else shut();
                return;
            }
            // Going through the reel, the keys wait for it.
            if (through.current !== null) return;
            const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
            const on = e.key === "ArrowRight" || e.key === "ArrowDown";
            if (!back && !on) return;
            if (cardOpen) {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") return;
                e.preventDefault();
                stepCard(on ? 1 : -1);
                return;
            }
            e.preventDefault();
            if (on) control.current?.next();
            else control.current?.previous();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, cardOpen]);

    // With a card open, a wheel tick or a trackpad swipe goes on to the stop
    // either side, as it turns the reel — unless the story under it has more
    // to scroll that way, which it scrolls first. Going through the reel the
    // wheel waits; with no card open it is the reel's own.
    useEffect(() => {
        const page = dialog.current;
        if (phase !== "open" || !page) return;
        let last = 0;
        let sum = 0;
        let done = false;
        const onWheel = (e: WheelEvent) => {
            const going = through.current !== null;
            if (!going && !cardLive.current) return;
            e.stopPropagation();
            const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            const story = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-scroll]") : null;
            const more =
                story !== null &&
                (d > 0 ? story.scrollTop + story.clientHeight < story.scrollHeight - 1 : story.scrollTop > 0);
            if (!going && more) return;
            e.preventDefault();
            if (going) return;
            const now = performance.now();
            if (now - last > WHEEL_GAP_MS) {
                sum = 0;
                done = false;
            }
            last = now;
            if (done) return;
            sum += d;
            if (Math.abs(sum) >= WHEEL_STEP) {
                done = true;
                stepCard(Math.sign(sum));
            }
        };
        page.addEventListener("wheel", onWheel, { capture: true, passive: false });
        return () => page.removeEventListener("wheel", onWheel, { capture: true });
    }, [phase]);

    // The open card comes out of the card it was opened from as a film still
    // behind glass — the very card clicked, its glass and all, the reel
    // leaving its own out. From `md`: first it comes forward on its own, as
    // itself — its own shape, its own crop, its own frame of glass, only
    // bigger, in the middle of the screen — and nothing else. Then it goes
    // over to the left, the story riding out beside it to its right, and only
    // behind the two of them does the rest come: the house lights down, the
    // bars in from the top and the bottom, and last the pane of glass across
    // the band between them, the same photo soft and dark behind it. Closing
    // runs it all straight back into the card. Interrupted either way, it
    // carries on from where it is.
    //
    // On a phone the photo comes out to its place under the header; then the
    // sheet rises from the foot of the screen over the rest. Closing drops
    // the sheet and folds the photo back.
    useIsomorphicLayoutEffect(() => {
        const el = panel.current;
        const text = words.current;
        const box = photoBox.current;
        const stage = row.current;
        const foot = bar.current;
        const lights = shade.current;
        const barUp = barTop.current;
        const barDown = barBottom.current;
        if (!el || !text || !box || !stage || !foot || !lights || !barUp || !barDown) return;
        const showing = Number(gsap.getProperty(el, "opacity")) > 0;
        if (!cardOpen && !showing) return;

        // The card as the reel draws it right now — it holds it there while
        // the card is open — in the screen's own pixels, for the photo to come
        // out of; and going back, the card at rest, not come forward under the
        // mouse, so it lands once — see the reel's `release`.
        const rowBox = stage.getBoundingClientRect();
        const drawn = control.current?.rect(!cardOpen) ?? {
            left: rowBox.width / 2,
            top: rowBox.height / 2,
            width: 0,
            height: 0,
            radius: 0,
        };
        still.current?.from({ ...drawn, left: rowBox.left + drawn.left, top: rowBox.top + drawn.top });
        // The reel leaves its own card out from the very frame the still
        // starts drawing it — both told here, in one go, so there is never a
        // frame with neither.
        if (cardOpen && still.current) control.current?.cover(true);
        // Without the still, a stand-in to tween to no effect.
        const s = still.current?.state ?? { on: 0, grow: 0, spread: 0, fill: 0, pane: 0, dark: 0 };
        const H = el.offsetHeight;
        const bars = [barUp, barDown];
        const onPhone = window.matchMedia(PHONE).matches;
        // From `md` the photo's box is the stylesheet's alone — not where a
        // phone's sheet last left it.
        if (!onPhone) gsap.set(box, { clearProps: "height" });
        // How far over the photo goes, from the middle of the band to its
        // place — and so how far right of that the story starts, beside it.
        const travel = (el.offsetWidth - box.offsetWidth) / 2 - box.offsetLeft;
        const tl = gsap.timeline();

        if (onPhone && cardOpen) {
            cardLive.current = false;
            if (!showing) {
                text.scrollTop = 0;
                Object.assign(s, { on: 1, grow: 0, spread: 1, fill: 0, pane: 0, dark: 0 });
                gsap.set(el, { autoAlpha: 1 });
                gsap.set(text, { autoAlpha: 1, x: 0 });
                gsap.set(foot, { yPercent: 0 });
                sheetPos.current.top = H;
                placeSheet();
            }
            sheetAt.current = "peek";
            // The photo out to fill the screen, the backdrop under it, then
            // the sheet up, the photo shrinking to fit above it — every move
            // easing in and settling softly.
            tl.to(s, { grow: 1, duration: 0.95, ease: "expo.inOut" }, 0.1)
                .to(s, { fill: 1, duration: 0.8, ease: "power2.inOut" }, 0.35)
                .to(
                    sheetPos.current,
                    { top: sheetStops().peek, duration: 1.1, ease: "power3.inOut", onUpdate: placeSheet },
                    0.85
                )
                .add(() => {
                    cardLive.current = true;
                    through.current = null;
                });
        } else if (onPhone) {
            cardLive.current = false;
            gsap.killTweensOf(sheetPos.current);
            // The sheet down off the screen — carried on at the speed it was
            // let go at, if it was pulled down, or eased away if not — and
            // then the photo folds back into the card.
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
            control.current?.release({ delay: fold, duration: 0.95, ease: "expo.inOut" });
            tl.to(sheetPos.current, { top: H, ...drop, onUpdate: placeSheet }, 0)
                .to(s, { fill: 0, duration: 0.7, ease: "power2.inOut" }, fold)
                .to(s, { grow: 0, duration: 0.95, ease: "expo.inOut" }, fold)
                .to(el, { autoAlpha: 0, duration: 0.12 }, fold + 1)
                .add(() => control.current?.cover(false), fold + 1.12)
                .set(s, { on: 0 }, fold + 1.12 + HANDOFF)
                .add(() => turnOn(), fold + 1.12 + HANDOFF);
        } else if (cardOpen) {
            cardLive.current = false;
            if (!showing) {
                text.scrollTop = 0;
                Object.assign(s, { on: 1, grow: 0, spread: 0, fill: 0, pane: 0, dark: 0 });
                gsap.set(el, { autoAlpha: 1 });
                gsap.set(text, { autoAlpha: 0, x: travel, y: 0 });
                gsap.set(lights, { autoAlpha: 0 });
                gsap.set(bars, { autoAlpha: 1 });
                gsap.set(barUp, { yPercent: -100 });
                gsap.set(barDown, { yPercent: 100 });
            }
            tl.timeScale(DESK_PACE);
            // Forward first, as itself, the other cards going round the reel
            // and away as it comes. Then over to the left, the story riding
            // out beside it, and the house lights going down as the bars
            // close in — the four together, on the one curve, as closing
            // runs them back; the pane last of all, behind the two of them.
            // Every move eases in and settles softly.
            const across = { duration: 1, ease: "expo.inOut" };
            tl.to(s, { grow: 1, duration: 0.7, ease: "power3.inOut" }, 0)
                .to(s, { spread: 1, ...across }, 0.7)
                .to(text, { x: 0, ...across }, 0.7)
                .to(text, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0.75)
                .to(lights, { autoAlpha: 1, ...across }, 0.7)
                .to(s, { dark: 1, ...across }, 0.7)
                .to(bars, { yPercent: 0, ...across }, 0.7)
                .to(s, { fill: 1, pane: 1, duration: 0.85, ease: "power2.inOut" }, 0.95)
                .add(() => {
                    cardLive.current = true;
                    through.current = null;
                });
        } else {
            // Wherever it got to, straight back from there: the pane and the
            // photo behind it first; then the story, fading, rides back in
            // beside the photo to the middle as the bars go and the house
            // lights come up; and then back down into the card it came out of
            // — the reel's own card again, glass and all — the other cards
            // and the reel's words and buttons coming back round it as it goes.
            cardLive.current = false;
            const back = { duration: 0.8, ease: "expo.inOut" };
            const place = { duration: PLACE_TIME, ease: "power3.inOut" };
            control.current?.release({
                delay: PLACE_AT / DESK_PACE,
                duration: PLACE_TIME / DESK_PACE,
                ease: place.ease,
            });
            tl.timeScale(DESK_PACE);
            tl.to(s, { fill: 0, pane: 0, duration: 0.5, ease: "power2.in" }, 0)
                .to(text, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 0)
                .to(text, { x: travel, ...back }, 0.05)
                .to(s, { spread: 0, ...back }, 0.05)
                .to(lights, { autoAlpha: 0, ...back }, 0.05)
                .to(s, { dark: 0, ...back }, 0.05)
                .to(barUp, { yPercent: -100, ...back }, 0.05)
                .to(barDown, { yPercent: 100, ...back }, 0.05)
                .to(s, { grow: 0, ...place }, PLACE_AT)
                .to(el, { autoAlpha: 0, duration: 0.15 }, 1.3)
                .add(() => control.current?.cover(false), 1.45)
                .set(s, { on: 0 }, 1.45 + HANDOFF)
                .add(() => turnOn(), 1.45 + HANDOFF);
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
                className={PAGE_BUTTON}
            >
                <PageButtonLabel label="View my experience" busy={redirecting} />
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
                        {/* The open card's measures from `md`, for the band
                            and the bars round it alike: the margin round its
                            photo — the story's padding too — and the band's
                            height, the photo's own, near five-eighths of the
                            screen's, and that margin above and below it. Never
                            so tall that the bars are shorter than the header,
                            nor, on a narrow screen, that the photo at the
                            card's shape would leave the story no room. */}
                        <div
                            ref={content}
                            className="relative flex h-full flex-col opacity-0 [--band:min(calc(62%_+_2_*_var(--m)),calc(100%_-_10rem),calc(65vw_+_0.75_*_var(--m)))] [--m:2.5rem] lg:[--m:3rem]"
                        >
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

                            {/* The open card as a film still behind glass,
                                over the whole screen — under the bars, the
                                header and the words, and drawing nothing
                                until a card opens. */}
                            <div className="pointer-events-none absolute inset-0 z-[16]">
                                <GlassStill
                                    srcs={STILLS}
                                    active={active}
                                    bandRef={panel}
                                    photoRef={photoBox}
                                    controlRef={still}
                                    onReady={setStillLive}
                                />
                            </div>
                            <div
                                ref={barTop}
                                aria-hidden="true"
                                className="pointer-events-none invisible absolute inset-x-0 top-0 z-[17] hidden h-[calc((100%_-_var(--band))_/_2)] bg-[linear-gradient(to_bottom,#000_55%,#08080b)] md:block"
                            />
                            <div
                                ref={barBottom}
                                className="pointer-events-none invisible absolute inset-x-0 bottom-0 z-[17] hidden h-[calc((100%_-_var(--band))_/_2)] items-center justify-center gap-4 bg-[linear-gradient(to_top,#000_55%,#08080b)] md:flex"
                            >
                                {/* Which stop this is, of how many — in the
                                    bar, as a film's reel number would be —
                                    with the way to the stops either side of
                                    it. */}
                                <button
                                    type="button"
                                    onClick={() => shiftCard(-1)}
                                    tabIndex={cardOpen ? 0 : -1}
                                    aria-label="Previous stop"
                                    className={BAR_ARROW}
                                >
                                    <Arrow way="up" />
                                </button>
                                <span
                                    data-reel
                                    aria-hidden="true"
                                    className="font-mono text-label tabular-nums tracking-[0.24em] text-white/60"
                                >
                                    {counter}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => shiftCard(1)}
                                    tabIndex={cardOpen ? 0 : -1}
                                    aria-label="Next stop"
                                    className={BAR_ARROW}
                                >
                                    <Arrow way="down" />
                                </button>
                            </div>

                            {/* The top row, one line on every screen, as on
                                the works' page: what this is, as the dock's
                                own icon for it, the X's twin across the row —
                                giving way, with a card open, to the way back
                                out of it, an arrow; the centred stop's dates
                                in the middle; and the way out. Over the reel, which
                                runs on up under it to the top of the screen.
                                With a card open it turns white — over its
                                black bar from `md`, and on a phone over the
                                card's photo, shadowed to read over any of
                                them, with a shade down from the top behind it
                                — see the photo. */}
                            <header
                                ref={header}
                                className={cn(
                                    "absolute inset-x-0 top-0 z-40 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 transition-colors duration-300 md:h-20 md:px-6",
                                    // back to black only once its bar has
                                    // started to lift off it
                                    cardOpen
                                        ? // from `md`, only once its bar is
                                          // most of the way in — see the morph
                                          "text-white delay-200 md:delay-[1050ms] max-md:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)] max-md:[&_svg]:drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
                                        : "delay-200 md:delay-500"
                                )}
                            >
                                {/* The title and the back arrow share a cell:
                                    whichever is gone lets the pointer through,
                                    and the arrow is drawn over the title — a
                                    title moved and faded out is still there to
                                    catch a click otherwise. */}
                                <div className="grid items-center justify-items-start">
                                    <h2
                                        id="experience-dialog-title"
                                        className={cn(
                                            "grid h-11 w-11 place-items-center transition-[opacity,transform] duration-300 [grid-area:1/1]",
                                            cardOpen && "pointer-events-none -translate-x-2 opacity-0"
                                        )}
                                    >
                                        <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                                        <span className="sr-only">Experience</span>
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={closeCard}
                                        tabIndex={cardOpen ? 0 : -1}
                                        aria-hidden={!cardOpen}
                                        aria-label="Back to all cards"
                                        className={cn(
                                            "relative grid h-11 w-11 place-items-center rounded-full transition-[background-color,opacity,transform] duration-300 [grid-area:1/1] hover:bg-current/10",
                                            !cardOpen && "pointer-events-none translate-x-2 opacity-0"
                                        )}
                                    >
                                        <Arrow way="left" />
                                    </button>
                                </div>

                                <div
                                    className={cn(
                                        "justify-self-center transition-colors duration-300",
                                        cardOpen
                                            ? "text-white/60 delay-200 md:delay-[1050ms]"
                                            : "text-black/55 delay-200 md:delay-500"
                                    )}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={active}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            // with a card open the whole screen
                                            // slides on with the new dates
                                            transition={{ duration: cardOpen ? 0 : 0.25 }}
                                            className={cn(
                                                MARK,
                                                "block whitespace-nowrap tracking-[0.12em] text-inherit sm:tracking-[0.2em]"
                                            )}
                                        >
                                            {stop.timeline}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>

                                <button
                                    ref={closeButton}
                                    type="button"
                                    onClick={closeDialog}
                                    aria-label="Close experience"
                                    className="grid h-11 w-11 place-items-center justify-self-end rounded-full transition-colors duration-300 hover:bg-current/10"
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

                            {/* The reel, from the top of the screen down to the
                                words — all the way down from `lg`, where the
                                words sit beside the centred card instead.
                                Mounted once the white has finished spreading,
                                so its own way in plays in full view. From
                                `lg`, the words and the buttons either side
                                are placed from where the centred card
                                actually is; nothing is laid over the card
                                itself. With a card open they go as the other
                                cards do — see `WORDS_AWAY`. */}
                            <div ref={row} className="relative min-h-0 flex-1">
                                {(phase === "open" || phase === "closing") && (
                                    <CurvedGlassCarousel
                                        items={ITEMS}
                                        label="My experience"
                                        vertical
                                        crop="center"
                                        aspect={CARD_ASPECT}
                                        controlRef={control}
                                        onActiveChange={setActive}
                                        onCardRect={setReelCard}
                                        onCardClick={openCard}
                                        onArrive={() => setArrived(true)}
                                        wheelTarget={dialog}
                                        className="absolute inset-0"
                                    />
                                )}

                                {/* Below `lg`, the reel fades into the white
                                    over its words rather than stopping dead at
                                    their edge. */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-white/0 md:h-24 lg:hidden"
                                />

                                {reelCard && (
                                    <>
                                        <div
                                            style={{
                                                left: Math.max(EDGE, reelCard.left - BESIDE - WORDS_WIDTH),
                                                top: reelCard.top + reelCard.height / 2,
                                                width: Math.min(WORDS_WIDTH, reelCard.left - BESIDE - EDGE),
                                            }}
                                            className={cn(
                                                "absolute z-10 hidden -translate-y-1/2 transition-[opacity,transform] lg:block",
                                                cardOpen ? cn(WORDS_AWAY, "-translate-x-10") : WORDS_BACK
                                            )}
                                        >
                                            <ReelWords active={active} arrived={arrived} onRead={openCard} />
                                        </div>
                                        <div
                                            style={{
                                                left: reelCard.left + reelCard.width + BESIDE,
                                                top: reelCard.top + reelCard.height / 2,
                                            }}
                                            className={cn(
                                                "absolute z-10 hidden -translate-y-1/2 flex-col gap-3 transition-[opacity,transform] lg:flex",
                                                cardOpen ? cn(WORDS_AWAY, "translate-x-10") : WORDS_BACK
                                            )}
                                        >
                                            {([-1, 1] as const).map((direction) => (
                                                <button
                                                    key={direction}
                                                    type="button"
                                                    onClick={() =>
                                                        direction < 0 ? control.current?.previous() : control.current?.next()
                                                    }
                                                    aria-label={direction < 0 ? "Previous stop" : "Next stop"}
                                                    className={cn(
                                                        GLASS_BUTTON,
                                                        "h-14 w-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(0,0,0,0.35)]"
                                                    )}
                                                >
                                                    <Arrow way={direction < 0 ? "up" : "down"} />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Below `lg`, the words go under the reel, centred
                                — and under them the arrows either side of how
                                far through, and under those what the stop
                                was, as on the works' page — going, with a
                                card open, as the cards under it do. */}
                            <div
                                className={cn(
                                    "relative shrink-0 px-6 pb-[max(2.25rem,env(safe-area-inset-bottom))] pt-5 text-center transition-[opacity,transform] md:pb-12 md:pt-8 lg:hidden",
                                    cardOpen ? cn(WORDS_AWAY, "translate-y-6") : WORDS_BACK
                                )}
                            >
                                <ReelWords active={active} arrived={arrived} onRead={openCard} />
                                <div className="mt-6 flex items-center justify-center gap-6 md:mt-7">
                                    {([-1, 1] as const).map((direction) => (
                                        <button
                                            key={direction}
                                            type="button"
                                            onClick={() => (direction < 0 ? control.current?.previous() : control.current?.next())}
                                            aria-label={direction < 0 ? "Previous stop" : "Next stop"}
                                            className={cn(
                                                GLASS_BUTTON,
                                                "h-11 w-11 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_-12px_rgba(0,0,0,0.35)]",
                                                direction > 0 && "order-last"
                                            )}
                                        >
                                            <Arrow way={direction < 0 ? "up" : "down"} />
                                        </button>
                                    ))}
                                    <span aria-hidden="true" className={cn(MARK, "tabular-nums")}>
                                        {counter}
                                    </span>
                                </div>
                                <div className="mt-5 flex h-4 items-center justify-center">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={active}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className={MARK}
                                        >
                                            {stop.label}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* From `lg`, the bottom corners: how far through,
                                and what the centred stop was. Under the house
                                lights, should a card be opened. */}
                            <span
                                aria-hidden="true"
                                className={cn(MARK, "absolute bottom-7 left-8 z-10 hidden tabular-nums lg:block")}
                            >
                                {counter}
                            </span>
                            <div className="absolute bottom-7 right-8 z-10 hidden lg:block">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={active}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className={cn(MARK, "block")}
                                    >
                                        {stop.label}
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            {/* The open card's words, on the pane of glass the
                                still draws behind them — see the still. It
                                comes out of the card it opens from with the
                                still's photo; see the morph above.

                                From `md` the page is the band across the
                                middle of the screen, edge to edge — see its
                                measures, above — and centred on it, so the
                                letterbox bars, the same height top and bottom,
                                meet it exactly. The glass is the whole of it:
                                the photo on its left, a card of its own at the
                                card's own shape with a margin all round it,
                                the story on its right, and the way to the
                                stops either side in the bar under it.

                                Below `md` it is a page over the whole screen
                                instead: the photo filling it, and the story on
                                a solid sheet that rises from the foot, the
                                photo shrinking to fit above it; see the morph
                                and the sheet above. The stops either side are
                                a tap away along the foot. Pulling the sheet
                                down, or going back, puts it away. */}
                            <article
                                ref={panel}
                                aria-hidden={!cardOpen}
                                className={cn(
                                    "invisible absolute z-30 overflow-hidden text-white opacity-0 max-md:fixed max-md:inset-0 md:inset-x-0 md:top-[calc((100%_-_var(--band))_/_2)] md:h-[var(--band)]",
                                    !stillLive && "bg-[#111111]",
                                    !cardOpen && "pointer-events-none"
                                )}
                            >
                                {/* Shade down from the top on a phone, for the
                                    header over the photo. */}
                                <div
                                    aria-hidden="true"
                                    className={cn(
                                        "pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 md:hidden",
                                        cardOpen ? "opacity-100 delay-200" : "opacity-0"
                                    )}
                                />
                                <div ref={inner} className="absolute inset-0 md:[container-type:size]">
                                    {/* The photo's place. On a phone, the
                                        whole screen, down to the sheet's top
                                        as the sheet sets it — see the sheet.
                                        From `md`, a card of its own at the
                                        card's own shape, the band's height
                                        less the margin round it, on the left.
                                        The page's copy of it — unseen where
                                        the still draws it, standing in for
                                        it where WebGL cannot be had. */}
                                    <div
                                        ref={photoBox}
                                        className={cn(
                                            "absolute inset-x-0 top-0 h-full overflow-hidden md:inset-x-auto md:left-[var(--m)] md:top-[var(--m)] md:aspect-[4/5] md:h-[calc(100%_-_2_*_var(--m))] md:rounded-2xl",
                                            stillLive && "invisible"
                                        )}
                                    >
                                        {!stillLive && stop.image && (
                                            <Image src={stop.image} alt="" fill unoptimized className="object-cover" />
                                        )}
                                    </div>

                                    {/* On a phone, the sheet: solid, as tall
                                        as the screen under the header, moved
                                        up and down by the sheet above, and
                                        scrolling its story once it is all the
                                        way up. From `md`, the column beside
                                        the photo, on the glass. */}
                                    <div
                                        ref={words}
                                        data-scroll
                                        data-lenis-prevent
                                        className="absolute inset-x-0 top-0 z-20 h-[calc(100%-4rem)] touch-pan-y overflow-y-auto overscroll-contain rounded-t-[1.25rem] bg-[#111111] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2 max-md:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_-18px_36px_-16px_rgba(0,0,0,0.7)] md:bottom-0 md:left-[calc(var(--m)_+_(100cqh_-_2_*_var(--m))_*_0.8)] md:flex md:h-auto md:flex-col md:overflow-y-visible md:rounded-none md:bg-transparent md:p-[var(--m)] lg:px-[calc(var(--m)_*_2)]"
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
                                            pane is tall, it scrolls inside it
                                            rather than spilling off. `min-h-full`
                                            on the inner block keeps it centred
                                            when it fits and scrollable from the
                                            top when it does not.
                                            `data-lenis-prevent` lets the wheel
                                            through: the page behind is held
                                            still, and Lenis would otherwise
                                            swallow it here too.

                                            From `lg`, where the column beside
                                            the photo is wide, the story runs
                                            the column's width rather than a
                                            reading measure. Phones and tablets
                                            keep their own. */}
                                        <div
                                            data-scroll
                                            data-lenis-prevent
                                            className="mt-6 flex-1 touch-pan-y md:mt-4 md:min-h-0 md:overflow-y-auto md:overscroll-contain lg:mt-6"
                                        >
                                            <div className="flex min-h-full flex-col md:justify-center">
                                                <h3 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] md:text-4xl lg:text-5xl">
                                                    {stop.title}
                                                </h3>
                                                <p className="mt-4 max-w-prose text-base leading-relaxed text-white/85 lg:mt-6 lg:max-w-none lg:text-lg">
                                                    {stop.story}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>

                            {/* The stops either side, along the foot of a
                                phone's page, without going back out to the
                                reel by hand. Starts off below the screen; the
                                sheet brings it up with it. */}
                            <nav
                                ref={bar}
                                aria-label="Other stops"
                                aria-hidden={!cardOpen}
                                className={cn(
                                    "fixed inset-x-0 bottom-0 z-[31] flex items-center justify-between gap-3 bg-[#111111] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white [transform:translateY(100vh)] md:hidden",
                                    !cardOpen && "pointer-events-none"
                                )}
                            >
                                <div aria-hidden="true" className="glass-edge pointer-events-none absolute inset-x-0 top-0" />
                                <button
                                    type="button"
                                    onClick={() => shiftCard(-1)}
                                    tabIndex={cardOpen ? 0 : -1}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-white/80 active:bg-white/10"
                                >
                                    <span aria-hidden="true">↑</span> Previous
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
                                    Next <span aria-hidden="true">↓</span>
                                </button>
                            </nav>
                        </div>

                        {/* The reel is a picture to a screen reader; the
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
