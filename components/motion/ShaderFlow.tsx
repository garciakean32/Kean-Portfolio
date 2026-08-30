"use client";

import { useEffect, useRef } from "react";
import { motionEnabled } from "@/lib/motion";
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
  uniform vec3 uCore;         // the centre of the stroke
  uniform vec3 uAsh;          // the copy that frays ahead of it
  uniform vec3 uSmoke;        // the copy that frays behind it
  uniform vec3 uFar;          // the band set further back

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    // Normalised per axis, not by the shorter side. The original divides both
    // axes by min(width, height), which is fine on a wide desktop band and
    // falls apart on a phone: the element there is very nearly square, so x
    // only ever reached about ±1, the wave had no room to crest and the split
    // (which grows with distance from centre) stayed near zero. Scaling each
    // axis to its own extent makes the band read identically at every width.
    vec2 p = uv * 2.0 - 1.0;

    // Three copies of the same wave, sampled at slightly different x — the
    // original's chromatic split, kept for its shape and stripped of its
    // colour. The offset grows with distance from centre, so the band stays
    // one clean stroke through the middle and only separates at its ends.
    float d = length(p) * uDistortion;
    float lead = uGlow / abs(p.y + sin((p.x * (1.0 + d) + uTime) * uXScale) * uYScale);
    float core = uGlow / abs(p.y + sin((p.x + uTime) * uXScale) * uYScale);
    float trail = uGlow / abs(p.y + sin((p.x * (1.0 - d) + uTime) * uXScale) * uYScale);

    // The band behind: set lower, swinging wider, and travelling the other way
    // at a little over half the speed — the two never line up, which is what
    // keeps the pair from reading as one thick stroke. Both numbers are held
    // where its lowest crest still clears the vertical falloff below, so the
    // fade never eats into the band it is there to protect.
    float far = uGlow * 0.55 / abs(p.y + 0.26 + sin((p.x - uTime * 0.58) * uXScale * 0.6) * uYScale * 1.2);

    // Every lobe is clamped before it is tinted: 1/abs(y) is unbounded at the
    // crest line, and left alone it blows the tint out to white on the one row
    // of pixels that matters most.
    //
    // The centre keeps its white. The two that fray off it are ash and smoke
    // rather than red and blue, so where the stroke separates it reads as wet
    // ink bleeding either side of the line instead of a screen tearing.
    vec3 col = uCore * min(core, 1.3)
      + uAsh * min(lead, 1.15)
      + uSmoke * min(trail, 1.15)
      + uFar * min(far, 1.0);

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

    // Premultiplied: alpha is the brightest channel, so the band carries
    // exactly as much of itself as it is lit and the ground around it stays
    // clear.
    gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
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

/** The palette the band is mixed from: a white core, then ash and smoke either
    side of it, then a dim neutral for the band set further back. All four are
    off the same cool grey axis the rest of the page sits on — nothing here is
    a hue, which is the whole difference between this and the original. */
const CORE: readonly [number, number, number] = [0.93, 0.95, 0.98];
const ASH: readonly [number, number, number] = [0.33, 0.37, 0.45];
const SMOKE: readonly [number, number, number] = [0.19, 0.2, 0.24];
const FAR: readonly [number, number, number] = [0.3, 0.31, 0.35];

type Props = {
    className?: string;
    /** Wave travel, in phase per second. The Framer default works out to about
        0.6; a third of that is half the point of this port. */
    speed?: number;
    /** Master multiplier on the whole band, 0-1. */
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
    opacity = 0.5,
    xScale = 2.2,
    yScale = 0.26,
    distortion = 0.09,
    glow = 0.032,
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

        const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
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
            uCore: gl.getUniformLocation(program, "uCore"),
            uAsh: gl.getUniformLocation(program, "uAsh"),
            uSmoke: gl.getUniformLocation(program, "uSmoke"),
            uFar: gl.getUniformLocation(program, "uFar"),
        };

        // A band-wide fragment shader is the one thing on this page that is
        // genuinely fill-rate bound, and none of what it draws is detail a
        // second device pixel would resolve. Capped well below the portrait.
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        const resize = () => {
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
        gl.uniform3f(uniforms.uCore, CORE[0], CORE[1], CORE[2]);
        gl.uniform3f(uniforms.uAsh, ASH[0], ASH[1], ASH[2]);
        gl.uniform3f(uniforms.uSmoke, SMOKE[0], SMOKE[1], SMOKE[2]);
        gl.uniform3f(uniforms.uFar, FAR[0], FAR[1], FAR[2]);

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);

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
