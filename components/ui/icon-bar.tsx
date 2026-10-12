"use client";

/* Icon bar — from Bencho (bencho.dev), MIT licensed:
   bencho.dev/licence. The CSS that goes with it is the "Icon bar"
   block in app/globals.css.

   Changed from the source in one way that matters: the active slot is
   handed in rather than kept here. On this site the bar is the page's
   section menu, so what is active changes when the page scrolls into
   another section as well as when a slot is clicked — and the indicator
   has to travel the same way for both. */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── inlined from lab/motion ──────────────────────── */
/* ── elastic, as numbers a person can hold ─────────────────
   Several blocks here are the same idea in different clothes:
   something travels, stretches on the way, and overshoots
   when it lands. Their character lives in a duration and in
   one control point of a bezier — which is exactly the kind
   of thing nobody should have to name in order to tune.

   So the outside of every elastic knob is 0..100 and the
   inside is real units, and **50 is always what the component
   was already tuned to**. Turn every knob on the bench to the
   middle and nothing has changed. That is what makes these
   safe to expose: the default is not a number somebody has to
   remember, it is the middle of the slider.

   Both ends have to be shippable, which is the constraint
   that actually shapes these curves. The ranges below stop
   where the effect stops being the thing it is — a bar that
   moves in 40ms still reads as a bar snapping to a slot; one
   that moves in 20ms reads as broken. */

/* How long it takes, slower to faster, as a multiplier on
   whatever the component's own tuned duration is. 0 is a
   little over half again as slow, 100 is two and a half times
   as fast, 50 is exactly 1. */
const rate = (speed: number) => 1.6 - (speed / 100) * 1.2;

/* How hard it lands.

   In a cubic-bezier the second control point's y is the whole
   of an overshoot: at 1 the thing stops dead on its target,
   and past 1 it travels beyond and comes back. Everything
   else in the curve is the approach and stays put.

   `tuned` is the y this component was drawn with, so 50
   returns it unchanged and the slider is centred on the
   design rather than on some shared average. */
const overshoot = (bounce: number, tuned: number) =>
    Number((1 + (bounce / 100) * (tuned - 1) * 2).toFixed(3));

/* the same, ready to drop into a transition */
const curve = (bounce: number, tuned: number, x1 = 0.28, x2 = 0.36) =>
    `cubic-bezier(${x1}, ${overshoot(bounce, tuned)}, ${x2}, 1)`;

/* the one helper this file wants from the shared kit */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type IconBarItem = { key: string; label: string; Icon: LucideIcon };

/* ══ icon nav, horizontal or vertical ═════════════════════
   Same two phase indicator as the segmented pill: the leading
   edge runs ahead, the pill dilates across both slots, then
   the trailing edge catches up and overshoots on landing. */

type Ind = { p: number; s: number };

/* the two shared mappings, so every elastic block on the
   bench is centred on 50 in the same way — see lab/motion */
const settle = (bounce: number) => ({
    /* transform and width overshoot by different amounts on
       purpose: the box arrives before its edges finish, which
       is what reads as give rather than as a bounce applied to
       a rectangle */
    move: curve(bounce, 1.28, 0.28, 0.36),
    size: curve(bounce, 1.34, 0.24, 0.38),
});

type NavProps = {
    items: IconBarItem[];
    /* which slot is active — owned by the page, see the note at
       the top of this file */
    active: string;
    onSelect: (key: string) => void;
    /* the nav's accessible name */
    label?: string;
    /* the slot itself comes from --bar-slot, shared with the
       toolbar; only the glyph inside it is a prop */
    glyph?: number;
    /* "row" and "column", not "horizontal" and "vertical": the
       control that sets this is two slots in a 96px pill and
       those two words do not fit in it. A prop name is also a
       label here — the panel is generated from it. */
    axis?: "row" | "column";
    /* how much of the gap between the two slots the pill spans
       while in transit. At 0 it simply slides across; at 100 it
       covers both ends at once and the stretch is the whole
       gesture. */
    dilate?: number;
    bounce?: number;
    speed?: number;
    hug?: number;
};

