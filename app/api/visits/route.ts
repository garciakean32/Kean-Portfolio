import { NextResponse } from "next/server";
import { personal } from "@/lib/data";

/**
 * The visitor count, kept on Abacus (abacus.jasoncameron.dev): a free counting
 * service that needs no account and no key. Visitors never talk to it — the
 * browser asks this route, and this route asks Abacus — so nothing about
 * them leaves the site.
 *
 * POST counts a visitor and returns the new total; GET only reads it. Which
 * one a browser sends is decided on the client: once, the first time it ever
 * comes here, and after that it only reads — see VisitorCount.
 *
 * The counter is named after the site's own domain, as Abacus asks, and a
 * separate one is used outside production so working on the site does not
 * count as visiting it. Abacus drops a counter after six months with no hits.
 */
const COUNTER = "https://abacus.jasoncameron.dev";
const NAMESPACE = new URL(personal.siteUrl).hostname;
const KEY = process.env.NODE_ENV === "production" ? "visitors" : "visitors-dev";

async function counter(action: "hit" | "get") {
    const res = await fetch(`${COUNTER}/${action}/${NAMESPACE}/${KEY}`, { cache: "no-store" });
    // A counter nobody has hit yet does not exist, and reads as a 404.
    if (action === "get" && res.status === 404) return 0;
    if (!res.ok) throw new Error(`Counter responded ${res.status}`);
    const data = (await res.json()) as { value?: unknown };
    if (typeof data.value !== "number") throw new Error("Counter sent no value");
    return data.value;
}

async function respond(action: "hit" | "get") {
    try {
        return NextResponse.json({ count: await counter(action) });
    } catch {
        // The count is a nicety; the footer simply leaves it out.
        return NextResponse.json({ error: "Count unavailable." }, { status: 503 });
    }
}

export function GET() {
    return respond("get");
}

export function POST() {
    return respond("hit");
}
