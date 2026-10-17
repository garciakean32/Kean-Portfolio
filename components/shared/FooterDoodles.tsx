"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CROWN, CROWN_BAND, SPARKLE, fit, paintStrokes, ring, squiggle, turn } from "@/components/shared/doodles";
import { handLine, type Pt2 } from "@/lib/hand";
import { gsap, motionEnabled } from "@/lib/motion";

/* The footer's doodles: the hero's own, round the word the page stands on,
   so it closes the way it opened — a halo over its first letter, a crown on
   its last, a sparkle by each, a few lines of shine and a squiggle. They sit
   in the room left above the word for them and never cross it. */

type Stroke = { d: string; len: number };
type Doodle = { key: string; strokes: Stroke[]; at: number; dur: number };
type Art = { w: number; h: number; ink: number; doodles: Doodle[] };

/* Inter's caps in its own em, where the browser cannot measure the face:
   the ascent over the baseline, and the cap height. */
const ASCENT = 0.969;
const CAP = 0.727;

function layout(box: HTMLElement, word: HTMLElement): Art | null {
    const text = word.firstChild;
    if (!(text instanceof Text) || !text.length) return null;
    const o = box.getBoundingClientRect();
    const range = document.createRange();
    const letter = (i: number) => {
        range.setStart(text, i);
        range.setEnd(text, i + 1);
        const r = range.getBoundingClientRect();
        return { left: r.left - o.left, right: r.right - o.left, top: r.top - o.top };
    };
    const first = letter(0);
    const last = letter(text.length - 1);

    // Where the caps start: from the top of the letters' own box, by the
    // face's ascent less its cap height — measured where the browser can.
    const cs = getComputedStyle(word);
    const m = parseFloat(cs.fontSize);
    let capFrom = (ASCENT - CAP) * m;
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
        ctx.font = `${cs.fontWeight} ${m}px ${cs.fontFamily}`;
        const t = ctx.measureText(text.data.toUpperCase());
        if (t.fontBoundingBoxAscent) capFrom = t.fontBoundingBoxAscent - t.actualBoundingBoxAscent;
    }
    const capTop = first.top + capFrom;

    const W = o.width;
    const ink = Math.min(2.6, Math.max(1.8, m * 0.012));
    const gap = 14;
    const fw = first.right - first.left;
    const lw = last.right - last.left;
    // On a phone the word is small, and doodles sized off it would be too:
    // each has a floor there it is not drawn under — and there are fewer of
    // them, the halo, the crown and the squiggle, so the strip over the word
    // is not crowded.
    const phone = W < 640;
    const floor = (v: number, min: number) => Math.max(v, phone ? min : 0);
    const s = Math.min(30, floor(Math.max(14, m * 0.12), 18));

    // Each doodle's strokes, with when it starts and how long it takes: all
    // at once, the small ones done together first, the squiggle after them,
    // and the halo and the crown last — the hero's own timing.
    const doodles: Doodle[] = [];
    const add = (key: string, strokes: Pt2[][], at: number, dur: number, wander = 0.6) => {
        const lines = strokes.map((pts, i) => handLine(pts, key.length * 1.3 + i, wander));
        // Only where it sits wholly inside the room above the word.
        const inside = lines.every((l) => l.box.left >= 6 && l.box.right <= W - 6 && l.box.top >= 6);
        if (inside) doodles.push({ key, strokes: lines.map(({ d, len }) => ({ d, len })), at, dur });
        return inside;
    };

    // A halo over the first letter, and a sparkle off its far side.
    const hw = floor(fw * 0.8, 58);
    const hcx = (first.left + first.right) / 2;
    const hcy = capTop - gap - hw * 0.15;
    add("halo", [fit(ring(1.15, 3.6), hcx, hcy, hw, hw * 0.3, -9)], 0.15, 1.45);
    if (!phone) add("sparkle-a", [fit(SPARKLE, hcx - hw * 0.5 - s * 1.1, hcy - s * 0.4, s, s * 1.15, -8)], 0, 0.7, 0.2);

    // A crown on the last, a sparkle off its far side, and shine off its
    // top corner.
    const cw = floor(lw * 0.6, 46);
    const ch = cw * 0.64;
    const ccx = (last.left + last.right) / 2 - lw * 0.05;
    const ccy = capTop - gap - ch * 0.62;
    const jewel = (p: Pt2) => fit(ring(1.1, 0.5), ccx + (p[0] - 0.5) * cw, ccy + (p[1] - 0.5) * ch - cw * 0.07, cw * 0.09, cw * 0.09);
    add(
        "crown",
        [fit(CROWN, ccx, ccy, cw, ch), fit(CROWN_BAND, ccx, ccy, cw, ch), jewel([0, 0.32]), jewel([0.5, 0.02]), jewel([1, 0.32])].map(
            (pts) => pts.map((p) => turn(p, [ccx, ccy + ch / 2], 9))
        ),
        0.3,
        1.6,
        0.35
    );
    if (!phone) {
        add("sparkle-b", [fit(SPARKLE, ccx + cw * 0.5 + s * 1.2, ccy - ch * 0.3, s, s * 1.15, 6)], 0, 0.7, 0.2);
        const len = Math.min(36, floor(Math.max(12, m * 0.14), 18));
        const ox = last.right + gap * 0.6;
        const oy = capTop + m * 0.04;
        add(
            "shine",
            [-58, -22, 14].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return [
                    [ox + Math.cos(a) * len * 0.2, oy + Math.sin(a) * len * 0.2],
                    [ox + Math.cos(a) * len, oy + Math.sin(a) * len],
                ] as Pt2[];
            }),
            0,
            0.7,
            0.15
        );
    }

    // A squiggle over the word, a little left of its middle.
    const sw = floor(Math.max(m * 0.9, 60), 78);
    const sh = Math.min(20, floor(Math.max(8, m * 0.08), 10));
    add("squiggle", [fit(squiggle(), first.left + (last.right - first.left) * 0.36, capTop - gap - sh * 1.4, sw, sh, -3)], 0, 1);

    return { w: Math.round(W), h: Math.round(o.height), ink, doodles };
}

