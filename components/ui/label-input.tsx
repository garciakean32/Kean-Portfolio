"use client";

/* Label input — from Bencho (bencho.dev), MIT licensed:
   bencho.dev/licence. The CSS that goes with it is the "Label
   input" block in app/globals.css.

   Changed from the source for a real form rather than a bench:
   - the value is handed in, so the form that owns it can clear it
     after sending; the label and the input type are props rather
     than chosen by the Email/Password demo switch;
   - the field takes the width of its column, so the outline is
     drawn to the measured width instead of a fixed 280;
   - `multiline` makes it a textarea, for the message;
   - the per-letter hop on focus is gone. The label still lifts and
     the line still parts for it — that is the whole of the
     movement now, which is what was asked for: nothing wobbles;
   - `showcase` (keeping a phone's keyboard down while the field is
     only being demonstrated in a feed) has nothing to do on a form
     that is meant to be typed in, so it is not carried over. */

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ══ Label input ══════════════════════════════════════════
   A field whose label is its placeholder until you are in it.
   On focus the label lifts into the top edge, the outline
   darkens in place, and the top line parts under the label
   from its middle outward.

   ── ONE THING MOVES ─────────────────────────────────────
   It used to DRAW its outline out of the notch, both ways
   round the field — and that was the field performing, which
   is too much for a thing you focus forty times a day. Now the
   outline is always whole; focus only changes its ink and
   opens the gap. The label is the event, and the line makes
   room for it.

   The gap is two short paths across the notch, each from the
   middle to one side, retracted from the middle outward by a
   negative dash offset. */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* the width the outline is drawn at until the field has been
   measured — the source's own fixed width */
const W = 280;
const H = 52;
/* the lifted label's size, against its resting one */
const S = 0.78;
/* the stroke sits half a stroke inside the box so none of it
   is clipped by the svg's own edge */
const IN = 0.75;

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    name?: string;
    type?: "text" | "email" | "password";
    autoComplete?: string;
    required?: boolean;
    /* a textarea rather than one line */
    multiline?: boolean;
    /* the field's height, px — one line by default */
    height?: number;
    /* the field's corner, px — at half the height it is a pill */
    corner?: number;
    /* what the field is missing: said in place of the label, lifted or
       not, with the outline in full ink, until it is put right */
    error?: string;
};

export function LabelInput({
    label,
    value,
    onChange,
    name,
    type = "text",
    autoComplete = "off",
    required,
    multiline = false,
    height = H,
    corner = 14,
    error,
}: Props) {
    const said = error || label;
    const h = Math.max(H, height);
    const r = clamp(corner, 0, H / 2);
    const secret = type === "password";
    const id = `lbi-${useId().replace(/:/g, "")}`;

    const [focus, setFocus] = useState(false);
    const [show, setShow] = useState(false);
    const [flip, setFlip] = useState(0);

    /* the outline is drawn to the field's real width */
    const box = useRef<HTMLDivElement | null>(null);
    const [w, setW] = useState(W);
    useLayoutEffect(() => {
        const el = box.current;
        if (!el) return;
        const measure = () => setW(el.clientWidth || W);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    /* the notch is the label's own width, so it is measured */
    const lab = useRef<HTMLLabelElement | null>(null);
    const [lw, setLw] = useState(40);
    useLayoutEffect(() => {
        if (lab.current) setLw(lab.current.offsetWidth);
    }, [said]);

    const up = focus || value.length > 0;

    /* ── where the label sits, and the gap it leaves ─────────
       Never inside the corner's curve: the notch has to open on
       the straight part of the top edge, so a rounder field
       starts its label further in. */
    const lx = Math.max(14, r + 4);
    const x0 = Math.max(r * 0.6, lx - 5);
    const x1 = lx + lw * S + 5;
    const a = r - IN;
    const R = w - IN;
    const B = h - IN;
    const mid = w / 2;
    /* the gap, as two halves from its middle to each side */
    const nm = (x0 + x1) / 2;
    const gapL = `M${nm},${IN} L${x0},${IN}`;
    const gapR = `M${nm},${IN} L${x1},${IN}`;
    /* right: from the notch, clockwise, to the bottom middle */
    const right =
        r > 0
            ? `M${x1},${IN} L${w - r},${IN} A${a},${a} 0 0 1 ${R},${r} L${R},${h - r} A${a},${a} 0 0 1 ${w - r},${B} L${mid},${B}`
            : `M${x1},${IN} L${R},${IN} L${R},${B} L${mid},${B}`;
    /* left: from the notch, the other way round, to the same point */
    const left =
        r > 0
            ? `M${x0},${IN} L${r},${IN} A${a},${a} 0 0 0 ${IN},${r} L${IN},${h - r} A${a},${a} 0 0 0 ${r},${B} L${mid},${B}`
            : `M${x0},${IN} L${IN},${IN} L${IN},${B} L${mid},${B}`;

    const reveal = () => {
        setShow((s) => !s);
        setFlip((f) => f + 1);
    };

    const shared = {
        id,
        name,
        className: "lbi-field",
        value,
        required,
        autoComplete,
        "aria-invalid": error ? true : undefined,
        onFocus: () => setFocus(true),
        onBlur: () => setFocus(false),
    };

    return (
        <div
            className="lbi"
            data-up={up}
            data-focus={focus}
            data-filled={value.length > 0}
            data-multiline={multiline}
            data-error={Boolean(error)}
        >
            <div
                ref={box}
                className="lbi-box"
                style={{ height: h, borderRadius: r, "--lbi-x": `${lx}px` } as React.CSSProperties}
            >
                <svg
                    className="lbi-ring"
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${w} ${h}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d={right} />
                    <path d={left} />
                    <path className="lbi-gap" d={gapL} pathLength={1} />
                    <path className="lbi-gap" d={gapR} pathLength={1} />
                </svg>

                <label className="lbi-label" htmlFor={id} ref={lab}>
                    {said}
                </label>

                {multiline ? (
                    <textarea {...shared} onChange={(e) => onChange(e.target.value)} />
                ) : (
                    <input
                        {...shared}
                        data-flip={flip % 2}
                        type={secret && !show ? "password" : secret ? "text" : type}
                        onChange={(e) => onChange(e.target.value)}
                        spellCheck={type === "text"}
                        style={{ paddingRight: secret ? 48 : lx }}
                    />
                )}

                {secret && (
                    <button
                        className="lbi-eye"
                        type="button"
                        data-show={show}
                        /* keep focus in the field: the eye is a toggle on
                           what you are typing, not somewhere to go */
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={reveal}
                        aria-label={show ? "Hide password" : "Show password"}
                    >
                        <Eye size={16} strokeWidth={2} aria-hidden="true" />
                        <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}
