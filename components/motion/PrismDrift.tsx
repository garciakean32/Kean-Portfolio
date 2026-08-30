"use client";

import Image from "next/image";
import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { motionEnabled } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * PrismDrift — a WebGL split-and-tear glitch, ported from the Framer
 * component of the same name and rewired for this site: the source is a
 * transparent cut-out rather than a filled photo, so sampling is premultiplied
 * and letterboxed (`object-contain`) instead of cover-fit, and the effect fires
 * on its own random cadence instead of on hover.
 *
 * At rest the canvas is a plain resample of the image — zero split, zero grain
 * — so nothing about the portrait changes between bursts.
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
  uniform float uIntensityPx;  // current split distance in pixels
  uniform float uAngle;        // split direction, radians
  uniform float uNoise;        // 0-1, organic jitter + grain amount

  // The two edges the split tears into, and the weights that read a copy's
  // brightness. Cool greys either side of neutral — nothing here is a hue.
  const vec3 LUMA = vec3(0.299, 0.587, 0.114);
  const vec3 ASH = vec3(0.78, 0.82, 0.90);
  const vec3 SMOKE = vec3(0.20, 0.21, 0.25);

  // cheap hash-based pseudo random, used for jitter + film grain
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

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

  void main() {
    vec2 uv = containUv(vUv);
    vec2 dir = vec2(cos(uAngle), sin(uAngle));
    vec2 pxToUv = dir / uResolution;

    // per-copy jitter so the split feels alive rather than a static offset
    float jitterA = (hash(uv * 400.0 + uTime) - 0.5) * uNoise;
    float jitterB = (hash(uv * 400.0 - uTime) - 0.5) * uNoise;

    vec4 colorAhead = sampleImage(uv + pxToUv * uIntensityPx * (1.0 + jitterA));
    vec4 colorCenter = sampleImage(uv);
    vec4 colorBehind = sampleImage(uv - pxToUv * uIntensityPx * (1.0 + jitterB));

    // The split, as ink rather than as a broken signal.
    //
    // The Framer original keeps R from one copy, G from the centre and B from
    // the other, which is a chromatic aberration by construction: the moment
    // the copies part, the edges go magenta and cyan. Here the two outer
    // copies are read as brightness only and laid back over the centre
    // *tinted* — pale ash leading, near-black smoke trailing — so the figure
    // tears into a wet double of itself and no hue is ever invented.
    //
    // Both are differences against the centre, which is what keeps the resting
    // frame honest: at zero split all three samples are identical, both terms
    // vanish, and what is left is a plain resample of the portrait.
    float lumCenter = dot(colorCenter.rgb, LUMA);
    float lumAhead = dot(colorAhead.rgb, LUMA);
    float lumBehind = dot(colorBehind.rgb, LUMA);

    // premultiplied channels, so the widest of the three alphas still bounds
    // every one of them and the fringe fades out on its own
    float alpha = max(colorCenter.a, max(colorAhead.a, colorBehind.a));
    vec3 result = colorCenter.rgb
      + ASH * (lumAhead - lumCenter) * 0.95
      + SMOKE * (lumBehind - lumCenter) * 1.15;

    // fine grain tied to the same noise control, kept inside the silhouette so
    // the empty frame around it stays clean
    float grain = (hash(vUv * uResolution.xy + uTime * 60.0) - 0.5) * uNoise * 0.08;
    result += grain * alpha;

    // Premultiplied colour may never run past its own alpha, and the tinted
    // ghosts above are free to push it there on a hard hit.
    gl_FragColor = vec4(clamp(result, 0.0, alpha), alpha);
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
    /** Max offset of the two ghost copies, in CSS pixels, at a burst peak. */
    intensity?: number;
    /** Same, but used from the `lg` breakpoint up. Defaults to `intensity * 1.8`. */
    desktopIntensity?: number;
    /** Split direction, degrees — each burst jitters around it. */
    angle?: number;
    /** Jitter + grain, 0-1. */
    noise?: number;
    /** Seconds of quiet between bursts; a fresh gap is rolled after each one. */
    minDelay?: number;
    maxDelay?: number;
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
    noise = 0.06,
    minDelay = 0.5,
    maxDelay = 6,
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
    const liveRef = useRef({ intensity, desktopIntensity, angle, noise, minDelay, maxDelay });
    useEffect(() => {
        liveRef.current = { intensity, desktopIntensity, angle, noise, minDelay, maxDelay };
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
            uAngle: gl.getUniformLocation(program, "uAngle"),
            uNoise: gl.getUniformLocation(program, "uNoise"),
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
           Between bursts every frame is identical — no split, no grain, no
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
        burstRef.current = ({ multiplier = 4, distance = 34, duration = 90 } = {}) => {
            const now = performance.now();
            const nudge = pickNudge(distance * 0.6, distance);
            state.megaUntil = now + duration;
            state.megaNextAt = state.megaUntil + rand(15, 25) * 1000;
            state.megaNudgeX = nudge.x;
            state.megaNudgeY = nudge.y;
            state.megaMultiplier = multiplier;
        };

        // keep the drawing surface matched to the element's rendered size
        const resize = () => {
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
            if (!state.visible) {
                state.nextAt = now + rand(live.minDelay, live.maxDelay) * 1000;
                state.megaNextAt = now + rand(15, 25) * 1000;
                return;
            }

            if (now >= state.nextAt) {
                // a burst snaps on and snaps back off within a split second —
                // the gap before the next one is rolled fresh every time, so
                // the cadence never settles
                state.burstUntil = now + rand(40, 90);
                state.nextAt = state.burstUntil + rand(live.minDelay, live.maxDelay) * 1000;
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
                state.megaUntil = now + rand(40, 90);
                state.megaNextAt = state.megaUntil + rand(15, 25) * 1000;
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

            // dips to 90% opacity for the burst, snaps back to 100% the
            // instant it ends — same envelope as the split/grain uniforms
            container.style.opacity = String(1 - mixClamped * 0.1);
            // the nudge snaps to position for the burst and snaps back the
            // instant it ends — no easing — so it reads as a teleport, not a
            // slide. A mega jolt overrides the regular nudge while it's live.
            const nudging = now < state.burstUntil;
            const activeNudgeX = megaActive ? state.megaNudgeX : nudging ? state.nudgeX : 0;
            const activeNudgeY = megaActive ? state.megaNudgeY : nudging ? state.nudgeY : 0;
            container.style.transform = `translate(${activeNudgeX}px, ${activeNudgeY}px)`;

            const intensityPx = megaActive
                ? intensity * state.megaMultiplier
                : intensity * state.mix;

            gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.uniform2f(uniforms.uImageSize, state.imageWidth, state.imageHeight);
            gl.uniform1f(uniforms.uTime, now / 1000);
            gl.uniform1f(uniforms.uIntensityPx, intensityPx * state.dpr);
            gl.uniform1f(uniforms.uAngle, ((live.angle + state.angleJitter) * Math.PI) / 180);
            gl.uniform1f(uniforms.uNoise, live.noise * (megaActive ? 1 : mixClamped));

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        rafId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafId);
            uploadRef.current = null;
            burstRef.current = null;
            container.style.opacity = "";
            container.style.transform = "";
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
