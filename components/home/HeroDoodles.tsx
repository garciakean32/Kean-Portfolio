"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import {
    BOLT,
    CROWN,
    CROWN_BAND,
    HEART,
    SPARKLE,
    STAR,
    fit,
    loopArrow,
    paintStrokes,
    ring,
    spiral,
    squiggle,
    turn,
} from "@/components/shared/doodles";
import { handLine, type Pt2 } from "@/lib/hand";
import { gsap, motionEnabled } from "@/lib/motion";

/* The hero's backdrop: doodles in a marker, drawn round the poster rather
   than over it — a halo, a crown, a squiggle, sparkles, a spiral, a heart,
   a few lines of shine and an arrow at the offer.

   None of them is placed by percentages. Where the words and the figure sit
   changes with the shape of the screen, so every doodle is laid out from
   where they actually are, measured, and each has a few places it could go:
   the first that keeps clear of every word, of the figure's own outline and
   of the docks over the page is the one it gets, and a doodle with nowhere
   to go on a screen is simply left off it. */

export type HeroDoodlesHandle = { draw: () => void };

type Box = { left: number; top: number; right: number; bottom: number };
type Ride = "name" | "head" | "page";
type Stroke = { d: string; len: number };
type Doodle = { key: string; strokes: Stroke[]; ride: Ride; at: number; dur: number };
type Art = { w: number; h: number; ink: number; doodles: Doodle[] };

/* The cut-out the portrait is — `kean hero.png`, contain-fit — and its
   outline, measured off its own pixels: for each twentieth of its height
   down from the crown of the head, how far across the figure reaches, as
   fractions of the image. The head starts 12.8% down. */
const FIGURE = { w: 1100, h: 2048, top: 0.128 };
const OUTLINE: [number, number, number][] = [
    [0.15, 0.345, 0.614],
    [0.2, 0.299, 0.664],
    [0.25, 0.325, 0.766],
    [0.3, 0.385, 0.851],
    [0.35, 0.386, 0.931],
    [0.4, 0.207, 0.993],
    [0.45, 0.136, 0.982],
    [0.5, 0.107, 0.95],
    [0.55, 0.087, 0.768],
    [0.6, 0.063, 0.775],
    [0.65, 0.042, 0.788],
    [0.7, 0.116, 0.802],
    [0.75, 0.112, 0.815],
    [0.8, 0.105, 0.828],
    [0.85, 0.094, 0.842],
    [0.9, 0.094, 0.78],
    [0.95, 0.106, 0.776],
    [1, 0.191, 0.746],
];

/* The room every doodle keeps round a word, the figure, the docks and each
   other, in pixels. */
const ROOM = 12;

/* Where the glyphs sit in a line of the name: Inter's caps run from 4.7% to
   77.4% of its 0.82 line. Used where the browser cannot measure it. */
const CAP_TOP = 0.047;
const BASELINE = 0.774;

/* ── measuring the poster ── */

type Layout = {
    w: number;
    h: number;
    m: number;
    capTop: number;
    base: number;
    k: Box;
    n: Box;
    img: Box | null;
    blocks: Box[];
    named: Record<string, Box | undefined>;
};

