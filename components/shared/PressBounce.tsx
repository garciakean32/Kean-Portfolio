"use client";

import { useEffect } from "react";
import { motionEnabled } from "@/lib/motion";

/* What counts as something to press: a button, or anything standing in for
   one — a link drawn as a pill included. A link inside a line of text never
   moves: a transform does nothing to an inline box. `data-no-press` opts an
   element out. */
const PRESSABLE = 'button, [role="button"], a[href], summary, input[type="button"], input[type="submit"]';

/* How far it gives under the finger, and how fast; then the spring back on
   letting go — past its own size and back, settling. */
const PRESSED = 0.92;
const PRESS_MS = 90;
const SPRING: Keyframe[] = [
    { scale: PRESSED },
    { scale: 1.05, offset: 0.4 },
    { scale: 0.985, offset: 0.72 },
    { scale: 1 },
];
const SPRING_MS = 420;

/**
 * Every button on the site gives when it is pressed and springs back when it
 * is let go — the back arrow, the X, the arrows, the pills — so a press is
 * felt as well as seen. From the keyboard, Enter or Space plays the same as
 * one quick bounce.
 *
 * One listener for the whole page rather than one per button, and drawn on
 * the element's own `scale`, apart from its `transform`, so nothing else a
 * button does with its transform — a hover nudge, a slide in or out — is
 * touched. Off with reduced motion.
 */
export default function PressBounce() {
    useEffect(() => {
        if (!motionEnabled()) return;
        let held: { el: HTMLElement; press: Animation } | null = null;

        const pressable = (target: EventTarget | null) => {
            if (!(target instanceof Element)) return null;
            const el = target.closest<HTMLElement>(PRESSABLE);
            if (!el || el.closest("[data-no-press]")) return null;
            if (el.matches(":disabled, [aria-disabled='true']")) return null;
            // Something the size of the screen is a surface, not a button.
            if (el.offsetWidth > window.innerWidth * 0.6 && el.offsetHeight > window.innerHeight * 0.4) return null;
            return el;
        };

        // Let go: a spring back for a press, or — a touch that turned out to
        // be a scroll — straight back, quietly.
        const release = (spring: boolean) => {
            if (!held) return;
            const { el, press } = held;
            held = null;
            press.cancel();
            el.animate(spring ? SPRING : [{ scale: PRESSED }, { scale: 1 }], {
                duration: spring ? SPRING_MS : 160,
                easing: "ease-out",
            });
        };

        const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            const el = pressable(e.target);
            if (!el) return;
            release(false);
            held = {
                el,
                press: el.animate([{ scale: 1 }, { scale: PRESSED }], {
                    duration: PRESS_MS,
                    easing: "ease-out",
                    fill: "forwards",
                }),
            };
        };
        const onUp = () => release(true);
        const onCancel = () => release(false);
        const onKey = (e: KeyboardEvent) => {
            if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
            const el = pressable(e.target);
            if (!el) return;
            el.animate([{ scale: 1 }, { scale: PRESSED, offset: 0.2 }, ...SPRING.slice(1)], {
                duration: SPRING_MS,
                easing: "ease-out",
            });
        };

        // Caught on the way down, before anything that stops a press from
        // travelling further sees it.
        document.addEventListener("pointerdown", onDown, true);
        window.addEventListener("pointerup", onUp, true);
        window.addEventListener("pointercancel", onCancel, true);
        document.addEventListener("keydown", onKey, true);
        return () => {
            document.removeEventListener("pointerdown", onDown, true);
            window.removeEventListener("pointerup", onUp, true);
            window.removeEventListener("pointercancel", onCancel, true);
            document.removeEventListener("keydown", onKey, true);
        };
    }, []);

    return null;
}
