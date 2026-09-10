"use client";

import { useEffect, useRef } from "react";
import { motionEnabled, onDprChange } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * ShaderFlow — a WebGL wave band, ported from the Framer component of the same
 * name and retuned for this site.
 *
 * The original is a neon RGB-split ribbon on black, moving fast and reading as
 * loud as it sounds. Three things make it belong here instead: the channels are
 * tinted rather than left as pure red/green/blue, so the band lands in the same
 * dimmed blue and grey the rest of the page is held to; a second, slower band
 * sits behind the first, which turns one ribbon into depth; and every number
 * that governs its energy — speed, glow, amplitude, split — is a fraction of
 * what it shipped with, so it reads as light moving behind the figure rather
 * than a graphic in front of it.
 *
 * It draws on transparent ground and carries no colour where the wave is not,
 * so it composites straight onto the hero backdrop.
 */

const VERTEX_SHADER = `
  attribute vec2 aPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec2 uResolution;   // canvas size in pixels
  uniform float uTime;        // accumulated phase, already scaled by speed
  uniform float uXScale;      // how many crests fit across the band
  uniform float uYScale;      // how far the band swings, in band-halves
  uniform float uDistortion;  // chromatic split, radial
  uniform float uGlow;        // core brightness — the falloff numerator
  uniform float uOpacity;     // master, applied after everything
  uniform vec3 uWhite;        // the brightest of the four strokes
  uniform vec3 uDarkWhite;    // one step down
  uniform vec3 uLightBlack;   // one step further
  uniform vec3 uBlack;        // the last of them, barely lit

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    // Normalised per axis, not by the shorter side. The original divides both
    // axes by min(width, height), which is fine on a wide desktop band and
    // falls apart on a phone: the element there is very nearly square, so x
    // only ever reached about ±1, the wave had no room to crest and the split
    // (which grows with distance from centre) stayed near zero. Scaling each
    // axis to its own extent makes the band read identically at every width.
    vec2 p = uv * 2.0 - 1.0;

    // Four strokes, and they are four waves rather than four copies of one.
    // This used to be a single line with two frayed copies either side of it
    // plus a dimmer band behind — a chromatic split, kept from the original
    // for its shape. That reads as one stroke with a wet edge, which is one
    // stroke. These have their own offsets down the frame, their own crest
    // counts and their own speeds, and no two of the speeds divide into each
    // other, so the set never lines up into a thicker single line.
    //
    // The fray is kept, but only where it earns its keep: the split grows
    // with distance from the centre, so it is applied to the two brightest
    // strokes and with opposite sign, and only their ends separate.
    float d = length(p) * uDistortion;

    float white = uGlow / abs(
      p.y - 0.20 + sin((p.x * (1.0 + d) + uTime) * uXScale) * uYScale);

    float darkWhite = uGlow * 0.86 / abs(
      p.y - 0.03 + sin((p.x * (1.0 - d) - uTime * 0.73) * uXScale * 0.82) * uYScale * 1.1);

    float lightBlack = uGlow * 0.72 / abs(
      p.y + 0.16 + sin((p.x + uTime * 0.51) * uXScale * 1.27) * uYScale * 0.92);

    float black = uGlow * 0.62 / abs(
      p.y + 0.33 + sin((p.x - uTime * 0.37) * uXScale * 0.64) * uYScale * 1.25);

    // Every lobe is clamped before it is tinted: 1/abs(y) is unbounded at the
    // crest line, and left alone it blows the tint out to white on the one row
    // of pixels that matters most — which would make all four the same colour
    // exactly where the difference between them is the point.
    vec3 col = uWhite * min(white, 1.3)
      + uDarkWhite * min(darkWhite, 1.15)
      + uLightBlack * min(lightBlack, 1.05)
      + uBlack * min(black, 1.0);

    // Nothing touches the frame, on either axis, and the vertical half of that
    // is not cosmetic — it is what stops the element being visible as an
    // element. Every lobe here is a 1/abs(y) falloff, which never actually
    // reaches zero: at the top and bottom of the canvas each one is still
    // putting out a few percent of grey, and a few percent of grey that stops
    // dead at a straight line is a rectangle sitting on the hero, which is
    // exactly what it looked like. Fading to nothing before the edge is
    // reached leaves light with nowhere it visibly ends.
    //
    // Sideways the falloff is kept narrow on purpose: on a phone a wide one
    // leaves almost no band at all.
    float edge = smoothstep(0.0, 0.2, uv.x)
      * smoothstep(1.0, 0.8, uv.x)
      * smoothstep(1.0, 0.7, abs(p.y));
    col = min(col * edge * uOpacity, vec3(1.0));

    // Opaque, ground and all. This used to write its own brightness into the
    // alpha channel, so the strokes were a wash the hero's black showed
    // through and every one of them was quietly diluted by whatever it was
    // laid over. The ground it needs is black, and the section is already
    // painted black, so the honest thing is to draw that black rather than
    // leave a hole where it should be: the strokes land at their own strength
    // and the frame around them is the same colour it was pretending to be.
    gl_FragColor = vec4(col, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl: WebGLRenderingContext) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    return program;
}

/** The four tones the site is built from, and now the four strokes: white,
    dark white, light black, black. They are the same values as `--ink`,
    `--ink-2`, `--paper-3` and `--paper` in globals.css, read as light rather
    than as surfaces — this is additive over a black ground, so the two dark
    ones are not dark paint but dim light, and they read as the smoke the two
    bright ones are throwing rather than as lines of their own until you look
    for them. Nothing here is a hue, which is the whole difference between this
    and the original. */
const WHITE: readonly [number, number, number] = [1.0, 1.0, 1.0];
const DARK_WHITE: readonly [number, number, number] = [0.75, 0.75, 0.75];
const LIGHT_BLACK: readonly [number, number, number] = [0.28, 0.28, 0.29];
const BLACK: readonly [number, number, number] = [0.11, 0.11, 0.12];

type Props = {
    className?: string;
    /** Wave travel, in phase per second. The Framer default works out to about
        0.6; a third of that is half the point of this port. */
    speed?: number;
    /** Master multiplier on the strokes, 0-1. Not on the ground, which is
        black either way — this is how hard the light is driven. It sat at 0.5
        while the strokes were a transparent wash and the hero's black was
        showing through them; opaque, the same figure reads far hotter, so it
        is held a little over it rather than at the full drive the change made
        available. */
    opacity?: number;
    /** Crests across the band, which is now the full width at every size. */
    xScale?: number;
    /** Swing, as a fraction of half the band height. */
    yScale?: number;
    /** How far the ash and smoke copies fray off the core at the ends. */
    distortion?: number;
    /** Stroke weight — the numerator of the inverse-distance falloff, and so
        also very nearly the half-thickness of the core in band-halves. */
    glow?: number;
};

export default function ShaderFlow({
    className,
    speed = 0.2,
    opacity = 0.62,
    xScale = 2.2,
    yScale = 0.26,
    distortion = 0.09,
    glow = 0.034,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Live-updating ref so the loop always reads the latest props without the
    // GL context being torn down and rebuilt — same arrangement as PrismDrift.
    const liveRef = useRef({ speed, opacity, xScale, yScale, distortion, glow });
    useEffect(() => {
        liveRef.current = { speed, opacity, xScale, yScale, distortion, glow };
    });

    useEffect(() => {
        if (!motionEnabled()) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // No alpha channel at all: the shader writes every pixel of every
        // frame and the ground it writes is opaque black, so a channel for
        // "how much of this is really here" is one the compositor would only
        // ever be told 1 in.
        const gl = canvas.getContext("webgl", { alpha: false });
        if (!gl) return;

        const program = createProgram(gl);
        if (!program) return;

        gl.useProgram(program);

        // full-screen triangle strip
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        );
        const aPosition = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const uniforms = {
            uResolution: gl.getUniformLocation(program, "uResolution"),
            uTime: gl.getUniformLocation(program, "uTime"),
            uXScale: gl.getUniformLocation(program, "uXScale"),
            uYScale: gl.getUniformLocation(program, "uYScale"),
            uDistortion: gl.getUniformLocation(program, "uDistortion"),
            uGlow: gl.getUniformLocation(program, "uGlow"),
            uOpacity: gl.getUniformLocation(program, "uOpacity"),
            uWhite: gl.getUniformLocation(program, "uWhite"),
            uDarkWhite: gl.getUniformLocation(program, "uDarkWhite"),
            uLightBlack: gl.getUniformLocation(program, "uLightBlack"),
            uBlack: gl.getUniformLocation(program, "uBlack"),
        };

        // A band-wide fragment shader is the one thing on this page that is
        // genuinely fill-rate bound, and none of what it draws is detail a
        // second device pixel would resolve. Capped well below the portrait.
        //
        // Read per resize rather than once: the ratio changes when the window
        // is dragged to a screen of a different density, and a buffer sized
        // against the old one is the wrong size until the page is reloaded.
        const density = () => Math.min(window.devicePixelRatio || 1, 1.5);

        const resize = () => {
            const dpr = density();
            const rect = canvas.getBoundingClientRect();
            const w = Math.max(1, Math.round(rect.width * dpr));
            const h = Math.max(1, Math.round(rect.height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
            // Unconditional, so the very first call seeds it whatever the
            // canvas happened to start at — the shader divides by it.
            gl.uniform2f(uniforms.uResolution, w, h);
        };
        resize();

        // The four tints never change, and the resolution only does when the
        // element is resized. Uploaded once here rather than on every frame
        // with the handful that actually animate — five uniform writes a frame
        // is not what makes this expensive, but there is no reason to do them.
        gl.uniform3f(uniforms.uWhite, WHITE[0], WHITE[1], WHITE[2]);
        gl.uniform3f(uniforms.uDarkWhite, DARK_WHITE[0], DARK_WHITE[1], DARK_WHITE[2]);
        gl.uniform3f(uniforms.uLightBlack, LIGHT_BLACK[0], LIGHT_BLACK[1], LIGHT_BLACK[2]);
        gl.uniform3f(uniforms.uBlack, BLACK[0], BLACK[1], BLACK[2]);

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);

        // A density change moves no CSS pixel, so neither the observer above
        // nor a `resize` listener would ever hear it.
        const stopDprWatch = onDprChange(resize);

        let visible = true;
        const intersectionObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) visible = entry.isIntersecting;
        });
        intersectionObserver.observe(canvas);

        // A WebGL canvas is the one thing in the hero that the browser gives a
        // compositing layer of its own — the portrait's is folded into the
        // drop-shadow filter on its wrapper, which is why only this one ever
        // showed the fault. On a reload that layer is released a beat before
        // the next document paints, and for those few frames the region it
        // occupied is not backed by anything the old page still holds: what
        // came through was the browser's own base white, a bright rectangle
        // sitting exactly where the band had been.
        //
        // Taking the canvas out of the paint on `pagehide` retires the layer
        // while the page around it is still whole, so the hero's own ground is
        // what is left in its place. `pageshow` puts it back, which matters for
        // a back/forward restore, where the document is not rebuilt and this
        // effect never runs again.
        const hide = () => {
            canvas.style.visibility = "hidden";
        };
        const show = () => {
            canvas.style.visibility = "";
        };
        window.addEventListener("pagehide", hide);
        window.addEventListener("pageshow", show);

        // The context can be taken away at any time — a GPU reset, too many
        // live contexts on one page. Without this the loop keeps calling into
        // a dead context every frame for the life of the page. Preventing the
        // default is what makes a restore possible at all; the loop is
        // restarted from the handler on the other side of it.
        let lost = false;
        const onLost = (event: Event) => {
            event.preventDefault();
            lost = true;
        };
        const onRestored = () => {
            lost = false;
        };
        canvas.addEventListener("webglcontextlost", onLost);
        canvas.addEventListener("webglcontextrestored", onRestored);

        // Phase is accumulated rather than read off the clock: a band that is
        // scrolled past, or a tab left in the background, comes back where it
        // was rather than wherever a dropped minute of wall time put it.
        let phase = 0;
        let last = performance.now();
        let rafId = 0;

        const draw = (now: number) => {
            rafId = requestAnimationFrame(draw);

            const delta = Math.min((now - last) / 1000, 0.05);
            last = now;
            if (!visible || lost) return;

            const live = liveRef.current;
            phase += delta * live.speed;

            gl.uniform1f(uniforms.uTime, phase);
            gl.uniform1f(uniforms.uXScale, live.xScale);
            gl.uniform1f(uniforms.uYScale, live.yScale);
            gl.uniform1f(uniforms.uDistortion, live.distortion);
            gl.uniform1f(uniforms.uGlow, live.glow);
            gl.uniform1f(uniforms.uOpacity, live.opacity);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        rafId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafId);
            stopDprWatch();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            window.removeEventListener("pagehide", hide);
            window.removeEventListener("pageshow", show);
            canvas.removeEventListener("webglcontextlost", onLost);
            canvas.removeEventListener("webglcontextrestored", onRestored);
            canvas.style.visibility = "";
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={cn("pointer-events-none block h-full w-full", className)}
        />
    );
}