function measure(frame: HTMLElement): Layout | null {
    const wordmark = frame.querySelector<HTMLElement>(".js-wordmark");
    const parts = frame.querySelectorAll<HTMLElement>(".js-name-part");
    if (!wordmark || parts.length < 2) return null;

    // Everything is laid out in the frame's own pixels, the ones the poster
    // is drawn in before the intro's dolly scales it — and before the
    // scroll's drift has moved the name or the figure, either.
    const f = frame.getBoundingClientRect();
    const s = f.width / frame.offsetWidth || 1;
    const local = (el: Element, dy = 0): Box => {
        const r = el.getBoundingClientRect();
        return {
            left: (r.left - f.left) / s,
            top: (r.top - f.top) / s - dy,
            right: (r.right - f.left) / s,
            bottom: (r.bottom - f.top) / s - dy,
        };
    };
    const drift = (el: HTMLElement | null) =>
        el ? ((Number(gsap.getProperty(el, "yPercent")) || 0) / 100) * el.offsetHeight : 0;

    const nameDrift = drift(wordmark);
    const ke = local(parts[0], nameDrift);
    const an = local(parts[1], nameDrift);

    // The caps inside the name's line: measured in its own face where the
    // browser can, from Inter's numbers where it cannot.
    const cs = getComputedStyle(wordmark);
    const m = parseFloat(cs.fontSize);
    const line = ke.bottom - ke.top;
    let capFrom = CAP_TOP * m;
    let baseFrom = BASELINE * m;
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
        ctx.font = `${cs.fontWeight} ${m}px ${cs.fontFamily}`;
        const t = ctx.measureText("KEAN");
        if (t.fontBoundingBoxAscent) {
            baseFrom = (line - (t.fontBoundingBoxAscent + t.fontBoundingBoxDescent)) / 2 + t.fontBoundingBoxAscent;
            capFrom = baseFrom - t.actualBoundingBoxAscent;
        }
    }
    const capTop = ke.top + capFrom;
    const base = ke.top + baseFrom;
    const kw = (ke.right - ke.left) * 0.53;
    const nw = (an.right - an.left) * 0.5;
    const k: Box = { left: ke.left, right: ke.left + kw, top: capTop, bottom: base };
    const n: Box = { left: an.right - nw, right: an.right, top: capTop, bottom: base };

    // The figure: contain-fit in its box, so its own size and centre.
    const portrait = frame.querySelector<HTMLElement>(".js-portrait");
    let img: Box | null = null;
    if (portrait) {
        const p = local(portrait, drift(portrait));
        const fitScale = Math.min((p.right - p.left) / FIGURE.w, (p.bottom - p.top) / FIGURE.h);
        const iw = FIGURE.w * fitScale;
        const ih = FIGURE.h * fitScale;
        const left = (p.left + p.right - iw) / 2;
        const top = (p.top + p.bottom - ih) / 2;
        img = { left, top, right: left + iw, bottom: top + ih };
    }

    // Every word on the poster — the name as its two lines of caps — and
    // the docks over the page. Those are fixed to the screen, so where they
    // sit on it is where they sit on the hero, with the hero at the top.
    const words = Array.from(frame.querySelectorAll(".js-body, .js-role, .js-vertical")).map((el) => local(el));
    const chrome = Array.from(document.querySelectorAll("[data-chrome]")).map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    });
    const nameBoxes = [
        { ...ke, top: capTop, bottom: base },
        { ...an, top: capTop, bottom: base },
    ];
    const avail = frame.querySelector('[data-glitch="offer"]');
    const mark = frame.querySelector('[data-glitch="mark"]');
    const list = frame.querySelector('[data-glitch="jp"]');
    const role = frame.querySelector(".js-role");

    return {
        w: frame.offsetWidth,
        h: frame.offsetHeight,
        m,
        capTop,
        base,
        k,
        n,
        img,
        blocks: [...words, ...nameBoxes, ...chrome.filter((r) => r.right > r.left && r.bottom > r.top)],
        named: {
            avail: avail ? local(avail) : undefined,
            mark: mark ? local(mark) : undefined,
            list: list ? local(list) : undefined,
            role: role ? local(role) : undefined,
        },
    };
}

/* ── laying the doodles out ── */

type Candidate = { strokes: Pt2[][]; ride: Ride; smooth?: number };

