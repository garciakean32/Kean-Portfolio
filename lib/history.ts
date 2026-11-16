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
            popped = true;
            latest.current();
        };
        window.addEventListener("popstate", onPop);
        return () => {
            window.removeEventListener("popstate", onPop);
            if (!popped && window.history.state?.[KEY] === id) window.history.back();
        };
    }, [active]);
}
