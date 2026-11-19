"use client";

import { useEffect } from "react";
import { GLASS_BEND, GLASS_FROST, GLASS_PAD, GLASS_RIM } from "@/lib/glass";
import { getLenis } from "@/lib/lenis";
import { gsap, motionEnabled } from "@/lib/motion";

/* The white's edge as it spreads, like water: how far it swells either side
   of a circle at most — a share of how far it has spread, and never more
   than so many CSS pixels — and the swells themselves: how many go round it,
   how fast each drifts round, and how much each counts. The rim's shader
   below runs the very same, so its glass sits on the edge the page is cut
   to. */
const SWELL_SHARE = 0.08;
const SWELL_MAX = 30;
const SWELLS: readonly (readonly [number, number, number])[] = [
    [3, 2.3, 0.6],
    [5, -3.1, 0.4],
];
/* How many points the page's cut follows its edge through. */
const EDGE_POINTS = 120;
/* How far apart the glass splits blue from pink either side of the white,
   in CSS pixels — the landing's own frames' two colours. */
const SPLIT = 2.5;

const swellAt = (a: number, t: number) =>
    SWELLS.reduce((sum, [lobes, drift, weight]) => sum + weight * Math.sin(lobes * a + drift * t), 0);

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() { vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

/* In the drawing buffer's pixels, y down; colours out premultiplied, so
   where nothing is drawn the page shows through. */
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform vec2 uCentre;
uniform float uRadius;
uniform float uSwell;
uniform float uTime;
uniform float uPx;
uniform float uPad;
uniform float uRim;
uniform float uBend;
uniform float uFrost;
uniform float uSplit;
varying vec2 vUv;

const vec3 BLUE = vec3(0.0, 0.616, 1.0);
const vec3 PINK = vec3(1.0, 0.251, 0.627);
const vec3 LINE = vec3(0.64, 0.66, 0.69);

float sq(float v) { return v * v; }

vec4 over(vec4 top, vec4 under) {
  return vec4(top.rgb + under.rgb * (1.0 - top.a), top.a + under.a * (1.0 - top.a));
}

// How far out past the white's swelling edge a point is.
float edge(vec2 p) {
  vec2 q = p - uCentre;
  float a = atan(q.y, q.x);
  return length(q) - (uRadius + uSwell * (${SWELLS.map(
      ([lobes, drift, weight]) => `${weight.toFixed(2)} * sin(${lobes.toFixed(1)} * a + ${drift.toFixed(2)} * uTime)`
  ).join(" + ")}));
}

// The white at a point, and a little frosted: r pixels of soft round it.
float white(vec2 p) { return 1.0 - smoothstep(-uPx, uPx, edge(p)); }
float frosted(vec2 p, float r) {
  if (r < 0.3) return white(p);
  return (white(p) + white(p + vec2(r, 0.0)) + white(p - vec2(r, 0.0)) +
          white(p + vec2(0.0, r)) + white(p - vec2(0.0, r))) / 5.0;
}

void main() {
  vec2 p = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);
  // The frame of glass round the white, the cards' own: a rounded bead of
  // glass standing out from its edge, uPad out at its outer edge and
  // reaching a few pixels back in over the white.
  float d = edge(p) - uPad;
  if (d >= 0.0 || d <= -uRim) {
    gl_FragColor = vec4(0.0);
    return;
  }
  // Its rim bends the white's edge out into it, frosted a little, and the
  // light splits blue to one side and pink to the other; one fine grey line
  // runs along its outer edge, a slow glint going round it.
  float bead = sin(-d / uRim * 3.14159265);
  vec2 off = -normalize(p - uCentre + 1e-4) * bead * uBend;
  float fr = uFrost * bead;
  vec2 q = p + off;
  vec4 c = vec4(PINK, 1.0) * frosted(q - vec2(uSplit, 0.0), fr) * 0.5;
  c = over(vec4(BLUE, 1.0) * frosted(q + vec2(uSplit, 0.0), fr) * 0.6, c);
  c = over(vec4(frosted(q, fr)), c);
  float glint = 0.45 + 0.55 * sin(atan(p.y - uCentre.y, p.x - uCentre.x) * 3.0 - uTime * 1.1);
  float line = exp(-sq((d + uPx) / (0.85 * uPx))) * 0.45 * glint;
  gl_FragColor = over(vec4(LINE * line, line), c);
}
`;

/**
 * The glass round the white's edge while it spreads: one canvas over the
 * whole screen, for as long as the spread lasts, drawing nothing but the rim
 * — the page under it is never bent, only the white's own edge. Null where
 * WebGL cannot be had; the white spreads on its own then.
 */
function glassRim(x: number, y: number) {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    const shader = (type: number, source: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = shader(gl.VERTEX_SHADER, VERTEX);
    const fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.setAttribute("aria-hidden", "true");
    // Over the page it opens, the page's own z-index and one more.
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:111";
    gl.viewport(0, 0, canvas.width, canvas.height);
    document.body.appendChild(canvas);

    const at = (name: string) => gl.getUniformLocation(program, name);
    gl.uniform2f(at("uRes"), canvas.width, canvas.height);
    gl.uniform2f(at("uCentre"), x * dpr, y * dpr);
    gl.uniform1f(at("uPx"), dpr);
    gl.uniform1f(at("uPad"), GLASS_PAD * dpr);
    gl.uniform1f(at("uRim"), GLASS_RIM * dpr);
    gl.uniform1f(at("uBend"), GLASS_BEND * dpr);
    gl.uniform1f(at("uFrost"), GLASS_FROST * dpr);
    gl.uniform1f(at("uSplit"), SPLIT * dpr);
    const radius = at("uRadius");
    const swell = at("uSwell");
    const time = at("uTime");

    return {
        draw: (r: number, s: number, t: number) => {
            gl.uniform1f(radius, r * dpr);
            gl.uniform1f(swell, s * dpr);
            gl.uniform1f(time, t);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },
        destroy: () => {
            gl.deleteProgram(program);
            gl.deleteBuffer(buffer);
            gl.getExtension("WEBGL_lose_context")?.loseContext();
            canvas.remove();
        },
    };
}

/**
 * The white spreading out of a button until it covers the screen, or folding
 * back down into it — how the experience page and the works page both open
 * and close, from wherever the button is on screen.
 *
 * It spreads like water: a circle about the button's centre, its edge
 * swelling and drifting as it goes, from a point to past the screen's
 * farthest corner, wearing the cards' own glass round its edge — see
 * `glassRim`. Opening, the button fades from under it and the page's own
 * content (`inner`) rises in once the white is nearly all there; closing
 * runs it backwards into the button.
 */
export function spread(
    way: "open" | "close",
    { page, inner, button }: { page: HTMLElement; inner: HTMLElement; button: HTMLElement },
    onComplete: () => void
) {
    const b = button.getBoundingClientRect();
    const x = b.left + b.width / 2;
    const y = b.top + b.height / 2;
    // Past the farthest corner by the deepest swell and the glass round it,
    // so neither the cut nor the rim is left anywhere on the screen.
    const far =
        Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + SWELL_MAX + GLASS_PAD;

    const rim = motionEnabled() ? glassRim(x, y) : null;
    const from = performance.now();
    const shape = { r: way === "open" ? 0 : far };
    const place = () => {
        const t = (performance.now() - from) / 1000;
        const s = Math.min(shape.r * SWELL_SHARE, SWELL_MAX);
        const points: string[] = [];
        for (let i = 0; i < EDGE_POINTS; i++) {
            const a = (i / EDGE_POINTS) * Math.PI * 2;
            const reach = Math.max(0, shape.r + s * swellAt(a, t));
            points.push(`${(x + Math.cos(a) * reach).toFixed(1)}px ${(y + Math.sin(a) * reach).toFixed(1)}px`);
        }
        page.style.clipPath = `polygon(${points.join(",")})`;
        rim?.draw(shape.r, s, t);
    };
    const done = () => rim?.destroy();
    place();

    const tl =
        way === "open"
            ? gsap
                  .timeline({
                      onComplete: () => {
                          done();
                          // Fully open: drop the cut, so turning a phone to
                          // landscape cannot leave a corner uncovered.
                          gsap.set(page, { clipPath: "none" });
                          onComplete();
                      },
                      onInterrupt: done,
                  })
                  .to(button, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, 0)
                  .to(shape, { r: far, duration: 0.9, ease: "power3.inOut", onUpdate: place }, 0.05)
                  .fromTo(
                      inner,
                      { autoAlpha: 0, y: 16 },
                      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
                      0.75
                  )
            : gsap
                  .timeline({
                      onComplete: () => {
                          done();
                          onComplete();
                      },
                      onInterrupt: done,
                  })
                  .to(inner, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 0)
                  .to(shape, { r: 0, duration: 0.75, ease: "power3.inOut", onUpdate: place }, 0.1)
                  .to(button, { autoAlpha: 1, duration: 0.35, ease: "power2.out" }, 0.6);

    if (!motionEnabled()) tl.progress(1);
    return tl;
}

/**
 * While a page is up over the site, the site behind it is still, inert, and
 * out of reach. `overscroll-behavior` too: without it a drag down on a phone
 * still pulls the whole page (and, on Android, reloads it).
 */
export function useHoldPage(active: boolean, page: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        if (!active) return;
        const html = document.documentElement;
        const lenis = getLenis();
        const behind = Array.from(document.body.children).filter(
            (el): el is HTMLElement => el instanceof HTMLElement && el !== page.current
        );

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
    }, [active, page]);
}
