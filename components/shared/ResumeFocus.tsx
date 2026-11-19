"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { gsap, motionEnabled } from "@/lib/motion";
import { drawPage, pageAspect, pdfPage } from "@/lib/pdf";
import { cn } from "@/lib/utils";

/* How far in it goes, as a multiple of the page fitted to the screen; how
   much a button press or a double tap takes it; the room kept round the
   fitted page, and below it for the controls; and how far past its edges a
   page larger than the screen may be moved. */
const MAX = 5;
const STEP = 1.6;
const TAP_ZOOM = 2.5;
const PAD = 20;
const FOOT = 72;
const EDGE = 24;
/* The corner of the page on screen, whatever its scale — the dialog's own. */
const RADIUS = 14;

type View = { s: number; x: number; y: number };
type Point = { x: number; y: number };

/* Past the edge, a drag moves it less and less. */
function give(v: number, limit: number) {
    const over = Math.abs(v) - limit;
    if (over <= 0) return v;
    return Math.sign(v) * (limit + (over * 120) / (120 + over));
}

/* Scaled by `k` about `p` (from the middle of the screen), so whatever is
   under that point stays under it — a little past the limits while a hand
   is on it, to be brought back when it lets go. */
function zoomAbout(from: View, p: Point, k: number): View {
    const s = Math.min(MAX * 1.15, Math.max(0.85, from.s * k));
    const f = s / from.s;
    return { s, x: p.x - (p.x - from.x) * f, y: p.y - (p.y - from.y) * f };
}

/**
 * The resume and nothing else, over the whole screen, to be read up close.
 *
 * The page starts fitted to the screen. Zoomed with a pinch, the wheel, a
 * double tap or click, or the buttons along the foot (and +, − and 0); moved
 * with a drag or the arrow keys. Pulled past its edges it gives, and springs
 * back when let go. The X or Escape puts it away — and going back, which the
 * button that opens it listens for: it is there for as long as this is, and
 * this, mounted with it already open, would hear its own history entry taken
 * back off by a development build's double mount and close at once.
 *
 * Drawn once, large — sharp to well past twice the size it fits at on any
 * screen — and zoomed as a picture from there, so nothing has to redraw
 * under a finger.
 */