/**
 * The doodles, laid out over `word` in the box they share — `word` being
 * the svg's next sibling — and drawn the first time the footer comes into
 * view, the way the hero's draw: all at once, each easing in and out of its
 * own strokes, the ones that share a finish finishing together. With motion
 * off they are simply there.
 */
export default function FooterDoodles() {
    const svg = useRef<SVGSVGElement>(null);
    const lines = useRef<Record<string, (SVGPathElement | null)[]>>({});
    const [art, setArt] = useState<Art | null>(null);
    const begun = useRef(false);
    const run = useRef<gsap.core.Timeline | null>(null);

    useLayoutEffect(() => {
        const el = svg.current;
        const box = el?.parentElement;
        const word = el?.nextElementSibling;
        if (!el || !box || !(word instanceof HTMLElement)) return;
        if (!motionEnabled()) begun.current = true;
        const redo = () => setArt(layout(box, word));
        redo();
        document.fonts?.ready.then(redo);
        const observer = new ResizeObserver(redo);
        observer.observe(box);
        return () => observer.disconnect();
    }, []);

    // A fresh layout shows as far as the drawing has got: whole, once it
    // has begun.
    useLayoutEffect(() => {
        if (!art) return;
        run.current?.kill();
        art.doodles.forEach((d) => paintStrokes(lines.current[d.key] ?? [], d.strokes, begun.current ? 1 : 0));
    }, [art]);

    // Drawn the first time the word is all the way on screen — not as it
    // edges into view at the foot of it, where it would be done before
    // anyone was looking.
    useEffect(() => {
        const box = svg.current?.parentElement;
        if (!art || !box || begun.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting || begun.current) return;
                begun.current = true;
                observer.disconnect();
                const tl = gsap.timeline();
                art.doodles.forEach((d) => {
                    const state = { p: 0 };
                    tl.to(
                        state,
                        {
                            p: 1,
                            duration: d.dur,
                            ease: "none",
                            onUpdate: () => paintStrokes(lines.current[d.key] ?? [], d.strokes, state.p),
                        },
                        d.at
                    );
                });
                run.current = tl;
            },
            { threshold: 0.98 }
        );
        observer.observe(box);
        return () => observer.disconnect();
    }, [art]);

    useEffect(() => () => void run.current?.kill(), []);

    return (
        <svg
            ref={svg}
            aria-hidden="true"
            width={art?.w}
            height={art?.h}
            viewBox={art ? `0 0 ${art.w} ${art.h}` : undefined}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-0 top-0 text-ink opacity-90"
        >
            {art?.doodles.map((d) =>
                d.strokes.map((s, i) => (
                    <path
                        key={`${d.key}-${i}`}
                        ref={(el) => {
                            (lines.current[d.key] ??= [])[i] = el;
                        }}
                        d={s.d}
                        strokeWidth={art.ink}
                        strokeDasharray={s.len}
                        className="invisible"
                    />
                ))
            )}
        </svg>
    );
}