function layout(L: Layout): Art {
    const { w: W, h: H, m } = L;
    const ink = Math.min(2.6, Math.max(1.8, m * 0.0075));
    const placed: Box[] = [];
    const doodles: Doodle[] = [];
    const boxes: Record<string, Box> = {};

    const meets = (a: Box, b: Box) =>
        a.left < b.right + ROOM && a.right > b.left - ROOM && a.top < b.bottom + ROOM && a.bottom > b.top - ROOM;

    // The figure's own outline, not its box: for the rows the doodle spans,
    // how far across the figure reaches.
    // How far across the figure reaches over the rows from `top` to
    // `bottom` — its own outline, not its box — or null where it is not.
    const reach = (top: number, bottom: number) => {
        const img = L.img;
        if (!img) return null;
        const ih = img.bottom - img.top;
        const iw = img.right - img.left;
        const g1 = (top - img.top) / ih;
        const g2 = (bottom - img.top) / ih;
        let left = Infinity;
        let right = -Infinity;
        OUTLINE.forEach(([f, a, z], i) => {
            const from = i === 0 ? FIGURE.top : f - 0.025;
            if (g2 < from || g1 > f + 0.025) return;
            left = Math.min(left, img.left + a * iw);
            right = Math.max(right, img.left + z * iw);
        });
        return left < right ? { left, right } : null;
    };
    const onFigure = (b: Box) => {
        const r = reach(b.top - ROOM, b.bottom + ROOM);
        return !!r && b.left - ROOM < r.right && b.right + ROOM > r.left;
    };

    const fits = (b: Box) =>
        b.left >= 8 &&
        b.top >= 8 &&
        b.right <= W - 8 &&
        b.bottom <= H - 8 &&
        !L.blocks.some((r) => meets(b, r)) &&
        !placed.some((r) => meets(b, r)) &&
        !onFigure(b);

    // The first of a doodle's places that fits, drawn out; or none.
    const place = (key: string, at: number, dur: number, options: (Candidate | null)[]) => {
        for (const option of options) {
            if (!option) continue;
            const lines = option.strokes.map((pts, i) => handLine(pts, key.length * 1.3 + i, option.smooth ?? 0.6));
            const b = lines.reduce<Box>(
                (acc, l) => ({
                    left: Math.min(acc.left, l.box.left - ink),
                    top: Math.min(acc.top, l.box.top - ink),
                    right: Math.max(acc.right, l.box.right + ink),
                    bottom: Math.max(acc.bottom, l.box.bottom + ink),
                }),
                { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
            );
            if (!fits(b)) continue;
            placed.push(b);
            boxes[key] = b;
            doodles.push({
                key,
                strokes: lines.map(({ d, len }) => ({ d, len })),
                ride: option.ride,
                at,
                dur,
            });
            return b;
        }
        return null;
    };

    const kw = L.k.right - L.k.left;
    const nw = L.n.right - L.n.left;
    const kcx = (L.k.left + L.k.right) / 2;
    const ncx = (L.n.left + L.n.right) / 2;
    const gap = ROOM + 6;
    /* A phone. The name is small there and every doodle sized off it would
       be too, so each has a floor it is not drawn under — and there are a
       few more of them, in the room a phone has above the name. */
    const phone = W < 640;
    const floor = (v: number, min: number) => Math.max(v, phone ? min : 0);

    // When they start, and how long each takes: all at once, the small
    // ones done together first, the squiggle and the spiral together after
    // them, and the halo and the crown last of all.
    const haloW = floor(kw * 0.66, 88);
    const halo = place("halo", 0.15, 1.45, [
        // Over the figure's head, where there is room above it — a tall
        // screen, where the head sits well down the frame.
        L.img
            ? (() => {
                  const img = L.img!;
                  const iw = img.right - img.left;
                  const hw = 0.269 * iw;
                  const top = img.top + FIGURE.top * (img.bottom - img.top);
                  const w = hw * 0.85;
                  const h = w * 0.3;
                  const cx = img.left + 0.48 * iw;
                  return { strokes: [fit(ring(1.15, 3.6), cx, top - gap - h / 2, w, h, -8)], ride: "head" as Ride };
              })()
            : null,
        // Over the K.
        { strokes: [fit(ring(1.15, 3.6), kcx + kw * 0.04, L.capTop - gap - haloW * 0.15, haloW, haloW * 0.3, -9)], ride: "name" },
        { strokes: [fit(ring(1.15, 3.6), kcx, L.capTop - gap - haloW * 0.1, haloW * 0.7, haloW * 0.21, -9)], ride: "name" },
    ]);

    const crownAt = (scale: number, shift = 0.1): Candidate => {
        const w = floor(nw * 0.5, 62) * scale;
        const h = w * 0.64;
        const cx = ncx + nw * shift;
        const cy = L.capTop - gap - h * 0.62;
        const jewel = (x: number, y: number) => fit(ring(1.1, 0.5), x, y, w * 0.09, w * 0.09);
        const tip = (p: Pt2): Pt2 => [cx + (p[0] - 0.5) * w, cy + (p[1] - 0.5) * h - w * 0.07];
        return {
            strokes: [
                fit(CROWN, cx, cy, w, h),
                fit(CROWN_BAND, cx, cy, w, h),
                jewel(...tip([0, 0.32])),
                jewel(...tip([0.5, 0.02])),
                jewel(...tip([1, 0.32])),
            ].map((pts) => pts.map((p) => turn(p, [cx, cy + h / 2], 11))),
            ride: "name",
            smooth: 0.35,
        };
    };
    const crown = place("crown", 0.3, 1.6, [crownAt(1), crownAt(0.75), crownAt(0.8, -0.15), crownAt(0.65, -0.3)]);

    // At the offer, and ahead of everything after it, so they make room for
    // it rather than it for them. From under the last letter where the
    // frame has the height; otherwise down onto it from above, from either
    // side and from higher or lower, or in at it from its left.
    const avail = L.named.avail;
    if (avail && avail.right > avail.left) {
        const aw = avail.right - avail.left;
        const acx = (avail.left + avail.right) / 2;
        const acy = (avail.top + avail.bottom) / 2;
        const onTop: Pt2 = [acx, avail.top - ROOM - 6];
        const onLeft: Pt2 = [avail.left - ROOM - 8, acy];
        const arrow = (from: Pt2, to: Pt2, flip = false): Candidate | null =>
            Math.hypot(to[0] - from[0], to[1] - from[1]) < 70
                ? null
                : { strokes: loopArrow(from, to, flip), ride: "page" };
        // From above: higher first, then lower; from the left of it, then
        // straight over it, then its right — each looping either way.
        const fromAbove = [0.3, 0.22, 0.15].flatMap((k) =>
            [-0.9, -0.4, 0.05, 0.55].flatMap((x) => [
                arrow([acx + aw * x, onTop[1] - H * k], onTop),
                arrow([acx + aw * x, onTop[1] - H * k], onTop, true),
            ])
        );
        place("arrow", 0, 1.3, [
            onTop[1] - (L.base + gap) > 90 ? arrow([ncx - nw * 0.05, L.base + gap + m * 0.06], onTop) : null,
            ...fromAbove,
            arrow([avail.left - aw * 1.1, acy - aw * 0.45], onLeft),
            arrow([avail.left - aw * 0.8, acy - aw * 0.3], onLeft),
        ]);
    }

    const s = Math.min(34, floor(Math.max(16, m * 0.1), 24));
    const sparkle = (cx: number, cy: number, ride: Ride, deg = 0): Candidate => ({
        strokes: [fit(SPARKLE, cx, cy, s, s * 1.15, deg)],
        ride,
        smooth: 0.2,
    });
    const haloRide = doodles.find((d) => d.key === "halo")?.ride ?? "name";
    place("sparkle-a", 0, 0.7, [
        halo ? sparkle(halo.left - s * 1.3, halo.top - s * 0.2, haloRide, -8) : null,
        halo ? sparkle(halo.right + s * 1.3, halo.top - s * 0.3, haloRide, 6) : null,
        L.named.mark ? sparkle(L.named.mark.right + s * 1.6, L.named.mark.bottom + s * 2, "page") : null,
    ]);
    place("sparkle-b", 0, 0.7, [
        crown ? sparkle(crown.left - s * 1.3, crown.top + s * 0.3, "name", 10) : null,
        crown ? sparkle(crown.right + s * 1.3, crown.top, "name", -6) : null,
    ]);

    // Three lines of shine off a corner of the name.
    const shine = (ox: number, oy: number, dir: 1 | -1): Candidate => {
        const len = Math.min(40, floor(Math.max(12, m * 0.12), 20));
        return {
            strokes: [-58, -22, 14].map((deg) => {
                const a = (deg * Math.PI) / 180;
                const ux = Math.cos(a) * dir;
                const uy = Math.sin(a);
                return [
                    [ox + ux * len * 0.2, oy + uy * len * 0.2],
                    [ox + ux * len, oy + uy * len],
                ] as Pt2[];
            }),
            ride: "name",
            smooth: 0.15,
        };
    };
    place("shine", 0, 0.7, [
        shine(L.n.right + gap, L.capTop + m * 0.02, 1),
        shine(L.k.left - gap, L.capTop + m * 0.02, -1),
    ]);

    const squigH = Math.min(22, floor(Math.max(8, m * 0.07), 11));
    const squiggly = (box: Box, bw: number): Candidate => {
        const w = floor(bw * 0.78, 84);
        return {
            strokes: [fit(squiggle(), box.left + bw * 0.1 + w / 2, L.base + gap + squigH / 2, w, squigH, -2)],
            ride: "name",
        };
    };
    const squig = place("squiggle", 0, 1, [squiggly(L.k, kw), squiggly(L.n, nw)]);

    const sp = Math.min(60, floor(Math.max(26, m * 0.2), 38));
    place("spiral", 0, 1, [
        squig ? { strokes: [fit(spiral(), squig.left + sp * 0.7, squig.bottom + gap + sp / 2, sp, sp)], ride: "name" } : null,
        { strokes: [fit(spiral(), L.k.left - gap - sp / 2, (L.capTop + L.base) / 2, sp, sp)], ride: "name" },
        { strokes: [fit(spiral(), L.n.right + gap + sp / 2, (L.capTop + L.base) / 2, sp, sp)], ride: "name" },
    ]);

    // Beside the list of what I make, or over it — and on a phone, where
    // the list is not shown, beside the figure's head.
    const list = L.named.list;
    const hs = s * 1.2;
    const heart = (cx: number, cy: number, ride: Ride): Candidate => ({
        strokes: [fit(HEART, cx, cy, hs, hs * 0.92, -10)],
        ride,
        smooth: 0.3,
    });
    const img = L.img;
    const iw = img ? img.right - img.left : 0;
    const ih = img ? img.bottom - img.top : 0;
    place("heart", 0, 0.7, [
        list && list.right > list.left ? heart(list.right + s * 1.6, list.top + (list.bottom - list.top) * 0.4, "page") : null,
        list && list.right > list.left ? heart(list.left + s * 0.8, list.top - s * 1.3, "page") : null,
        img ? heart(img.left + iw * 0.2, img.top + ih * 0.3, "head") : null,
        img ? heart(img.left + iw * 0.14, img.top + ih * 0.22, "head") : null,
    ]);

    // A phone's extra few, in the band between the top line of type and the
    // name: a line under what I do, a star and a bolt — each wherever it
    // first fits.
    if (phone) {
        const role = L.named.role;
        if (role) {
            const rw = role.right - role.left;
            place("underline", 0, 1, [
                {
                    strokes: [fit(squiggle(), (role.left + role.right) / 2, role.bottom + gap + 4, rw * 0.72, 8, 1)],
                    ride: "page",
                },
            ]);
        }
        const bandTop = role ? role.bottom : 40;
        const band = (k: number) => bandTop + (L.capTop - bandTop) * k;
        const spots: Pt2[] = [
            [W * 0.5, band(0.45)],
            [W * 0.34, band(0.4)],
            [W * 0.66, band(0.4)],
            [W * 0.42, band(0.62)],
            [W * 0.58, band(0.62)],
            [W * 0.24, band(0.58)],
            [W * 0.76, band(0.58)],
            [W * 0.5, band(0.28)],
        ];
        const at = (make: (x: number, y: number) => Candidate) => spots.map(([x, y]) => make(x, y));
        place("star", 0, 0.7, at((x, y) => ({ strokes: [fit(STAR, x, y, 32, 32, -8)], ride: "page", smooth: 0.25 })));
        place("bolt", 0, 1, at((x, y) => ({ strokes: [fit(BOLT, x, y, 24, 38, 10)], ride: "page", smooth: 0.2 })));

        // And down both sides of the figure, in what room its outline
        // leaves there: a squiggle and an arrow at it on each side, the two
        // sides staggered, each tried at its own height first and then a little
        // above and below it, centred in the strip between the figure and the
        // edge. They go where the figure goes as the hero scrolls away.
        const top = L.base + gap;
        const bottom = H - 16;
        const down = (dir: -1 | 1, k: number, h: number, make: (x: number, y: number) => Candidate) =>
            [0, 24, -24, 48, -48, 72, -72, 96, -96].map((dy) => {
                const y = top + (bottom - top) * k + dy;
                const r = reach(y - h / 2 - ROOM, y + h / 2 + ROOM);
                const x = dir < 0 ? (8 + (r ? r.left - ROOM : W / 2)) / 2 : ((r ? r.right + ROOM : W / 2) + W - 8) / 2;
                return make(x, y);
            });
        const tall = (x: number, y: number): Candidate => ({
            strokes: [fit(squiggle(), x, y, 64, 11, 90)],
            ride: "head",
        });
        // A short arrow at the figure, from whichever side it is on.
        const nudge = (toward: 1 | -1) => (x: number, y: number): Candidate => {
            const end: Pt2 = [x + 13 * toward, y + 6];
            const barb = (deg: number): Pt2 => turn([end[0] - 9 * toward, end[1] - 1], end, deg);
            return {
                strokes: [
                    [
                        [x - 13 * toward, y - 13],
                        [x - 1 * toward, y + 2],
                        end,
                    ],
                    [barb(-38), end, end, barb(34)],
                ],
                ride: "head",
                smooth: 0.2,
            };
        };
        place("left-line", 0, 1, down(-1, 0.25, 64, tall));
        place("left-nudge", 0, 1, down(-1, 0.62, 26, nudge(1)));
        place("right-nudge", 0, 1, down(1, 0.3, 26, nudge(-1)));
        place("right-line", 0, 1, down(1, 0.62, 64, tall));
    }

    return { w: W, h: H, ink, doodles };
}

/**
 * The doodles, measured and laid out on the frame they sit in — the
 * poster's own, so the intro's dolly carries them with everything else — and
 * drawn when `draw` is called: all at once, each easing in and out of its
 * own strokes, the ones that share a finish finishing together. With motion
 * off they are simply there.
 *
 * The ones that sit on the name drift with it as the hero scrolls away, and
 * the one that sits on the head with the figure; see Hero.tsx's drift.
 */
const HeroDoodles = forwardRef<HeroDoodlesHandle>(function HeroDoodles(_, handle) {
    const svg = useRef<SVGSVGElement>(null);
    const lines = useRef<Record<string, (SVGPathElement | null)[]>>({});
    const groups = useRef<Partial<Record<Ride, SVGGElement | null>>>({});
    const [art, setArt] = useState<Art | null>(null);
    /* whether drawing has begun, and so whether a fresh layout shows whole */
    const begun = useRef(false);
    const run = useRef<gsap.core.Timeline | null>(null);

    useLayoutEffect(() => {
        const frame = svg.current?.parentElement;
        if (!frame) return;
        if (!motionEnabled()) begun.current = true;
        const redo = () => {
            const L = measure(frame);
            if (L) setArt(layout(L));
        };
        redo();
        document.fonts?.ready.then(redo);
        const observer = new ResizeObserver(redo);
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    const paint = (d: Doodle, p: number) => paintStrokes(lines.current[d.key] ?? [], d.strokes, p);

    // A fresh layout shows as far as the drawing has got: whole, once it
    // has begun — a resize mid-draw simply finishes it.
    useLayoutEffect(() => {
        if (!art) return;
        run.current?.kill();
        art.doodles.forEach((d) => paint(d, begun.current ? 1 : 0));
    }, [art]);

    useImperativeHandle(handle, () => ({
        draw: () => {
            if (!art || begun.current) return;
            begun.current = true;
            const tl = gsap.timeline();
            art.doodles.forEach((d) => {
                const state = { p: 0 };
                tl.to(state, { p: 1, duration: d.dur, ease: "none", onUpdate: () => paint(d, state.p) }, d.at);
            });
            run.current = tl;
        },
    }));

    // The drift, as the hero scrolls away: the same as the name's and the
    // figure's own, so what sits on them stays on them.
    useEffect(() => {
        const frame = svg.current?.parentElement;
        const section = frame?.parentElement;
        if (!art || !frame || !section || !motionEnabled()) return;
        const wordmark = frame.querySelector<HTMLElement>(".js-wordmark");
        const portrait = frame.querySelector<HTMLElement>(".js-portrait");
        const ctx = gsap.context(() => {
            gsap.timeline({
                scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
            })
                .to(groups.current.name ?? [], { y: () => -0.12 * (wordmark?.offsetHeight ?? 0), ease: "none" }, 0)
                .to(groups.current.head ?? [], { y: () => 0.06 * (portrait?.offsetHeight ?? 0), ease: "none" }, 0);
        });
        return () => ctx.revert();
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
            className="pointer-events-none absolute left-0 top-0 z-20 text-white opacity-90"
        >
            {(["page", "name", "head"] as Ride[]).map((ride) => (
                <g
                    key={ride}
                    ref={(el) => {
                        groups.current[ride] = el;
                    }}
                >
                    {art?.doodles
                        .filter((d) => d.ride === ride)
                        .map((d) =>
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
                </g>
            ))}
        </svg>
    );
});

export default HeroDoodles;
