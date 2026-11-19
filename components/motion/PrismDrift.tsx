"use client";

import Image from "next/image";
import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { motionEnabled, onDprChange, pageCovered } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * PrismDrift — a WebGL glitch through glass, first ported from the Framer
 * component of the same name and rewired for this site: the source is a
 * transparent cut-out rather than a filled photo, so sampling is premultiplied
 * and letterboxed (`object-contain`) instead of cover-fit, and the effect fires
 * on its own random cadence instead of on hover.
 *
 * Each burst snaps the portrait behind rippled glass for a split second — the
 * glass the site's cards sit behind: the figure bends with the ripple, its
 * colours split red one way and blue the other, and its edge catches a glint.
 * The rare jolt is a deeper ripple.
 *
 * At rest the canvas is a plain resample of the image — no ripple, no split,
 * no glint — so nothing about the portrait changes between bursts.
 */

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  varying vec2 vUv;

  uniform vec2 uResolution;    // canvas size in pixels
  uniform sampler2D uTexture;  // the cut-out, premultiplied
  uniform vec2 uImageSize;     // natural size, for contain-fit math
  uniform float uTime;         // seconds
  uniform float uIntensityPx;  // how far the glass splits the colours, in pixels
  uniform float uRipplePx;     // how far the rippled glass bends the figure, in pixels
  uniform float uAngle;        // split direction, radians
  uniform float uGlint;        // the light the glass catches on the figure's edge, 0-1

  // The light the glass catches: the cards' own pale glint.
  const vec3 GLINT = vec3(0.86, 0.9, 0.96);

  // object-contain style UV remap: the whole figure stays in frame, with the
  // letterbox around it left empty rather than smeared out from the edges
  vec2 containUv(vec2 uv) {
    float screenAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 scale = screenAspect > imageAspect
      ? vec2(screenAspect / imageAspect, 1.0)
      : vec2(1.0, imageAspect / screenAspect);
    return (uv - 0.5) * scale + 0.5;
  }

  // outside the image is transparent, not clamped — a branch-free mask keeps
  // the letterbox clear no matter how far a channel drifts
  vec4 sampleImage(vec2 uv) {
    vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
    return texture2D(uTexture, uv) * inside.x * inside.y;
  }

  // The figure at a point of the canvas.
  vec4 figure(vec2 p) { return sampleImage(containUv(p)); }

  void main() {
    vec2 px = 1.0 / uResolution;

    // Rippled glass: a few close swells across the frame — the cards' own
    // slow wave, run quick and tight. At rest it moves nothing.
    vec2 cp = vUv * vec2(uResolution.x / uResolution.y, 1.0) * 4.0;
    vec2 swell = vec2(
      sin(cp.y * 3.6 + uTime * 11.0) + 0.6 * sin(cp.x * 2.8 - uTime * 8.5 + cp.y * 1.5),
      cos(cp.x * 3.4 - uTime * 10.0) + 0.6 * cos(cp.y * 2.6 + uTime * 7.5 - cp.x * 1.3)
    );
    vec2 p = vUv + swell * uRipplePx * px;

    // Through it the colours split, red one way and blue the other, as the
    // cards' glass splits them. Premultiplied, so the widest of the three
    // alphas bounds every channel and the fringe fades out on its own; and
    // at zero split the three are one sample, the portrait as it is.
    vec2 dir = vec2(cos(uAngle), sin(uAngle)) * uIntensityPx * px;
    vec4 r = figure(p + dir);
    vec4 g = figure(p);
    vec4 b = figure(p - dir);
    vec4 c = vec4(r.r, g.g, b.b, max(g.a, max(r.a, b.a)));

    // And the glass catches the light along the figure's edge, glinting
    // where the swell rises.
    if (uGlint > 0.0) {
      vec2 e = px * 2.0;
      float gx = figure(p + vec2(e.x, 0.0)).a - figure(p - vec2(e.x, 0.0)).a;
      float gy = figure(p + vec2(0.0, e.y)).a - figure(p - vec2(0.0, e.y)).a;
      float glint = clamp(length(vec2(gx, gy)), 0.0, 1.0) * (0.55 + 0.45 * swell.x / 1.6) * uGlint * 0.8;
      c = vec4(c.rgb * (1.0 - glint) + GLINT * glint, c.a + glint * (1.0 - c.a));
    }

    gl_FragColor = c;
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

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* At a burst's peak, how far the glass splits the colours and how far its
   ripple bends the figure, as shares of the burst's intensity. */
const SPLIT_SHARE = 0.4;
const RIPPLE_SHARE = 0.5;

// left, right, and the four diagonals — straight up/down reads too much like
// a bounce, so it's left out
const NUDGE_DIRECTIONS: readonly [number, number][] = [
    [-1, 0],
    [1, 0],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
];
const DIAG = Math.SQRT1_2;
// matches Tailwind's `lg` breakpoint, used elsewhere in the hero layout
const DESKTOP_QUERY = "(min-width: 1024px)";
const pickNudge = (minDistance = 2, maxDistance = 7) => {
    const [dx, dy] = NUDGE_DIRECTIONS[Math.floor(Math.random() * NUDGE_DIRECTIONS.length)];
    const distance = rand(minDistance, maxDistance);
    const norm = dx !== 0 && dy !== 0 ? DIAG : 1;
    return { x: dx * distance * norm, y: dy * distance * norm };
};

/* How long a burst lasts, in milliseconds, the rare jolt's included: a
   split second, there and gone. */
const BURST_MS: readonly [number, number] = [28, 55];
const JOLT_MS: readonly [number, number] = [30, 60];

/** A burst of the component's own, as it fires: how long it lasts, in
    milliseconds, and whether it is the rare deeper jolt. */
export type PrismDriftBurst = { duration: number; big: boolean };

/** A burst the page can fire itself, on top of the component's own cadence. */
export type PrismDriftHandle = {
    burst: (options?: { multiplier?: number; distance?: number; duration?: number }) => void;
};

type Props = {
    src: string;
    sizes?: string;
    priority?: boolean;
    /** Applied to the underlying image — the canvas always matches its box. */
    className?: string;
    /** A burst's strength at its peak, in CSS pixels — the colours split by
        `SPLIT_SHARE` of it, the ripple bends by `RIPPLE_SHARE`. */
    intensity?: number;
    /** Same, but used from the `lg` breakpoint up. Defaults to `intensity * 1.8`. */
    desktopIntensity?: number;
    /** Split direction, degrees — each burst jitters around it. */
    angle?: number;
    /** Seconds of quiet between bursts; a fresh gap is rolled after each one. */
    minDelay?: number;
    maxDelay?: number;
    /** Told as each of the component's own bursts fires — not one fired
        through the handle — so what is round the portrait can glitch with it. */
    onBurst?: (burst: PrismDriftBurst) => void;
    /** Handle for firing a burst from outside — see `PrismDriftHandle`. */
    ref?: Ref<PrismDriftHandle>;
};

export default function PrismDrift({
    src,
    sizes,
    priority,
    className,
    intensity = 14,
    desktopIntensity = intensity * 1.8,
    angle = 20,
    minDelay = 0.5,
    maxDelay = 6,
    onBurst,
    ref,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    // set by the GL effect once the context is live; the image's load handler
    // calls it too, so whichever of the two lands second uploads the texture
    const uploadRef = useRef<(() => void) | null>(null);
    // same idea for the imperative burst: the closure that can reach the
    // render loop's state only exists while the GL effect is mounted
    const burstRef = useRef<PrismDriftHandle["burst"] | null>(null);
    useImperativeHandle(ref, () => ({ burst: (options) => burstRef.current?.(options) }), []);
    // read every frame by the draw loop, kept out of React state so a
    // breakpoint crossing never triggers a re-render
    const isDesktopRef = useRef(false);
    // the canvas only takes over once it is actually drawing the portrait —
    // without WebGL or a texture the plain image stays exactly as it is
    const [ready, setReady] = useState(false);

    // live-updating ref so the render loop always reads the latest values
    // without tearing down and rebuilding the WebGL context. Written after
    // paint rather than during render — the loop reads it on the next frame
    // either way, and a ref written mid-render is a bug waiting for
    // concurrent rendering to find it.
    const liveRef = useRef({ intensity, desktopIntensity, angle, minDelay, maxDelay, onBurst });
    useEffect(() => {
        liveRef.current = { intensity, desktopIntensity, angle, minDelay, maxDelay, onBurst };
    });

    useEffect(() => {
        if (!motionEnabled()) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

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
            uTexture: gl.getUniformLocation(program, "uTexture"),
            uImageSize: gl.getUniformLocation(program, "uImageSize"),
            uTime: gl.getUniformLocation(program, "uTime"),
            uIntensityPx: gl.getUniformLocation(program, "uIntensityPx"),
            uRipplePx: gl.getUniformLocation(program, "uRipplePx"),
            uAngle: gl.getUniformLocation(program, "uAngle"),
            uGlint: gl.getUniformLocation(program, "uGlint"),
        };

        // 1x1 placeholder so unit 0 is valid before the image finishes loading
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 0])
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        const state = {
            hasImage: false,
            imageWidth: 1,
            imageHeight: 1,
            mix: 0,
            peak: 1,
            angleJitter: 0,
            nudgeX: 0,
            nudgeY: 0,
            burstUntil: 0,
            nextAt: 0,
            visible: true,
            dpr: Math.min(window.devicePixelRatio || 1, 2),
            // a rare, much bigger jolt on its own schedule — every 15-25s,
            // over in a split second, independent of the regular bursts above
            megaUntil: 0,
            megaNextAt: performance.now() + rand(15, 25) * 1000,
            megaNudgeX: 0,
            megaNudgeY: 0,
            megaMultiplier: 1,
        };

        /* Whether the picture on screen still matches what the uniforms say.
           Between bursts every frame is identical — no ripple, no split, no
           nudge — so the resting frame is drawn once and then the GPU is left
           alone until something actually changes it. Anything that invalidates
           what is on the canvas sets this. */
        let needsDraw = true;

        // the rendered <img> is same-origin and already decoded, so it doubles
        // as the texture source — no second download of the portrait
        const upload = () => {
            const img = imgRef.current;
            if (!img || !img.complete || !img.naturalWidth) return;

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            state.hasImage = true;
            state.imageWidth = img.naturalWidth;
            state.imageHeight = img.naturalHeight;
            needsDraw = true;
            setReady(true);
        };
        uploadRef.current = upload;
        upload();

        // The mega jolt, on demand — the hero's reveal drives its own run of
        // them rather than waiting on the component's 15-25s schedule. It
        // borrows the same path, so an ambient jolt cannot land on top of one
        // of these: the next one is pushed out of the way here too.
        burstRef.current = ({ multiplier = 4, distance = 34, duration = JOLT_MS[1] } = {}) => {
            const now = performance.now();
            const nudge = pickNudge(distance * 0.6, distance);
            state.megaUntil = now + duration;
            state.megaNextAt = state.megaUntil + rand(15, 25) * 1000;
            state.megaNudgeX = nudge.x;
            state.megaNudgeY = nudge.y;
            state.megaMultiplier = multiplier;
        };

        // keep the drawing surface matched to the element's rendered size —
        // and to the density of the screen it is currently on, which changes
        // on its own when the window is dragged between two of them.
        const resize = () => {
            state.dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = container.getBoundingClientRect();
            const w = Math.max(1, Math.round(rect.width * state.dpr));
            const h = Math.max(1, Math.round(rect.height * state.dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
                // Resizing the drawing buffer clears it.
                needsDraw = true;
            }
        };
        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        // A density change moves no CSS pixel, so the observer above never
        // hears it.
        const stopDprWatch = onDprChange(resize);

        // no point glitching a portrait nobody is looking at
        const intersectionObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) state.visible = entry.isIntersecting;
        });
        intersectionObserver.observe(container);

        const desktopQuery = window.matchMedia(DESKTOP_QUERY);
        isDesktopRef.current = desktopQuery.matches;
        const handleDesktopChange = (e: MediaQueryListEvent) => {
            isDesktopRef.current = e.matches;
        };
        desktopQuery.addEventListener("change", handleDesktopChange);

        let rafId = 0;

        const draw = (now: number) => {
            rafId = requestAnimationFrame(draw);

            if (!state.hasImage) return;

            const live = liveRef.current;
            const intensity = isDesktopRef.current ? live.desktopIntensity : live.intensity;

            // off-screen: keep pushing both schedules out so the portrait is
            // never mid-glitch the moment it scrolls back into frame
            if (!state.visible || pageCovered()) {
                state.nextAt = now + rand(live.minDelay, live.maxDelay) * 1000;
                state.megaNextAt = now + rand(15, 25) * 1000;
                return;
            }

            if (now >= state.nextAt) {
                // a burst snaps on and snaps back off within a split second —
                // the gap before the next one is rolled fresh every time, so
                // the cadence never settles
                state.burstUntil = now + rand(BURST_MS[0], BURST_MS[1]);
                state.nextAt = state.burstUntil + rand(live.minDelay, live.maxDelay) * 1000;
                live.onBurst?.({ duration: state.burstUntil - now, big: false });
                state.angleJitter = rand(-25, 25);
                state.peak = rand(0.55, 1.35);
                // a little nudge — left, right, or one of the four diagonals
                // — varying in distance each burst so it doesn't feel
                // mechanical
                const nudge = pickNudge();
                state.nudgeX = nudge.x;
                state.nudgeY = nudge.y;
            }

            if (now >= state.megaNextAt) {
                // a rare, much bigger jolt — same directions, way more
                // distance, over in a split second at full strength (no ease
                // in/out, it's just there and then it's gone)
                state.megaUntil = now + rand(JOLT_MS[0], JOLT_MS[1]);
                state.megaNextAt = state.megaUntil + rand(15, 25) * 1000;
                live.onBurst?.({ duration: state.megaUntil - now, big: true });
                const bigNudge = pickNudge(24, 42);
                state.megaNudgeX = bigNudge.x;
                state.megaNudgeY = bigNudge.y;
                state.megaMultiplier = rand(3, 5);
            }

            // hard on/off, same as the mega jolt below — no eased decay, so
            // the whole burst reads as a snap rather than a fade
            state.mix = now < state.burstUntil ? state.peak : 0;

            const mixClamped = Math.min(state.mix, 1);
            const megaActive = now < state.megaUntil;

            // Nothing is happening and the resting frame is already on the
            // canvas: the schedules above still tick, but there is no reason
            // to hand the GPU the same picture sixty times a second.
            const settled = mixClamped === 0 && !megaActive;
            if (settled && !needsDraw) return;
            needsDraw = !settled;

            // The portrait never fades for a burst: glass bends it and splits
            // it, but it stays whole. The nudge snaps to position for the
            // burst and snaps back the instant it ends — no easing — so it
            // reads as a teleport, not a slide. A mega jolt overrides the
            // regular nudge while it's live.
            const nudging = now < state.burstUntil;
            const activeNudgeX = megaActive ? state.megaNudgeX : nudging ? state.nudgeX : 0;
            const activeNudgeY = megaActive ? state.megaNudgeY : nudging ? state.nudgeY : 0;
            container.style.transform = `translate(${activeNudgeX}px, ${activeNudgeY}px)`;

            // The burst's strength: the jolt's own, deeper, while it lasts.
            const intensityPx = megaActive
                ? intensity * state.megaMultiplier
                : intensity * state.mix;

            gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.uniform2f(uniforms.uImageSize, state.imageWidth, state.imageHeight);
            gl.uniform1f(uniforms.uTime, now / 1000);
            gl.uniform1f(uniforms.uIntensityPx, intensityPx * SPLIT_SHARE * state.dpr);
            gl.uniform1f(uniforms.uRipplePx, intensityPx * RIPPLE_SHARE * state.dpr);
            gl.uniform1f(uniforms.uAngle, ((live.angle + state.angleJitter) * Math.PI) / 180);
            gl.uniform1f(uniforms.uGlint, megaActive ? 1 : mixClamped);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        rafId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafId);
            uploadRef.current = null;
            burstRef.current = null;
            container.style.transform = "";
            stopDprWatch();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            desktopQuery.removeEventListener("change", handleDesktopChange);
            gl.deleteProgram(program);
            gl.deleteTexture(texture);
            gl.deleteBuffer(positionBuffer);
            setReady(false);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative h-full w-full">
            <Image
                ref={imgRef}
                src={src}
                alt=""
                fill
                priority={priority}
                sizes={sizes}
                onLoad={() => uploadRef.current?.()}
                className={cn(className, ready && "opacity-0")}
            />
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                className={cn("absolute inset-0 block h-full w-full", !ready && "opacity-0")}
            />
        </div>
    );
}
