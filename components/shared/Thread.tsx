"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motionEnabled } from "@/lib/motion";

/* The thread that runs down the page from one section into the next. Every
   section draws its own stretch with `ThreadLines`; the about and experience
   sections lay theirs out in About.tsx, the video introduction and the
   contact section with `useThread` below. */

export type Rect = { left: number; top: number; right: number; bottom: number; width: number; height: number };

/* A stroke of the thread: its path — and, for a long loop round something,
   `until`: how far down the page its middle is, in the svg's own pixels. A
   loop like that does not wait on the pen. It draws quickly from the moment
   the pen reaches it, and is all but done by the time its middle reaches the
   middle of the screen; then it eases off, and finishes just as the pen
   reaches its end — which is where the next stroke starts, so the drawing
   never stops while the page is moving. */
export type Line = string | { d: string; until: number };
export type Thread = { w: number; h: number; lines: Line[] };

/* Where the pen is: this far down the screen. Every stroke is drawn as far
   as the pen has reached down the page, so it grows just ahead of where the
   reader is looking. */
export const PEN = 0.62;

/* How much of the reader's scroll a stroke takes to draw where it is not
   going down the page — round a loop, across, back up — per pixel of it.
   Going down, the pen simply keeps pace with the page; without this a loop
   would appear whole the moment the pen reached its lowest point. */
const ROUND = 0.12;

/* How much of a loop is drawn by the time its middle is mid-screen. */
const NEAR = 0.9;

type Track = {
    el: SVGPathElement;
    len: number;
    /* a loop's middle, if it is one — see `Line` — and how far down its
       end is */
    until?: number;
    end: number;
    /* along the stroke, every few pixels: how far along it, and how far down
       the page the pen has to be for it to be drawn that far */
    at: number[];
    need: number[];
};

/**
 * Draws every stroke in `svg` as the page scrolls, as if being drawn there
 * and then: each grows from its start to wherever the pen has got to — see
 * `PEN` — and stays drawn when the page goes back up: ink, once down, is
 * down. Strokes that start and end at the same height down the page draw
 * together. With motion off they are simply there.
 */
