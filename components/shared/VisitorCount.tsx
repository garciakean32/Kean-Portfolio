"use client";

import { useEffect, useState } from "react";

/* Set the first time a browser comes here, so it is counted once and only
   ever reads the total after that. */
const SEEN = "kg-visited";

/**
 * How many people have visited, for the footer's bottom line.
 *
 * Unique visitors rather than page loads: a browser that has been here
 * before only reads the count. The mark is set before the request goes out,
 * so a second run of this effect — React's development double-run, or a
 * quick reload — reads rather than counting the same visitor twice. Where
 * storage is unavailable the visitor is not counted at all, rather than
 * counted on every load.
 *
 * Nothing is shown until there is a number, and nothing at all if the count
 * cannot be had.
 */
export default function VisitorCount() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let first = false;
        try {
            first = !window.localStorage.getItem(SEEN);
            if (first) window.localStorage.setItem(SEEN, "1");
        } catch {
            first = false;
        }

        const controller = new AbortController();
        fetch("/api/visits", { method: first ? "POST" : "GET", signal: controller.signal })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { count?: unknown } | null) => {
                if (typeof data?.count === "number") setCount(data.count);
            })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    if (count === null) return null;

    // Set after the copyright, so it brings its own separator with it.
    return (
        <span>
            {" · "}
            {count.toLocaleString("en-US")} {count === 1 ? "visitor" : "visitors"}
        </span>
    );
}
