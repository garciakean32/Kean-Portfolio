"use client";

import { useEffect, useRef, useState } from "react";
import { RevealBlock } from "@/components/motion/Reveal";
import Sketch from "@/components/shared/Sketch";
import { PEN } from "@/components/shared/Thread";
import { loopArrow } from "@/components/shared/doodles";
import { motionEnabled } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* The video's frame, strung on the thread: the thread comes down from under
   the masthead and is taped to the middle of the frame's top, and carries on
   from behind the middle of its foot down to the section's bottom edge,
   where the contact section's stretch picks it up.

   The frame can be pulled about by its tape. Both stretches of thread are
   rope — a chain of links with weight to them — so they bend and whip as it
   moves, and when it is let go it springs home, swinging and tilting until
   it settles. The rope is always a little short for the gap it spans, so it
   is always taut: the frame hangs from it rather than the thread lying slack
   on the tape, and the stretch below never sags out past the section's
   foot, where it would be cut off. A scroll gives the frame a small knock
   too, so it sways as the page goes by. With motion off it just hangs
   there, and the tape is only tape. */

type Pt = { x: number; y: number };
type Rope = { p: Pt[]; q: Pt[] };

/* Links in each stretch of rope. */
const LINKS = 24;
/* Each frame: how far a link falls, in pixels per frame squared; how much of
   its speed it keeps; and how many passes are made at keeping the links
   their length — enough that a taut rope runs true right to its ends. */
const GRAVITY = 0.45;
const KEEP = 0.985;
const PASSES = 10;
/* How long the rope is for the gap between where it is tied: a touch short,
   so it is always pulled taut. */
const TAUT = 0.97;
/* The frame's spring home and its damping — about a swing a second, dying
   away over a few — and its tilt's, which follows how fast it is going
   sideways: the tape leads and the foot drags behind. */
const HOME = 55;
const DAMP = 3.2;
const TILT_HOME = 70;
const TILT_DAMP = 6;
const TILT = 0.012;
const MAX_TILT = 12;
/* The fastest it can be thrown, in pixels per second — a flick sends it no
   further than a swing's worth. */
const THROW = 900;
/* How far it can be pulled, as a share of the smaller side of the screen —
   further than that the pull gives less and less. */
const REACH = 0.35;
/* How hard a scroll knocks it, in pixels a second for every pixel
   scrolled, and the most one knock can be. */
const KNOCK = 0.8;
const MAX_KNOCK = 140;

/* The tape's torn ends. */
const TORN =
    "[clip-path:polygon(0_10%,5%_0,95%_6%,100%_16%,96%_32%,100%_50%,96%_68%,100%_86%,95%_100%,4%_94%,0_80%,4%_62%,0_44%,4%_26%)]";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* The hint's arrow: thrown down and to the left from the word, onto the
   tape's end. */
const HINT = loopArrow([56, 0], [0, 30]);

function straight(a: Pt, b: Pt): Rope {
    const p = Array.from({ length: LINKS + 1 }, (_, i) => ({
        x: a.x + ((b.x - a.x) * i) / LINKS,
        y: a.y + ((b.y - a.y) * i) / LINKS,
    }));
    return { p, q: p.map((pt) => ({ ...pt })) };
}

/* One frame of rope: every link carries on as it was going and falls a
   little, the two ends are held where they are tied, and the links are
   pulled back to their length — a share of the gap as it is now, so however
   near or far the ends, the rope is taut. Returns how far the furthest link
   moved. */
