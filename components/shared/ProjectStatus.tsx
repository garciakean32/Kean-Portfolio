"use client";

import { useId, useLayoutEffect, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* Drawn here rather than imported, like every other mark on the site — see
   SectionIcon. One icon is not worth an icon set. */
function InfoIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}

type Status = { label: string; reason: string };
type Placement = { vertical: "above" | "below"; top: number; left: number };

const GAP = 10;
const EDGE = 16;
// Extra rightward push, and a tighter vertical gap, on hover-capable devices
// only — on a touch press the icon is the only thing the reader has
// actually pointed at, so the panel stays pinned close to it; a mouse can
// afford to have it sit further out horizontally, and a little lower.
const DESKTOP_NUDGE_X = 28;
const DESKTOP_GAP = 4;

/**
 * A project that is live but not finished, said plainly — with the why kept
 * behind an info icon so the pill stays a pill.
 *
 * The reason opens on hover where hovering is a real thing the device does,
 * and on a press everywhere else: `(hover: hover) and (pointer: fine)` is the
 * honest test for that, not a width breakpoint — a touchscreen laptop is wide
 * and still cannot hover. On touch the panel closes on Escape or on the next
 * press outside it, since there is no "leave" to close it.
 *
 * The panel is warn-tinted to match the pill it belongs to. Horizontally it
 * opens out of the icon — its left edge starts at the icon's left edge and
 * it pops from that corner (`origin-*-left`, with a small scale-in) — but
 * its vertical clearance is measured off the whole pill, not the icon alone,
 * since the icon sits centred inside a taller pill and gapping only its own
 * edges left the panel's border cutting into the pill. It opens toward the
 * top-right by default and drops to the bottom-right only when the top
 * doesn't have the room, and on either axis it is clamped to the viewport
 * so it never runs off-screen on a narrow phone. On hover-capable devices it
 * also opens further out to the right and with a tighter vertical gap
 * (`DESKTOP_NUDGE_X` / `DESKTOP_GAP`) than a touch press gets, since a mouse
 * can afford the panel sitting closer to and further from the icon at once.
 */
export default function ProjectStatus({
    status,
    className,
}: {
    status: Status;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [canHover, setCanHover] = useState(false);
    const [placement, setPlacement] = useState<Placement>({ vertical: "above", top: 0, left: 0 });
    const wrap = useRef<HTMLSpanElement>(null);
    const icon = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLSpanElement>(null);
    const panelId = useId();

    useEffect(() => {
        const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
        const read = () => {
            setCanHover(mq.matches);
            setOpen(false);
        };
        read();
        mq.addEventListener("change", read);
        return () => mq.removeEventListener("change", read);
    }, []);

    useEffect(() => {
        if (!open || canHover) return;

        const onDown = (e: PointerEvent) => {
            if (!wrap.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, canHover]);

    // Runs before paint, off the panel's default box, so the flip lands in
    // the same frame the panel first appears — nothing visibly jumps from
    // one corner to the other.
    useLayoutEffect(() => {
        if (!open) return;

        const place = () => {
            const anchor = wrap.current;
            const trigger = icon.current;
            const box = panel.current;
            if (!anchor || !trigger || !box) return;

            const anchorRect = anchor.getBoundingClientRect();
            const iconRect = trigger.getBoundingClientRect();
            const vh = window.innerHeight;
            const vw = window.innerWidth;

            // `offsetWidth`/`offsetHeight`, not `getBoundingClientRect`: the
            // pop-in animation's 0% keyframe (scale(0.9)) is already applied
            // the instant the panel mounts, before this effect runs, so its
            // bounding rect reads a 10%-shrunken box. The offset dimensions
            // are the untransformed layout size — where the panel actually
            // ends up at rest — which is what the gap needs to clear.
            const boxHeight = box.offsetHeight;
            const boxWidth = box.offsetWidth;

            // Clearance is measured off the whole pill (`anchorRect`), not
            // just the icon: the icon sits centred inside a taller pill, so
            // gapping only its own edges left the panel's border cutting
            // into the pill above or below it. Desktop keeps a smaller —
            // but still real — gap, since a mouse can read the connection
            // between icon and panel even sitting closer together.
            const gap = canHover ? DESKTOP_GAP : GAP;
            const roomAbove = anchorRect.top - gap - EDGE;
            const vertical: Placement["vertical"] = boxHeight > roomAbove ? "below" : "above";

            const idealTop =
                vertical === "above" ? anchorRect.top - gap - boxHeight : anchorRect.bottom + gap;
            // Clamped to the viewport too, in case neither side has room —
            // a short mobile viewport, say — so the panel is pushed in
            // rather than left to run off the top or bottom edge.
            const top = Math.min(Math.max(idealTop, EDGE), vh - EDGE - boxHeight) - anchorRect.top;

            // Horizontally it still opens out of the icon by default, but is
            // clamped to the viewport on both sides — the one that matters
            // on a narrow phone, where the icon sits far enough right that
            // the panel's default width would otherwise run off-screen.
            const idealLeft = iconRect.left + (canHover ? DESKTOP_NUDGE_X : 0);
            const left = Math.min(Math.max(idealLeft, EDGE), vw - EDGE - boxWidth) - anchorRect.left;

            setPlacement((prev) =>
                prev.vertical === vertical && prev.top === top && prev.left === left
                    ? prev
                    : { vertical, top, left }
            );
        };

        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
    }, [open, canHover]);

    return (
        // z-20 on the wrapper itself, not just the panel: sibling copy below
        // this pill gets a GSAP transform on reveal, which gives it its own
        // stacking context that would otherwise paint over an unranked one.
        <span ref={wrap} className={cn("relative z-20 inline-flex", className)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-warn/45 bg-warn/10 py-1.5 pl-3 pr-1.5 font-mono text-meta uppercase tracking-[0.1em] text-warn">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warn" />
                {status.label}

                <button
                    ref={icon}
                    type="button"
                    aria-label={`Why ${status.label.toLowerCase()}`}
                    aria-expanded={open}
                    aria-describedby={open ? panelId : undefined}
                    onClick={(e) => {
                        e.preventDefault();
                        if (!canHover) setOpen((v) => !v);
                    }}
                    onPointerEnter={() => canHover && setOpen(true)}
                    onPointerLeave={() => canHover && setOpen(false)}
                    onFocus={() => canHover && setOpen(true)}
                    onBlur={() => canHover && setOpen(false)}
                    className="tap grid size-5 shrink-0 place-items-center rounded-full text-warn/80 transition-colors duration-200 hover:bg-warn/15 hover:text-warn"
                >
                    <InfoIcon />
                </button>
            </span>

            {open && (
                <span
                    ref={panel}
                    id={panelId}
                    role="tooltip"
                    style={{ top: placement.top, left: placement.left }}
                    className={cn(
                        "tooltip-pop absolute z-30 w-[min(22rem,72vw)] rounded-md border border-warn/30 bg-paper-2 p-4 shadow-xl",
                        placement.vertical === "above" ? "origin-bottom-left" : "origin-top-left"
                    )}
                >
                    <span className="mb-1.5 flex items-center gap-1.5 font-mono text-label uppercase tracking-[0.1em] text-warn">
                        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warn" />
                        {status.label}
                    </span>
                    <span className="block text-body normal-case leading-relaxed tracking-normal text-ink-2">
                        {status.reason}
                    </span>
                </span>
            )}
        </span>
    );
}