export default function ResumeFocus({
    url,
    title,
    from,
    onClose,
}: {
    url: string;
    title: string;
    /** The page in the dialog — the one this comes forward out of. */
    from?: React.RefObject<HTMLElement | null>;
    onClose: () => void;
}) {
    const root = useRef<HTMLDivElement>(null);
    const shade = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const still = useRef<HTMLCanvasElement>(null);
    const readout = useRef<HTMLSpanElement>(null);
    const closer = useRef<HTMLButtonElement>(null);
    const view = useRef<View>({ s: 1, x: 0, y: 0 });
    const fit = useRef({ w: 0, h: 0 });
    const aspect = useRef(595 / 842);
    const leaving = useRef(false);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    // Where the page is, written out.
    const apply = () => {
        const el = stage.current;
        if (!el) return;
        const { s, x, y } = view.current;
        gsap.set(el, { x, y, scale: s, xPercent: -50, yPercent: -50, borderRadius: RADIUS / s });
        if (readout.current) readout.current.textContent = `${Math.round(s * 100)}%`;
    };

    // How far the page may be moved each way at a scale: none while it fits
    // the screen that way, and to just past its edge when it is larger.
    const reach = (s: number): Point => {
        const r = root.current;
        if (!r) return { x: 0, y: 0 };
        return {
            x: Math.max(0, (fit.current.w * s - r.clientWidth) / 2 + EDGE),
            y: Math.max(0, (fit.current.h * s - r.clientHeight) / 2 + EDGE),
        };
    };
    const settled = (v: View): View => {
        const s = Math.min(MAX, Math.max(1, v.s));
        const r = reach(s);
        return { s, x: Math.max(-r.x, Math.min(r.x, v.x)), y: Math.max(-r.y, Math.min(r.y, v.y)) };
    };
    const goTo = (to: View, duration = 0.45) => {
        gsap.to(view.current, { ...settled(to), duration, ease: "power3.out", onUpdate: apply, overwrite: true });
    };
    const zoomBy = (k: number) => goTo(zoomAbout(view.current, { x: 0, y: 0 }, k));
    const fitPage = () => goTo({ s: 1, x: 0, y: 0 });
    const centre = (e: { clientX: number; clientY: number }): Point => {
        const r = root.current!.getBoundingClientRect();
        return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
    };

    // The dialog's page: its box (what holds the page, inside its frame), and
    // where the page here would have to be to lie exactly over it.
    const source = () => from?.current?.parentElement ?? null;
    const over = (el: HTMLElement): View | null => {
        const r = root.current?.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        if (!r || !b.width || !fit.current.w) return null;
        return {
            s: b.width / fit.current.w,
            x: b.left + b.width / 2 - (r.left + r.width / 2),
            y: b.top + b.height / 2 - (r.top + r.height / 2),
        };
    };
    const chrome = () => root.current?.querySelectorAll("[data-chrome]") ?? [];

    // Out: the page goes back into its place in the dialog, the shade and
    // the controls going with it, and the dialog's own page is shown again
    // only once this one is lying on it.
    const leave = () => {
        if (leaving.current) return;
        leaving.current = true;
        const el = root.current;
        const back = source();
        if (!el || !motionEnabled()) return onClose();
        const to = back && over(back);
        gsap.killTweensOf(view.current);
        const done = () => {
            if (back) gsap.set(back, { clearProps: "visibility" });
            onClose();
        };
        if (!to) {
            gsap.to(el, { autoAlpha: 0, duration: 0.25, ease: "power2.in", onComplete: done });
            return;
        }
        gsap.timeline({ onComplete: done })
            .to(chrome(), { autoAlpha: 0, duration: 0.15, ease: "power2.in" }, 0)
            .to(view.current, { ...to, duration: 0.5, ease: "power3.inOut", onUpdate: apply }, 0)
            .to(shade.current, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.1);
    };

    // The fitted size, for the screen as it is.
    const measure = useEffectEvent(() => {
        const r = root.current;
        if (!r) return;
        const w = Math.min(r.clientWidth - PAD * 2, (r.clientHeight - PAD * 2 - FOOT) * aspect.current);
        fit.current = { w, h: w / aspect.current };
        gsap.set(stage.current, { width: fit.current.w, height: fit.current.h });
        view.current = settled(view.current);
        apply();
    });
    useEffect(() => {
        const onResize = () => measure();
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // The page, drawn once, large.
    const shaped = useEffectEvent((ratio: number) => {
        if (Math.abs(ratio - aspect.current) < 1e-3) return;
        aspect.current = ratio;
        measure();
    });
    useEffect(() => {
        let task: ReturnType<typeof drawPage> | null = null;
        let gone = false;
        pdfPage(url)
            .then((page) => {
                if (gone || !canvas.current) return;
                shaped(pageAspect(page));
                task = drawPage(page, canvas.current, 2600);
                return task.promise.then(() => {
                    if (!gone) setReady(true);
                });
            })
            .catch((error: unknown) => {
                if (gone || (error as { name?: string })?.name === "RenderingCancelledException") return;
                setFailed(true);
            });
        return () => {
            gone = true;
            task?.cancel();
        };
    }, [url]);

    // In: the dialog's page itself comes forward — this one starts lying
    // exactly over it, showing what it already shows, and the dialog's is
    // hidden under it, so there is only ever the one page. The shade and the
    // controls follow it in. Focus to the X.
    const arrive = useEffectEvent(() => {
        closer.current?.focus();
        const el = root.current;
        if (!el) return;
        const back = source();
        const drawn = back?.querySelector("canvas");
        const c = still.current;
        if (drawn && c && drawn.width) {
            c.width = drawn.width;
            c.height = drawn.height;
            c.getContext("2d")?.drawImage(drawn, 0, 0);
        }
        if (back) gsap.set(back, { visibility: "hidden" });
        gsap.set(el, { autoAlpha: 1 });
        const start = back && over(back);
        if (!motionEnabled()) return;
        const tl = gsap.timeline();
        if (start) {
            Object.assign(view.current, start);
            apply();
            tl.to(view.current, { s: 1, x: 0, y: 0, duration: 0.65, ease: "power3.inOut", onUpdate: apply }, 0);
        } else {
            tl.fromTo(view.current, { s: 0.9 }, { s: 1, duration: 0.6, ease: "expo.out", onUpdate: apply }, 0.05);
        }
        return tl
            .fromTo(shade.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0.1)
            .fromTo(chrome(), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0.45);
    });
    useEffect(() => {
        const tl = arrive();
        const back = from?.current?.parentElement;
        return () => {
            tl?.kill();
            // However this goes — its X, or going back, which takes it away
            // at once — the dialog keeps its page.
            if (back) gsap.set(back, { clearProps: "visibility" });
        };
    }, [from]);

    // Hands: a drag moves it, two fingers pinch it, a double tap or click
    // zooms in on the spot or back out to fit; the wheel zooms about the
    // pointer. Listened for directly, as the wheel has to be kept from the
    // page under it.
    const hands = useEffectEvent(() => {
        const el = root.current;
        if (!el) return;
        const points = new Map<number, Point>();
        let pinch: { d: number; mid: Point } | null = null;
        /* where a drag has taken the page before any give at the edges */
        let raw: Point | null = null;
        let travelled = 0;
        let lastTap = { t: 0, x: 0, y: 0 };
        let settle = 0;

        const onDown = (e: PointerEvent) => {
            if (e.target instanceof Element && e.target.closest("button, a")) return;
            el.setPointerCapture(e.pointerId);
            gsap.killTweensOf(view.current);
            points.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (points.size === 1) travelled = 0;
            pinch = null;
            raw = null;
        };
        const onMove = (e: PointerEvent) => {
            const was = points.get(e.pointerId);
            if (!was) return;
            const now = { x: e.clientX, y: e.clientY };
            points.set(e.pointerId, now);
            const v = view.current;
            if (points.size === 1) {
                travelled += Math.hypot(now.x - was.x, now.y - was.y);
                raw ??= { x: v.x, y: v.y };
                raw = { x: raw.x + now.x - was.x, y: raw.y + now.y - was.y };
                const r = reach(v.s);
                v.x = give(raw.x, r.x);
                v.y = give(raw.y, r.y);
            } else if (points.size === 2) {
                const [a, b] = [...points.values()];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                const mid = centre({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
                if (pinch) {
                    Object.assign(v, zoomAbout(v, mid, d / pinch.d));
                    v.x += mid.x - pinch.mid.x;
                    v.y += mid.y - pinch.mid.y;
                }
                pinch = { d, mid };
                raw = null;
                travelled = Infinity;
            }
            apply();
        };
        const onUp = (e: PointerEvent) => {
            if (!points.delete(e.pointerId)) return;
            pinch = null;
            raw = null;
            if (points.size) return;
            if (travelled < 8) {
                const t = e.timeStamp;
                if (t - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
                    lastTap = { t: 0, x: 0, y: 0 };
                    const v = view.current;
                    goTo(v.s > 1.05 ? { s: 1, x: 0, y: 0 } : zoomAbout(v, centre(e), TAP_ZOOM / v.s));
                    return;
                }
                lastTap = { t, x: e.clientX, y: e.clientY };
            }
            goTo(view.current);
        };
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            gsap.killTweensOf(view.current);
            // A trackpad's pinch comes as a wheel with Ctrl held, in much
            // smaller steps than a mouse wheel's.
            const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
            Object.assign(view.current, zoomAbout(view.current, centre(e), k));
            apply();
            window.clearTimeout(settle);
            settle = window.setTimeout(() => goTo(view.current, 0.35), 140);
        };

        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            window.clearTimeout(settle);
            el.removeEventListener("pointerdown", onDown);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerup", onUp);
            el.removeEventListener("pointercancel", onUp);
            el.removeEventListener("wheel", onWheel);
        };
    });
    useEffect(() => hands(), []);

    // Keys — caught ahead of the dialog under it, which would take Escape
    // for itself and close as well.
    const onKey = useEffectEvent((e: KeyboardEvent) => {
        const v = view.current;
        const nudge = (x: number, y: number) => goTo({ ...v, x: v.x + x, y: v.y + y }, 0.25);
        const keys: Record<string, () => void> = {
            Escape: leave,
            "+": () => zoomBy(STEP),
            "=": () => zoomBy(STEP),
            "-": () => zoomBy(1 / STEP),
            "0": fitPage,
            ArrowLeft: () => nudge(80, 0),
            ArrowRight: () => nudge(-80, 0),
            ArrowUp: () => nudge(0, 80),
            ArrowDown: () => nudge(0, -80),
        };
        const act = keys[e.key];
        if (!act) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        act();
    });
    useEffect(() => {
        const handler = (e: KeyboardEvent) => onKey(e);
        window.addEventListener("keydown", handler, true);
        return () => window.removeEventListener("keydown", handler, true);
    }, []);

    const tool =
        "grid h-11 w-11 place-items-center rounded-full text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white";

    return createPortal(
        <div
            ref={root}
            role="dialog"
            aria-modal="true"
            aria-label={`${title}, up close`}
            className="invisible fixed inset-0 z-[140] cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
        >
            <div ref={shade} aria-hidden="true" className="absolute inset-0 bg-black/95" />

            {/* The page wears the rim it wore in the dialog's glass frame, so
                the two are the same thing at the hand-off. */}
            <div
                ref={stage}
                className="absolute left-1/2 top-1/2 overflow-hidden bg-white shadow-[-1.5px_0_0_rgba(0,157,255,0.55),1.5px_0_0_rgba(255,64,160,0.45),0_0_0_1px_rgba(255,255,255,0.1),0_20px_60px_-15px_rgba(0,0,0,0.9)]"
            >
                {!ready && !failed && (
                    <span className="absolute inset-0 grid place-items-center">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/15 border-t-black/60" />
                    </span>
                )}
                {/* The dialog's drawing of the page, shown until the large one
                    is ready over it. */}
                <canvas ref={still} aria-hidden="true" className="absolute inset-0 h-full w-full" />
                <canvas
                    ref={canvas}
                    role="img"
                    aria-label={title}
                    className={cn("relative h-full w-full transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
                />
                {failed && (
                    <div className="absolute inset-0 grid place-items-center bg-white text-[#111111]">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener"
                            className="font-mono text-label uppercase underline underline-offset-4"
                        >
                            Open it in a new tab
                        </a>
                    </div>
                )}
            </div>

            <button
                ref={closer}
                data-chrome=""
                type="button"
                onClick={leave}
                aria-label="Close up-close view"
                className={cn(tool, "absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] bg-black/40")}
            >
                <X size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>

            <div
                data-chrome=""
                className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2">
                <div className="pointer-events-auto flex cursor-default items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1 backdrop-blur-md">
                    <button type="button" onClick={() => zoomBy(1 / STEP)} aria-label="Zoom out" className={tool}>
                        <ZoomOut size={18} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                    <span
                        ref={readout}
                        aria-hidden="true"
                        className="w-14 text-center font-mono text-label tabular-nums text-white/70"
                    >
                        100%
                    </span>
                    <button type="button" onClick={() => zoomBy(STEP)} aria-label="Zoom in" className={tool}>
                        <ZoomIn size={18} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                    <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/15" />
                    <button type="button" onClick={fitPage} aria-label="Fit to screen" className={tool}>
                        <Maximize2 size={17} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                </div>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-white/40">
                    <span className="[@media(hover:hover)]:hidden">Pinch or double-tap to zoom · drag to move</span>
                    <span className="hidden [@media(hover:hover)]:inline">
                        Scroll or double-click to zoom · drag to move
                    </span>
                </p>
            </div>
        </div>,
        document.body
    );
}
