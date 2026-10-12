/* Lines drawn the way a hand draws them — the arrows at the experience
   button and the doodles round the hero both come out of here. */

export type Pt2 = [number, number];

export const sineInOut = (k: number) => -(Math.cos(Math.PI * k) - 1) / 2;

/**
 * One smooth stroke from (sx, sy) to (tx, ty), bowed to one side by `bow` of
 * its length (negative bows the other way). One curve and no wiggle — a
 * marker's line, not something swimming: the thread that runs down the page
 * from one section into the next.
 */
export function bowLine(sx: number, sy: number, tx: number, ty: number, bow: number) {
    const qx = (sx + tx) / 2 - (ty - sy) * bow;
    const qy = (sy + ty) / 2 + (tx - sx) * bow;
    return `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
}

/**
 * A stroke running down the page from (sx, sy) to (tx, ty), swaying to one
 * side by `sway` of its height on the way (negative sways the other way),
 * and running straight down at both ends — so where it crosses the edge of
 * a section into the next, it meets the stroke on the other side running the
 * same way, without a kink.
 */
export function dropLine(sx: number, sy: number, tx: number, ty: number, sway: number) {
    const k = (ty - sy) / 6;
    const mx = (sx + tx) / 2 + sway * Math.abs(ty - sy);
    const my = (sy + ty) / 2;
    const f = (n: number) => n.toFixed(1);
    return `M${f(sx)} ${f(sy)} C${f(sx)} ${f(sy + k)} ${f(mx)} ${f(my - k)} ${f(mx)} ${f(my)} S${f(tx)} ${f(ty - k)} ${f(tx)} ${f(ty)}`;
}

/**
 * One hand-drawn line through `pts`: a smooth curve — each point's tangent
 * runs between its neighbours, the ends' straight at their one neighbour, so
 * it arrives at the last point heading the way the last stretch does — with
 * the faint wander of a hand along it, fading out at the tip so a head drawn
 * there lines up. A point given twice in a row is a corner rather than a
 * bend. `wander` scales the wander, for a line too small to carry all of it.
 *
 * Returned as a polyline, with its length and the box it fills.
 */
export function handLine(pts: Pt2[], seed: number, wander = 1) {
    const n = pts.length;
    const tan = pts.map((_, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(n - 1, i + 1)];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    });
    const out: Pt2[] = [pts[0]];
    for (let i = 0; i < n - 1; i++) {
        const [px, py] = pts[i];
        const [qx, qy] = pts[i + 1];
        const d = Math.hypot(qx - px, qy - py);
        const c1 = [px + (tan[i][0] * d) / 3, py + (tan[i][1] * d) / 3];
        const c2 = [qx - (tan[i + 1][0] * d) / 3, qy - (tan[i + 1][1] * d) / 3];
        const steps = Math.max(2, Math.ceil(d / 6));
        for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const m = 1 - t;
            const at = (p: number, a: number, b: number, q: number) =>
                m * m * m * p + 3 * m * m * t * a + 3 * m * t * t * b + t * t * t * q;
            out.push([at(px, c1[0], c2[0], qx), at(py, c1[1], c2[1], qy)]);
        }
    }

    const run = [0];
    for (let i = 1; i < out.length; i++) {
        run.push(run[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    }
    const total = run[run.length - 1];
    const line = out.map(([x, y], i): Pt2 => {
        if (i === 0 || i === out.length - 1) return [x, y];
        const [ax, ay] = out[i - 1];
        const [bx, by] = out[i + 1];
        const l = Math.hypot(bx - ax, by - ay) || 1;
        const s = run[i];
        const w =
            wander *
            (1.3 * Math.sin(s / 70 + seed) + 0.5 * Math.sin(s / 23 + seed * 2.1)) *
            Math.min(1, (total - s) / 50);
        return [x - ((by - ay) / l) * w, y + ((bx - ax) / l) * w];
    });

    let len = 0;
    const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    line.forEach(([x, y], i) => {
        if (i) len += Math.hypot(x - line[i - 1][0], y - line[i - 1][1]);
        box.left = Math.min(box.left, x);
        box.top = Math.min(box.top, y);
        box.right = Math.max(box.right, x);
        box.bottom = Math.max(box.bottom, y);
    });
    return { d: `M${line.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")}`, len, box };
}
