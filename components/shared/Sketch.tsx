"use client";

import { useEffect, useMemo, useRef } from "react";
import { paintStrokes } from "@/components/shared/doodles";
import { handLine, type Pt2 } from "@/lib/hand";
import { gsap, motionEnabled } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A drawing in a box of its own, framed to the part of it the lines fill,
 * drawing itself the first time it is all the way on screen — over
 * `duration` seconds, each stroke easing in and out of itself and the pen
 * lifting between them. With motion off it is simply there.
 *
 * `weight` is the width of its lines in the drawing's own units, and
 * `wander` the faint wander of a hand along them — none unless asked for.
 */
export default function Sketch({
    lines,
    weight,
    duration,
    wander = 0,
    className,
}: {
    lines: Pt2[][];
    weight: number;
    duration: number;
    wander?: number;
    className?: string;
}) {
    const svg = useRef<SVGSVGElement>(null);
    const paths = useRef<(SVGPathElement | null)[]>([]);
    // Lengths rounded up to a tenth: the server and the browser can differ
    // in the last digit of a sine, and the page must come out the same on
    // both.
    const strokes = useMemo(
        () =>
            lines.map((pts, i) => {
                const line = handLine(pts, 2.3 + i * 1.7, wander);
                return { ...line, len: Math.ceil(line.len * 10) / 10 };
            }),
        [lines, wander]
    );
    const viewBox = useMemo(() => {
        const left = Math.min(...strokes.map((s) => s.box.left)) - weight;
        const top = Math.min(...strokes.map((s) => s.box.top)) - weight;
        const right = Math.max(...strokes.map((s) => s.box.right)) + weight;
        const bottom = Math.max(...strokes.map((s) => s.box.bottom)) + weight;
        return [left, top, right - left, bottom - top].map((v) => v.toFixed(1)).join(" ");
    }, [strokes, weight]);

    useEffect(() => {
        const el = svg.current;
        if (!el) return;
        if (!motionEnabled()) {
            paintStrokes(paths.current, strokes, 1);
            return;
        }
        paintStrokes(paths.current, strokes, 0);
        let tween: gsap.core.Tween | null = null;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                observer.disconnect();
                const state = { p: 0 };
                tween = gsap.to(state, {
                    p: 1,
                    duration,
                    ease: "none",
                    onUpdate: () => paintStrokes(paths.current, strokes, state.p),
                });
            },
            { threshold: 0.9 }
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            tween?.kill();
        };
    }, [strokes, duration]);

    return (
        <svg
            ref={svg}
            aria-hidden="true"
            viewBox={viewBox}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("block text-ink opacity-90", className)}
        >
            {strokes.map((s, i) => (
                <path
                    key={i}
                    ref={(el) => {
                        paths.current[i] = el;
                    }}
                    d={s.d}
                    strokeWidth={weight}
                    strokeDasharray={s.len}
                    className="invisible"
                />
            ))}
        </svg>
    );
}
