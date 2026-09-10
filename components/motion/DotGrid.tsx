"use client";

import { useEffect, useRef } from "react";
import { motionEnabled, onDprChange } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * DotGrid — a field of dots that answers the cursor.
 *
 * An even grid, drawn small and dim. A slow wave travels across it so the
 * field is alive on a phone, where there is no cursor to answer; under the
 * cursor the dots nearest it swell, brighten and lean away, falling off to
 * nothing at `REACH`. Nothing here is a layout: it is one canvas and every dot
 * is an arc on it, so the cost is the same whether there are two hundred of
 * them or two thousand.
 *
 * It carries no ground of its own. The canvas is transparent and the section
 * it sits in paints the black behind it, which is what keeps the divider the
 * same surface as the rest of the region rather than a panel laid on top of
 * one. The dots take their colour from the element's own `color`, so a light
 * panel would invert them without this knowing anything about it.
 *
 * The loop runs only while the field is on screen — an `IntersectionObserver`
 * stops it otherwise — and with motion off it is not a loop at all: the grid
 * is drawn once, at rest, and the pointer is never listened for.
 */

/** Distance between dots, in CSS pixels. */
const GAP = 26;

/** How far the cursor is felt, and how hard, at the centre of that reach. */
const REACH = 150;
const SWELL = 2.7;
const LEAN = 7;

/** The dot at rest, and what the travelling wave adds to it. */
const BASE_RADIUS = 1;
const BASE_ALPHA = 0.2;
const WAVE_RADIUS = 0.65;
const WAVE_ALPHA = 0.16;

/** Per-frame easing on the cursor's position and on its strength — the field
    should follow a fast pointer rather than snap to it, and should let go
    gently when it leaves. Fast enough to read as an answer: a quarter of a
    second to full strength, which is about as long as a cursor can be over
    something before a response stops feeling like one. */
const TRACK = 0.22;
const FADE = 0.18;

export default function DotGrid({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animate = motionEnabled();

        // The dots are painted in the element's own colour, read once per
        // resize rather than per frame — it only changes with the theme, and
        // the theme only changes with a re-render.
        let rgb = "255,255,255";
        let width = 0;
        let height = 0;

        // Read per resize, not once: dragging the window to a screen of a
        // different density changes the ratio without changing the element's
        // CSS size, and a backing store sized against the old one stays blurry
        // (or needlessly heavy) until the page is reloaded.
        const density = () => Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            const dpr = density();
            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, Math.round(rect.width));
            height = Math.max(1, Math.round(rect.height));
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const parsed = getComputedStyle(canvas).color.match(/\d+/g);
            if (parsed && parsed.length >= 3) rgb = parsed.slice(0, 3).join(",");
        };

        /* The cursor, and how much of it the field is currently feeling.
           `strength` is what decays when it leaves, so the release is the same
           gesture as the arrival played backwards. */
        const cursor = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, target: 0 };

        const draw = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            // Centred, so the grid meets both edges evenly whatever the box is.
            const cols = Math.floor(width / GAP);
            const rows = Math.floor(height / GAP);
            const originX = (width - cols * GAP) / 2 + GAP / 2;
            const originY = (height - rows * GAP) / 2 + GAP / 2;

            for (let row = 0; row <= rows; row++) {
                for (let col = 0; col <= cols; col++) {
                    const x = originX + col * GAP;
                    const y = originY + row * GAP;

                    // 0-1, travelling diagonally across the field.
                    const wave = animate
                        ? 0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.022 - time * 0.0007)
                        : 0.5;

                    let radius = BASE_RADIUS + wave * WAVE_RADIUS;
                    let alpha = BASE_ALPHA + wave * WAVE_ALPHA;
                    let drawX = x;
                    let drawY = y;

                    if (cursor.strength > 0.001) {
                        const dx = x - cursor.x;
                        const dy = y - cursor.y;
                        const distance = Math.hypot(dx, dy);

                        if (distance < REACH) {
                            // Squared falloff: the swell stays close to the
                            // cursor instead of lifting the whole field.
                            const fall = (1 - distance / REACH) ** 2 * cursor.strength;
                            radius += SWELL * fall;
                            alpha += 0.72 * fall;

                            if (distance > 0.001) {
                                drawX += (dx / distance) * LEAN * fall;
                                drawY += (dy / distance) * LEAN * fall;
                            }
                        }
                    }

                    ctx.beginPath();
                    ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${rgb},${Math.min(alpha, 1)})`;
                    ctx.fill();
                }
            }
        };

        resize();

        if (!animate) {
            draw(0);
            const redraw = () => {
                resize();
                draw(0);
            };
            const staticObserver = new ResizeObserver(redraw);
            staticObserver.observe(canvas);
            // A density change moves no CSS pixel, so the observer above never
            // hears it.
            const stopDprWatch = onDprChange(redraw);
            return () => {
                stopDprWatch();
                staticObserver.disconnect();
            };
        }

        let visible = true;
        let rafId = 0;

        const frame = (now: number) => {
            rafId = requestAnimationFrame(frame);
            if (!visible) return;

            cursor.x += (cursor.targetX - cursor.x) * TRACK;
            cursor.y += (cursor.targetY - cursor.y) * TRACK;
            cursor.strength += (cursor.target - cursor.strength) * FADE;

            draw(now);
        };

        rafId = requestAnimationFrame(frame);

        const onMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // A first sighting places the cursor rather than travelling to it
            // from wherever the last one left off, which would drag a swell
            // across the whole field on the way in.
            if (cursor.target === 0) {
                cursor.x = x;
                cursor.y = y;
            }
            cursor.targetX = x;
            cursor.targetY = y;
            cursor.target = 1;
        };

        const onLeave = () => {
            cursor.target = 0;
        };

        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerdown", onMove);
        canvas.addEventListener("pointerleave", onLeave);
        canvas.addEventListener("pointercancel", onLeave);

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);

        const stopDprWatch = onDprChange(resize);

        const intersectionObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) visible = entry.isIntersecting;
        });
        intersectionObserver.observe(canvas);

        return () => {
            cancelAnimationFrame(rafId);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerdown", onMove);
            canvas.removeEventListener("pointerleave", onLeave);
            canvas.removeEventListener("pointercancel", onLeave);
            stopDprWatch();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={cn("block h-full w-full text-ink", className)}
        />
    );
}