function stepRope(r: Rope, a: Pt, b: Pt) {
    const link = (Math.hypot(b.x - a.x, b.y - a.y) * TAUT) / LINKS;
    let moved = 0;
    for (let i = 1; i < LINKS; i++) {
        const p = r.p[i];
        const q = r.q[i];
        const vx = (p.x - q.x) * KEEP;
        const vy = (p.y - q.y) * KEEP;
        q.x = p.x;
        q.y = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
        moved = Math.max(moved, Math.abs(vx) + Math.abs(vy));
    }
    for (let k = 0; k < PASSES; k++) {
        r.p[0].x = a.x;
        r.p[0].y = a.y;
        r.p[LINKS].x = b.x;
        r.p[LINKS].y = b.y;
        for (let i = 0; i < LINKS; i++) {
            const u = r.p[i];
            const v = r.p[i + 1];
            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const d = Math.hypot(dx, dy) || 1;
            const off = (d - link) / d / 2;
            if (i > 0) {
                u.x += dx * off;
                u.y += dy * off;
            }
            if (i + 1 < LINKS) {
                v.x -= dx * off;
                v.y -= dy * off;
            }
        }
    }
    return moved;
}

/* The rope as a smooth line through its links, and how long that is. */
function ropePath(r: Rope) {
    const p = r.p;
    let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
    let len = 0;
    for (let i = 1; i < p.length; i++) {
        len += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
        if (i < p.length - 1) {
            const mx = (p[i].x + p[i + 1].x) / 2;
            const my = (p[i].y + p[i + 1].y) / 2;
            d += ` Q${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
        } else d += ` L${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)}`;
    }
    return { d, len };
}

type World = {
    /* where the thread is tied above and below, the frame's middle at rest,
       half its height, and the rest of each stretch's span down the page —
       which is what the pen draws it by */
    above: Pt;
    below: Pt;
    mid: Pt;
    half: number;
    upper: Rope;
    lower: Rope;
};

/**
 * `section` is the section the thread runs down, `head` what it comes out
 * from under; the frame itself is `children`, `around` anything set down on
 * the page round it that stays put while it swings, and `className` sizes
 * the room it hangs in.
 */
export default function HangingFrame({
    section,
    head,
    className,
    around,
    children,
}: {
    section: React.RefObject<HTMLElement | null>;
    head: React.RefObject<HTMLElement | null>;
    className?: string;
    around?: React.ReactNode;
    children: React.ReactNode;
}) {
    const svg = useRef<SVGSVGElement>(null);
    const slot = useRef<HTMLDivElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const upper = useRef<SVGPathElement>(null);
    const lower = useRef<SVGPathElement>(null);
    const world = useRef<World | null>(null);
    const [size, setSize] = useState<{ w: number; h: number } | null>(null);
    // whether it has been pulled yet this visit — the hint goes once it has
    const [pulled, setPulled] = useState(false);

    // the frame: how far it is off its rest and how fast it is going, its
    // tilt, and the hand on it if there is one
    const s = useRef({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        a: 0,
        va: 0,
        hand: null as null | { px: number; py: number; ox: number; oy: number; t: number },
    });
    const wake = useRef<() => void>(() => {});
    // the furthest down the page the pen has been, in the section's pixels
    const reach = useRef(-Infinity);

    // After the commit rather than in it: the section is this frame's
    // ancestor, and its ref is only set once everything inside it is in.
    useEffect(() => {
        const box = section.current;
        const room = slot.current;
        const over = head.current;
        if (!box || !room || !over) return;
        const measure = () => {
            const o = box.getBoundingClientRect();
            const r = room.getBoundingClientRect();
            const t = over.getBoundingClientRect();
            const mid = { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height / 2 };
            const half = r.height / 2;
            const above = { x: o.width / 2, y: t.bottom - o.top + 32 };
            const below = { x: o.width / 2, y: o.height + 2 };
            world.current = {
                above,
                below,
                mid,
                half,
                upper: straight(above, { x: mid.x, y: mid.y - half }),
                lower: straight({ x: mid.x, y: mid.y + half }, below),
            };
            setSize({ w: Math.round(o.width), h: Math.round(o.height) });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        return () => observer.disconnect();
    }, [section, head]);

    useEffect(() => {
        const el = svg.current;
        if (!el || !size) return;
        const moving = motionEnabled();
        let raf = 0;
        let then = 0;
        let spare = 0;

        // The thread drawn as far as the pen has got down the page — the way
        // the rest of it is, and like the rest of it never undrawn — by where
        // each stretch hangs at rest.
        const ink = (path: SVGPathElement | null, rope: Rope, from: number, to: number) => {
            if (!path) return;
            const { d, len } = ropePath(rope);
            path.setAttribute("d", d);
            const k = moving ? clamp((reach.current - from) / Math.max(1, to - from), 0, 1) : 1;
            path.style.strokeDasharray = `${len} ${len}`;
            path.style.strokeDashoffset = String(len * (1 - k));
            path.style.visibility = k * len > 0.5 ? "visible" : "hidden";
        };
        const paint = () => {
            const w = world.current;
            if (!w) return;
            reach.current = Math.max(reach.current, window.innerHeight * PEN - el.getBoundingClientRect().top);
            const f = s.current;
            if (body.current) body.current.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.a}deg)`;
            ink(upper.current, w.upper, w.above.y, w.mid.y - w.half);
            ink(lower.current, w.lower, w.mid.y + w.half, w.below.y);
        };

        // One sixtieth of a second of it, whatever the screen's own rate.
        // Returns whether anything is still moving.
        const step = (w: World) => {
            const f = s.current;
            const dt = 1 / 60;
            if (!f.hand) {
                f.vx += (-HOME * f.x - DAMP * f.vx) * dt;
                f.vy += (-HOME * f.y - DAMP * f.vy) * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
            }
            const lean = clamp(f.vx * TILT, -MAX_TILT, MAX_TILT);
            f.va += (-TILT_HOME * (f.a - lean) - TILT_DAMP * f.va) * dt;
            f.a = clamp(f.a + f.va * dt, -MAX_TILT * 1.5, MAX_TILT * 1.5);

            // where the thread is tied on: the middle of the top and of the
            // foot, turned with the frame
            const rad = (f.a * Math.PI) / 180;
            const sin = Math.sin(rad) * w.half;
            const cos = Math.cos(rad) * w.half;
            const cx = w.mid.x + f.x;
            const cy = w.mid.y + f.y;
            const ropes = Math.max(
                stepRope(w.upper, w.above, { x: cx + sin, y: cy - cos }),
                stepRope(w.lower, { x: cx - sin, y: cy + cos }, w.below)
            );
            return (
                !!f.hand ||
                Math.abs(f.x) > 0.05 ||
                Math.abs(f.y) > 0.05 ||
                Math.abs(f.vx) > 0.5 ||
                Math.abs(f.vy) > 0.5 ||
                Math.abs(f.a) > 0.02 ||
                Math.abs(f.va) > 0.05 ||
                ropes > 0.02
            );
        };

        const tick = (now: number) => {
            const w = world.current;
            if (!w) return;
            spare += Math.min(0.1, then ? (now - then) / 1000 : 1 / 60);
            then = now;
            let live = true;
            for (; spare >= 1 / 60; spare -= 1 / 60) live = step(w);
            if (!live) {
                // settled: put it back exactly at rest, ropes hanging true
                Object.assign(s.current, { x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0 });
                w.upper = straight(w.above, { x: w.mid.x, y: w.mid.y - w.half });
                w.lower = straight({ x: w.mid.x, y: w.mid.y + w.half }, w.below);
                paint();
                raf = 0;
                then = 0;
                spare = 0;
                return;
            }
            paint();
            raf = requestAnimationFrame(tick);
        };
        wake.current = () => {
            if (moving && !raf) raf = requestAnimationFrame(tick);
        };

        let last = window.scrollY;
        const onScroll = () => {
            const dy = window.scrollY - last;
            last = window.scrollY;
            const r = el.getBoundingClientRect();
            const onScreen = r.bottom > 0 && r.top < window.innerHeight;
            if (moving && onScreen) {
                // the page lurches and the frame, hanging, lags behind it
                s.current.vy += clamp(dy * KNOCK, -MAX_KNOCK, MAX_KNOCK);
                wake.current();
            }
            // Off screen there is nothing to see, unless the pen still has
            // thread to draw on the way past.
            const w = world.current;
            const pen = window.innerHeight * PEN - r.top;
            if (onScreen || (w && pen > reach.current && reach.current < w.below.y)) paint();
        };

        paint();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(raf);
            raf = 0;
            wake.current = () => {};
        };
    }, [size]);

    // Pulled by the tape: the frame follows the hand, giving less the
    // further it goes, and keeps the speed it had when it is let go.
    const grab = (e: React.PointerEvent<HTMLSpanElement>) => {
        if (!motionEnabled() || e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const f = s.current;
        f.hand = { px: e.clientX, py: e.clientY, ox: f.x, oy: f.y, t: performance.now() };
        setPulled(true);
        wake.current();
    };
    const pull = (e: React.PointerEvent<HTMLSpanElement>) => {
        const f = s.current;
        const h = f.hand;
        if (!h) return;
        const reach = Math.min(window.innerWidth, window.innerHeight) * REACH;
        const dx = h.ox + e.clientX - h.px;
        const dy = h.oy + e.clientY - h.py;
        const r = Math.hypot(dx, dy);
        const give = r > 0 ? (reach * Math.tanh(r / reach)) / r : 1;
        const now = performance.now();
        const dt = Math.max(1, now - h.t) / 1000;
        const x = dx * give;
        const y = dy * give;
        f.vx = f.vx * 0.5 + ((x - f.x) / dt) * 0.5;
        f.vy = f.vy * 0.5 + ((y - f.y) / dt) * 0.5;
        f.x = x;
        f.y = y;
        h.t = now;
        wake.current();
    };
    const drop = () => {
        const f = s.current;
        if (!f.hand) return;
        f.hand = null;
        const v = Math.hypot(f.vx, f.vy);
        if (v > THROW) {
            f.vx *= THROW / v;
            f.vy *= THROW / v;
        }
        wake.current();
    };

    return (
        <>
            {size && (
                <svg
                    ref={svg}
                    aria-hidden="true"
                    width={size.w}
                    height={size.h}
                    viewBox={`0 0 ${size.w} ${size.h}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute left-0 top-0 text-ink"
                >
                    <path ref={upper} className="invisible" />
                    <path ref={lower} className="invisible" />
                </svg>
            )}
            {/* The room it hangs in holds still, to be measured, and so does
                what is set down round it; the frame inside it moves. */}
            <div ref={slot} className={cn("relative z-[1]", className)}>
                {around}
                <div ref={body} className="relative">
                    <RevealBlock className="relative">
                        {/* Pull me: an arrow at the tape and a word by it,
                            for a visitor who would not think to try — gone
                            once they have, for the rest of the visit. */}
                        <span
                            aria-hidden="true"
                            className={cn(
                                "pointer-events-none absolute bottom-[calc(100%-0.1rem)] left-[calc(50%+3.9rem)] hidden items-start gap-1 transition-opacity duration-500 motion-safe:flex md:left-[calc(50%+4.9rem)]",
                                pulled && "opacity-0"
                            )}
                        >
                            <Sketch lines={HINT} weight={1.6} duration={0.7} wander={0.3} className="w-9 md:w-11" />
                            <span className="-mt-1.5 font-mono text-label uppercase text-ink-3">Pull me</span>
                        </span>
                        {/* The tape the thread is stuck down with, and the
                            handle to pull it by — the screen itself stays
                            free for the video's own controls, and on a phone
                            a swipe anywhere else still scrolls the page. */}
                        <span
                            aria-hidden="true"
                            onPointerDown={grab}
                            onPointerMove={pull}
                            onPointerUp={drop}
                            onPointerCancel={drop}
                            className={cn(
                                "absolute left-1/2 top-0 z-10 h-7 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-2 select-none bg-ink/15 motion-safe:cursor-grab motion-safe:touch-none motion-safe:active:cursor-grabbing md:h-8 md:w-36",
                                TORN
                            )}
                        />
                        {children}
                    </RevealBlock>
                </div>
            </div>
        </>
    );
}
