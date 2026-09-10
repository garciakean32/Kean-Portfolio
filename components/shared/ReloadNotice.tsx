"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The widths the page actually changes shape at.
 *
 * Not every width — a window dragged from 1200 to 1300 is the same layout in a
 * slightly different box, and everything on the page already re-measures itself
 * for that. These three are where a section swaps one arrangement for another:
 * the hero's margin runs turn at `sm`, the bottom row splits at `md`, and at
 * `lg` the work and the services stop stacking and start scrolling sideways
 * while the section menu moves from the bottom edge to the right margin.
 *
 * Keep in step with the `sm` / `md` / `lg` breakpoints in tailwind.config.ts.
 */
const BREAKPOINTS = [640, 768, 1024];

/** Which of those bands the window is currently in. */
const band = () => BREAKPOINTS.filter((width) => window.innerWidth >= width).length;

/** Long enough that dragging an edge across a breakpoint and back does not
    count, and that the layout it is reporting on has settled first. */
const SETTLE = 500;

/**
 * A way back to a clean measurement.
 *
 * Everything on this page that depends on the size of the window re-measures
 * when it changes — the scroll budget the sideways sections hold, the drift
 * the two page seams spend, where each section starts, how dense the canvases
 * draw. What none of that can fully answer for is a *change of layout*: at a
 * breakpoint whole sections swap one arrangement for another, and any measure
 * taken while that swap is still resolving describes neither shape.
 *
 * So this does not appear on resizing — only on crossing one of the three
 * widths where the page is a different page on either side, which is a rare
 * and deliberate thing to do. It offers the one thing that is guaranteed to be
 * measured against the window as it now is, and is dismissible for a reader
 * who can see for themselves that nothing needs it.
 */
export default function ReloadNotice() {
    const [stale, setStale] = useState(false);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        let at = band();
        let settle = 0;

        const check = () => {
            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
                const now = band();
                if (now === at) return;
                at = now;
                setStale(true);
            }, SETTLE);
        };

        window.addEventListener("resize", check);
        window.addEventListener("orientationchange", check);
        return () => {
            window.clearTimeout(settle);
            window.removeEventListener("resize", check);
            window.removeEventListener("orientationchange", check);
        };
    }, []);

    // Mounted transparent and faded in on the next frame, so it arrives rather
    // than appears — there is no layout for it to shift, it is fixed over the
    // page.
    useEffect(() => {
        if (!stale) return;
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, [stale]);

    if (!stale) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            // It has to stand over the page somewhere, and the choice is
            // which thing it is allowed to cover.
            //
            // From `lg` that is the bottom right corner: the section menu is
            // down the right margin and vertically centred, so nothing but a
            // standing label is there. Below `lg` the menu is a bar along the
            // bottom edge and the hero's one call to action sits just above
            // it — between them there is no band tall enough to stand in, so
            // this goes to the top instead, where the only thing it crosses is
            // a line of setting. Never over the button.
            className={cn(
                "fixed left-4 right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border border-rule bg-paper/90 py-2 pl-4 pr-2 shadow-[0_8px_28px_-8px_rgb(0_0_0/0.6)] backdrop-blur-md transition-opacity duration-500 lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:rounded-full",
                shown ? "opacity-100" : "opacity-0"
            )}
        >
            {/* Said in as few words as fit on one line at the narrowest
                width this appears at — the button beside it carries what to
                do about it. */}
            <p className="font-mono text-[0.625rem] uppercase leading-tight tracking-[0.1em] text-ink">
                Screen size changed
            </p>

            <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-auto shrink-0 rounded-full bg-ink px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-on-ink transition-opacity duration-300 hover:opacity-80"
            >
                Reload
            </button>

            <button
                type="button"
                onClick={() => {
                    setStale(false);
                    // So a later crossing arrives the same way this one did,
                    // rather than snapping straight to full.
                    setShown(false);
                }}
                aria-label="Dismiss"
                className="tap shrink-0 pr-1 font-mono text-sm leading-none text-ink-3 transition-colors duration-300 hover:text-ink"
            >
                ×
            </button>
        </div>
    );
}
