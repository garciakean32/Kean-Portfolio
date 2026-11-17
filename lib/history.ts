"use client";

import { useEffect, useRef } from "react";

const KEY = "__overlay";
let next = 0;

/**
 * Lets the browser's back button (or a phone's back gesture) close an
 * overlay instead of leaving the site.
 *
 * While `active`, an extra history entry for the same URL sits on top; going
 * back pops it and calls `onBack`. Closed any other way — its X, Escape — the
 * entry is taken back off, so the history is left as it was found.
 *
 * Overlays nest: going back off an inner one lands on the outer one's entry,
 * which the outer one reads as not its own pop and ignores.
 */
export function useBackToClose(active: boolean, onBack: () => void) {
    const latest = useRef(onBack);
    useEffect(() => {
        latest.current = onBack;
    });

    useEffect(() => {
        if (!active) return;
        const id = ++next;
        window.history.pushState({ [KEY]: id }, "");
        let popped = false;
        const onPop = () => {
            const at = window.history.state?.[KEY];
            if (typeof at === "number" && at >= id) return;
            popped = true;
            latest.current();
        };
        window.addEventListener("popstate", onPop);
        return () => {
            window.removeEventListener("popstate", onPop);
            const at = window.history.state?.[KEY];
            if (!popped && typeof at === "number" && at >= id) unwind();
        };
    }, [active]);
}

/* Overlays closing together — a card and the page it is on — each take
   their entry off, in one step: two `back()`s in a row can land as one. */
let unwinding = 0;
function unwind() {
    if (unwinding++ > 0) return;
    queueMicrotask(() => {
        window.history.go(-unwinding);
        unwinding = 0;
    });
}
