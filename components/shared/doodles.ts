import { sineInOut, type Pt2 } from "@/lib/hand";

/* The doodles' shapes, as points — `handLine` makes lines of them — and the
   pen that draws them. Shared by the hero's doodles and the footer's, which
   bookend the page with the same hand. */

/* The pen's pause between two strokes of one doodle, in pixels of line it
   could have drawn instead. */
export const LIFT = 40;

/**
 * One doodle drawn to `p` of the way: its strokes in turn, with the pen's
 * lift between them, each easing in and out of itself.
 */
export function paintStrokes(els: (SVGPathElement | null)[], strokes: { len: number }[], p: number) {
    const total = strokes.reduce((sum, s) => sum + s.len, 0) + LIFT * (strokes.length - 1);
    const pen = p * total;
    let at = 0;
    strokes.forEach((s, i) => {
        const el = els[i];
        const drawn = s.len * sineInOut(Math.min(1, Math.max(0, (pen - at) / s.len)));
        at += s.len + LIFT;
        if (!el) return;
        el.style.strokeDashoffset = String(s.len - drawn);
        el.style.visibility = drawn > 0.5 ? "visible" : "hidden";
    });
}

export const turn = (p: Pt2, c: Pt2, deg: number): Pt2 => {
    const a = (deg * Math.PI) / 180;
    const x = p[0] - c[0];
    const y = p[1] - c[1];
    return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
};

/* A shape drawn in a unit box, set into a box `w` by `h` about (cx, cy) and
   tipped by `deg`. */
export const fit = (unit: Pt2[], cx: number, cy: number, w: number, h: number, deg = 0) =>
    unit.map(([x, y]) => turn([cx + (x - 0.5) * w, cy + (y - 0.5) * h], [cx, cy], deg));

/* A ring, gone round a little more than once, the second time a touch off
   the first. */
export function ring(turns: number, from: number): Pt2[] {
    const pts: Pt2[] = [];
    const n = Math.ceil(turns * 28);
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = from + t * turns * Math.PI * 2;
        const r = 0.5 * (1 + 0.04 * Math.sin(t * Math.PI * 3)) - t * 0.03;
        pts.push([0.5 + r * Math.cos(a) + t * 0.03, 0.5 + r * Math.sin(a)]);
    }
    return pts;
}

/* A crown's outline, its points sharp — a point given twice is a corner. */
export const CROWN: Pt2[] = [
    [0.05, 1],
    [0, 0.32],
    [0, 0.32],
    [0.27, 0.64],
    [0.27, 0.64],
    [0.5, 0.02],
    [0.5, 0.02],
    [0.73, 0.64],
    [0.73, 0.64],
    [1, 0.32],
    [1, 0.32],
    [0.95, 1],
    [0.95, 1],
    [0.05, 1],
];
export const CROWN_BAND: Pt2[] = [
    [0.08, 0.83],
    [0.5, 0.87],
    [0.92, 0.82],
];

export function squiggle(): Pt2[] {
    const pts: Pt2[] = [];
    for (let i = 0; i <= 40; i++) {
        const x = i / 40;
        pts.push([x, 0.5 + 0.5 * Math.sin(x * Math.PI * 5) * (1 - 0.35 * x)]);
    }
    return pts;
}

/* A four-pointed sparkle, its sides drawn in towards the middle. */
export const SPARKLE: Pt2[] = [
    [0.5, 0],
    [0.5, 0],
    [0.57, 0.43],
    [1, 0.5],
    [1, 0.5],
    [0.57, 0.57],
    [0.5, 1],
    [0.5, 1],
    [0.43, 0.57],
    [0, 0.5],
    [0, 0.5],
    [0.43, 0.43],
    [0.5, 0],
];

export function spiral(): Pt2[] {
    const pts: Pt2[] = [];
    const turns = 2.3;
    for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const a = t * turns * Math.PI * 2;
        pts.push([0.5 + 0.5 * t * Math.cos(a), 0.5 + 0.5 * t * Math.sin(a)]);
    }
    return pts;
}

/* A heart, in one stroke from its point round both lobes and back. */
export const HEART: Pt2[] = [
    [0.5, 1],
    [0.12, 0.58],
    [0, 0.3],
    [0.16, 0.05],
    [0.38, 0.06],
    [0.5, 0.27],
    [0.5, 0.27],
    [0.62, 0.05],
    [0.84, 0.03],
    [1, 0.28],
    [0.88, 0.58],
    [0.47, 1.02],
];

/* An arrow from `s` to `t` that throws one loop on the way, arcing over
   the top of the straight line rather than under it, whichever way it runs
   — so it comes down on what it points at, and never sags into it — its
   head lined up with the way it arrives. */
export function loopArrow(s: Pt2, t: Pt2, flip = false): Pt2[][] {
    const dx = t[0] - s[0];
    const dy = t[1] - s[1];
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    // the side of the line that is up the screen — or, `flip`ped, the
    // other, for a line running so nearly straight down that "up" would
    // swing it into whatever is beside it
    const up = (ux >= 0 ? -1 : 1) * (flip ? -1 : 1);
    const r = Math.max(10, len * 0.08);
    const line: Pt2[] = [];
    for (let i = 0; i <= 48; i++) {
        const k = i / 48;
        const u = Math.min(1, Math.max(0, (k - 0.38) / 0.28));
        const along = k * len - (u > 0 && u < 1 ? r * Math.sin(u * Math.PI * 2) : 0);
        const side = up * ((u > 0 && u < 1 ? r * (1 - Math.cos(u * Math.PI * 2)) : 0) + Math.sin(k * Math.PI) * len * 0.12);
        line.push([s[0] + ux * along - uy * side, s[1] + uy * along + ux * side]);
    }
    const [ax, ay] = line[line.length - 3];
    const al = Math.hypot(t[0] - ax, t[1] - ay);
    const bx = (ax - t[0]) / al;
    const by = (ay - t[1]) / al;
    const size = Math.max(12, len * 0.07);
    const barb = (deg: number, k: number): Pt2 => turn([t[0] + bx * size * k, t[1] + by * size * k], t, deg);
    return [line, [barb(30, 1), t, t, barb(-28, 0.85)]];
}

/* A line as dashes, `dash` pixels drawn and `gap` left out in turn along it —
   the trail a paper plane or a pointer leaves. Each dash is its own stroke. */
export function dashed(line: Pt2[], dash: number, gap: number): Pt2[][] {
    const out: Pt2[][] = [];
    let cur: Pt2[] = [line[0]];
    let on = true;
    let left = dash;
    for (let i = 1; i < line.length; i++) {
        let [ax, ay] = line[i - 1];
        const [bx, by] = line[i];
        let seg = Math.hypot(bx - ax, by - ay);
        while (seg > left) {
            const k = left / seg;
            const at: Pt2 = [ax + (bx - ax) * k, ay + (by - ay) * k];
            if (on) out.push([...cur, at]);
            else cur = [at];
            on = !on;
            [ax, ay] = at;
            seg -= left;
            left = on ? dash : gap;
        }
        left -= seg;
        if (on) cur.push([bx, by]);
    }
    if (on && cur.length > 1) out.push(cur);
    return out;
}