function useDrawOnScroll(svg: React.RefObject<SVGSVGElement | null>, thread: Thread | null) {
    // The furthest down the pen has been, in the svg's own pixels — kept
    // through a fresh layout, so nothing drawn is lost to a resize either.
    const reach = useRef(-Infinity);
    useEffect(() => {
        const el = svg.current;
        if (!el || !thread) return;
        const paths = Array.from(el.querySelectorAll("path"));
        if (!motionEnabled()) {
            paths.forEach((p) => (p.style.visibility = "visible"));
            return;
        }

        // How far down the pen has to be for each bit of a stroke to be
        // drawn: never before it is there, and a little further along than
        // the last bit, for the scroll it takes to draw it. A stroke whose
        // loops would have it finish later than the pen reaches its end is
        // brought forward to finish there, so the stretch in the next
        // section always carries straight on from it.
        const tracks: Track[] = paths.map((p) => {
            const len = p.getTotalLength();
            const steps = Math.max(2, Math.ceil(len / 8));
            const at: number[] = [];
            const need: number[] = [];
            let prev = p.getPointAtLength(0);
            for (let i = 0; i <= steps; i++) {
                const l = (len * i) / steps;
                const q = p.getPointAtLength(l);
                const ds = Math.hypot(q.x - prev.x, q.y - prev.y);
                need.push(i ? Math.max(q.y, need[i - 1] + ROUND * ds) : q.y);
                at.push(l);
                prev = q;
            }
            const from = need[0];
            const end = Math.max(prev.y, from + 1);
            const last = need[need.length - 1];
            if (last > end) {
                const k = (end - from) / (last - from);
                for (let i = 0; i < need.length; i++) need[i] = from + (need[i] - from) * k;
            }
            p.style.strokeDasharray = `${len} ${len}`;
            const until = p.dataset.until ? Number(p.dataset.until) : undefined;
            return { el: p, len, at, need, until, end: prev.y };
        });

        // Past this the whole thread is drawn, and scrolling has nothing left to do.
        const full = Math.max(...tracks.map((t) => Math.max(t.need[t.need.length - 1], t.end, t.need[0] + 1)));

        const paint = (force?: unknown) => {
            if (force !== true && reach.current >= full) return;
            // the pen, in the svg's own pixels — or wherever it has been
            // that is further down. Ink never undraws, so a pen that has not
            // got further than before changes nothing.
            const at = window.innerHeight * PEN - el.getBoundingClientRect().top;
            if (force !== true && at <= reach.current) return;
            const pen = Math.max(reach.current, at);
            reach.current = pen;
            for (const t of tracks) {
                if (t.until !== undefined) {
                    // A loop: from where the pen meets it to where it ends,
                    // fast at first and easing off — NEAR of it drawn by the
                    // time its middle is mid-screen.
                    const start = t.need[0];
                    const end = Math.max(t.end, start + 1);
                    const mid = Math.min(t.until + window.innerHeight * (PEN - 0.5), end);
                    const u = Math.min(1, Math.max(0, (pen - start) / (end - start)));
                    const um = Math.min(0.98, Math.max(0.05, (mid - start) / (end - start)));
                    const ease = Math.min(4, Math.max(1, Math.log(1 - NEAR) / Math.log(1 - um)));
                    const k = 1 - Math.pow(1 - u, ease);
                    t.el.style.strokeDashoffset = String(t.len * (1 - k));
                    t.el.style.visibility = k * t.len > 0.5 ? "visible" : "hidden";
                    continue;
                }
                // the furthest along the stroke the pen has reached
                let lo = 0;
                let hi = t.need.length;
                while (lo < hi) {
                    const mid = (lo + hi) >> 1;
                    if (t.need[mid] <= pen) lo = mid + 1;
                    else hi = mid;
                }
                const drawn = lo === 0 ? 0 : t.at[lo - 1];
                t.el.style.strokeDashoffset = String(t.len - drawn);
                t.el.style.visibility = drawn > 0.5 ? "visible" : "hidden";
            }
        };

        const repaint = () => paint(true);
        repaint();
        window.addEventListener("scroll", paint, { passive: true });
        window.addEventListener("resize", repaint);
        return () => {
            window.removeEventListener("scroll", paint);
            window.removeEventListener("resize", repaint);
        };
    }, [svg, thread]);
}

/**
 * One section's stretch of the thread: `draw` lays its strokes out in the
 * section's own pixels — `box` is the section, `at` gives any element's box
 * in it — and they are laid out again whenever the section changes size.
 */
export function useThread(
    section: React.RefObject<HTMLElement | null>,
    draw: (box: Rect, at: (el: Element) => Rect) => Line[]
) {
    const [thread, setThread] = useState<Thread | null>(null);
    const latest = useRef(draw);
    useLayoutEffect(() => {
        latest.current = draw;
    });

    useLayoutEffect(() => {
        const box = section.current;
        if (!box) return;

        const measure = () => {
            const o = box.getBoundingClientRect();
            const at = (el: Element): Rect => {
                const r = el.getBoundingClientRect();
                return {
                    left: r.left - o.left,
                    top: r.top - o.top,
                    right: r.right - o.left,
                    bottom: r.bottom - o.top,
                    width: r.width,
                    height: r.height,
                };
            };
            const own = { left: 0, top: 0, right: o.width, bottom: o.height, width: o.width, height: o.height };
            setThread({ w: Math.round(o.width), h: Math.round(o.height), lines: latest.current(own, at) });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        return () => observer.disconnect();
    }, [section]);

    return thread;
}

/** A stretch of the thread, drawn as the page scrolls down it. */
export function ThreadLines({ thread }: { thread: Thread | null }) {
    const svg = useRef<SVGSVGElement>(null);
    useDrawOnScroll(svg, thread);
    if (!thread) return null;
    return (
        <svg
            ref={svg}
            aria-hidden="true"
            width={thread.w}
            height={thread.h}
            viewBox={`0 0 ${thread.w} ${thread.h}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-0 top-0 text-ink"
        >
            {thread.lines.map((line) => {
                const d = typeof line === "string" ? line : line.d;
                return (
                    <path
                        key={d}
                        d={d}
                        data-until={typeof line === "string" ? undefined : line.until}
                        className="invisible"
                    />
                );
            })}
        </svg>
    );
}