function IconNav({
    items,
    active,
    onSelect,
    label = "Main",
    glyph = 17,
    axis = "row",
    dilate = 100,
    bounce = 50,
    speed = 50,
    hug = 6,
}: NavProps) {
    const vertical = axis === "column";
    const trackRef = useRef<HTMLElement | null>(null);
    const refs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [ind, setInd] = useState<Ind | null>(null);
    const [phase, setPhase] = useState<"idle" | "stretch" | "settle">("idle");
    const indRef = useRef<Ind | null>(null);
    /* the slot the indicator is on, or on its way to */
    const shownRef = useRef(active);
    const timer = useRef<number | undefined>(undefined);

    const measure = (k: string): Ind | null => {
        const el = refs.current[k];
        if (!el) return null;
        return vertical
            ? { p: el.offsetTop, s: el.offsetHeight }
            : { p: el.offsetLeft, s: el.offsetWidth };
    };

    useLayoutEffect(() => {
        const settle = () => {
            const next = measure(shownRef.current);
            if (!next) return;
            indRef.current = next;
            setPhase("idle");
            setInd(next);
        };
        settle();
        const ro = new ResizeObserver(settle);
        if (trackRef.current) ro.observe(trackRef.current);
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vertical]);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    /* The source ran this from its own click handler. Here it
       runs whenever `active` changes, whoever changed it. */
    useLayoutEffect(() => {
        if (active === shownRef.current) return;
        shownRef.current = active;
        /* pitched by seat, so moving right up the bar rises and
           coming back down falls — the indicator's travel, heard */
        const to = measure(active);
        const from = indRef.current;
        if (!to) return;
        window.clearTimeout(timer.current);
        if (!from) {
            indRef.current = to;
            setPhase("settle");
            setInd(to);
            return;
        }
        /* The full union of both slots is as far as it can go —
           past that it is a pill reaching for somewhere neither
           end is. Dilate scales back from there toward simply
           moving, so 0 is a slide and 100 is the stretch. */
        const start = Math.min(from.p, to.p);
        const end = Math.max(from.p + from.s, to.p + to.s);
        const grow = dilate / 100;
        setPhase("stretch");
        setInd({
            p: to.p + (start - to.p) * grow,
            s: to.s + (end - start - to.s) * grow,
        });
        /* the handoff rides the same clock as the phases, or a
           fast bar hands over long after it has finished
           stretching and a slow one hands over mid-stretch */
        timer.current = window.setTimeout(() => {
            indRef.current = to;
            setPhase("settle");
            setInd(to);
        }, 150 * rate(speed));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    const style = ind
        ? vertical
            ? { transform: `translate3d(0, ${ind.p}px, 0)`, height: ind.s }
            : { transform: `translate3d(${ind.p}px, 0, 0)`, width: ind.s }
        : { opacity: 0 };

    /* Handed to CSS as custom properties rather than as inline
       transitions: the two phases are two rules keyed on
       data-phase, and reproducing that branch in JS would mean
       the component knowing which phase it is painting. It sets
       the numbers; the stylesheet still decides the shape. */
    const curve = settle(bounce);
    const vars = {
        "--nav-pad": `${hug}px`,
        "--ind-stretch": `${Math.round(190 * rate(speed))}ms`,
        "--ind-settle": `${Math.round(420 * rate(speed))}ms`,
        "--ind-move": curve.move,
        "--ind-size": curve.size,
    } as React.CSSProperties;

    return (
        <nav
            ref={trackRef as React.RefObject<HTMLElement>}
            className="gnav"
            data-orientation={vertical ? "vertical" : "horizontal"}
            style={vars}
            aria-label={label}
        >
            <span className="gnav-ind" data-phase={phase} style={style} aria-hidden />
            {items.map(({ key, label: name, Icon }) => (
                <button
                    key={key}
                    type="button"
                    ref={(el) => {
                        refs.current[key] = el;
                    }}
                    className="gnav-item"
                    data-active={active === key}
                    aria-label={name}
                    title={name}
                    aria-current={active === key ? "page" : undefined}
                    /* a click or tap leaves no focus behind, so a key
                       pressed after it does not light the keyboard ring;
                       Enter and Space (`detail` 0) keep it */
                    onClick={(e) => {
                        if (e.detail) e.currentTarget.blur();
                        onSelect(key);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Icon size={glyph} strokeWidth={2} />
                </button>
            ))}
        </nav>
    );
}

/* the bar's corner. 26 is half of the 52px it runs at, which
   is the pill it already is; the vertical variant was drawn at
   30 and follows the same knob rather than keeping a number of
   its own — a control that does nothing when you turn the bar
   on its side is worse than one that moves it four pixels. */
const NAV_CORNER = 26;

/* The source mounted this in `.bar-well`, the 264x150 stage every
   bar stands on in Bencho's wall. Here the page places the bar, so
   the root is bare: it carries the glass surface, the corner, and
   the bar's local tokens (`.icon-bar` in globals.css) and nothing
   that sizes it. */
export function IconBar({
    corner,
    className,
    ...props
}: NavProps & {
    /* the bar's own corner, 0..26 */
    corner?: number;
    className?: string;
}) {
    return (
        <div
            className={cn("icon-bar", className)}
            data-surface="glass"
            style={{ "--gnav-r": `${clamp(corner ?? NAV_CORNER, 0, NAV_CORNER)}px` } as React.CSSProperties}
        >
            <IconNav {...props} />
        </div>
    );
}
