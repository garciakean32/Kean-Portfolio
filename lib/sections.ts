"use client";

import { useEffect, useState } from "react";
import { sections } from "@/lib/data";
import { getLenis } from "@/lib/lenis";

/** The line down the viewport a section has to cross to count as "current". */
const ACTIVE_LINE = 0.35;

/** How long a jump owns the scroll, in ms — the travel plus a little slack. */
const JUMP_MS = 1500;

/**
 * A few pixels past a section's top edge, and the reason is the seams.
 *
 * `RevealUnder`'s window ends exactly where the region it uncovers begins, so
 * landing on that layout position lands on the last frame of the seam — the
 * knife edge where the region is only just finished being displaced. Anything
 * that resolves the scroll a pixel short of it arrives with the section still
 * drifting and its heading pushed off the top of the screen. Overshooting by a
 * hair costs nothing visible and puts the arrival unambiguously past every
 * seam boundary.
 */
const SETTLE = 4;

let jumpUntil = 0;

/**
 * True while a section jump is still travelling. The navbar reads this so it
 * does not mistake the jump for the reader scrolling down and lift itself out
 * of frame the moment it is clicked.
 */
export const isJumping = () => Date.now() < jumpUntil;

/**
 * An element's position in the document, measured through layout rather than
 * off `getBoundingClientRect`.
 *
 * The page seams move whole regions with `transform` — a section can be up to
 * half a viewport away from where it belongs for the length of a seam, and a
 * rect reads that displacement as the truth. `offsetTop` does not: a transform
 * makes an element a containing block, but it does not make it an
 * `offsetParent` (only positioning does), so walking the chain returns the
 * settled layout position whatever the seam is currently doing with it.
 */
function documentTop(el: HTMLElement) {
    let y = 0;
    let node: HTMLElement | null = el;
    while (node) {
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
    }
    return y;
}

const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll to a section by id.
 *
 * Lenis re-asserts its own scroll position every frame, so a native anchor
 * jump or a plain `window.scrollTo` gets fought and snapped back — go through
 * its `scrollTo` whenever it is the one driving scroll.
 */
export function scrollToSection(id: string) {
    const target = document.getElementById(id);
    if (!target) return;

    jumpUntil = Date.now() + JUMP_MS;

    // Clamped, so a jump to the last section cannot ask for a scroll position
    // the document does not have and land short of where it was aimed.
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y =
        id === sections[0].id
            ? 0
            : Math.min(Math.max(0, documentTop(target) + SETTLE), max);

    const lenis = getLenis();
    if (lenis) {
        // The mobile menu stops Lenis while it is open, and a stopped Lenis
        // drops `scrollTo` on the floor — so wake it before asking. Harmless
        // when it is already running, which also means the menu's own
        // `start()` on close finds nothing to reset and leaves this tween be.
        lenis.start();
        lenis.scrollTo(y, { duration: 1.2, immediate: prefersReduced() });
        return;
    }
    window.scrollTo({ top: y, behavior: prefersReduced() ? "auto" : "smooth" });
}

/**
 * Which section the reader is in. One passive listener reading positions —
 * cheaper and more predictable than five observers, and it gets the last
 * section right when the page bottoms out before that section's top has
 * crossed the line.
 */
export function useActiveSection() {
    const [active, setActive] = useState(sections[0].id);

    useEffect(() => {
        const read = () => {
            const line = window.innerHeight * ACTIVE_LINE;
            let current = sections[0].id;

            for (const section of sections) {
                const el = document.getElementById(section.id);
                if (el && documentTop(el) - window.scrollY <= line) current = section.id;
            }

            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 4;
            if (atBottom) current = sections[sections.length - 1].id;

            setActive(current);
        };

        read();
        window.addEventListener("scroll", read, { passive: true });
        window.addEventListener("resize", read);
        return () => {
            window.removeEventListener("scroll", read);
            window.removeEventListener("resize", read);
        };
    }, []);

    return active;
}
