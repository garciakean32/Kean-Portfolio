"use client";

/* The doodle layer and its dock.

   Two pieces of Bencho (bencho.dev), MIT licensed — bencho.dev/licence —
   adapted rather than installed whole: the nib ink and the rewinding Clear
   come from its Signature pad, and the dock's core with glass options dealt
   out from it comes from its Radial menu, laid out in a row instead of a
   fan. */

import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Eraser, Redo2, Trash2, Undo2, type LucideProps } from "lucide-react";
import ResumeButton from "@/components/shared/ResumeButton";
import { gsap, motionEnabled } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Pt = { x: number; y: number; w: number };
type Ink = Pt[][];
type Tool = "sign" | "erase";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/* The sign pen is the Signature pad's nib, in its own knobs at their tuned
   middle: 0..100 each, 50 being what it was drawn with. Pen sits a touch
   under it — a page wants a slightly finer line than a signature card. */
const PEN = 40;
const SMOOTH = 50;
const REWIND = 50;

/* the pen's two widths, both of which move with the knob so
   neither end of it is a pen that cannot vary */
const THIN = 0.8 + (PEN / 100) * 2;
const THICK = 2.2 + (PEN / 100) * 5;

/* How far round the pointer the eraser reaches, in pixels. */
const ERASE_R = 14;

/* one stroke as short quadratic pieces through the midpoints,
   each as wide as the pen was there */
function pieces(s: Pt[], upto: number, key: string) {
    const out: React.ReactNode[] = [];
    const n = Math.min(s.length, upto);
    if (n <= 0) return out;
    if (n === 1 || s.length === 1) {
        out.push(<circle key={key} cx={s[0].x} cy={s[0].y} r={s[0].w / 2} fill="currentColor" />);
        return out;
    }
    for (let i = 1; i < n; i++) {
        const a = s[i - 1];
        const b = s[i];
        const start = i === 1 ? a : { x: (s[i - 2].x + a.x) / 2, y: (s[i - 2].y + a.y) / 2 };
        const end = i === s.length - 1 ? b : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        out.push(
            <path
                key={`${key}-${i}`}
                d={`M${start.x.toFixed(1)} ${start.y.toFixed(1)}Q${a.x.toFixed(1)} ${a.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
                strokeWidth={((a.w + b.w) / 2).toFixed(2)}
            />
        );
    }
    return out;
}

/* One stroke, redrawn only when it changes. A doodle over a whole page can
   run to thousands of points; strokes are replaced rather than added to in
   place, so a finished one keeps its identity and only the one being drawn
   re-renders. */
const Stroke = memo(function Stroke({ points, upto, id }: { points: Pt[]; upto: number; id: string }) {
    return <g>{pieces(points, upto, id)}</g>;
});

/**
 * Everything the eraser leaves of `ink` after passing from `a` to `b`: points
 * within reach of that path are taken out, and a stroke broken in the middle
 * becomes two. The path is sampled every few pixels, so a fast sweep erases
 * the whole way along rather than in dots.
 */
function erase(ink: Ink, a: { x: number; y: number }, b: { x: number; y: number }): Ink {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
    const probes = Array.from({ length: steps + 1 }, (_, i) => ({
        x: a.x + ((b.x - a.x) * i) / steps,
        y: a.y + ((b.y - a.y) * i) / steps,
    }));
    const hit = (p: Pt) => probes.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= ERASE_R + p.w / 2);

    let changed = false;
    const out: Ink = [];
    for (const s of ink) {
        if (!s.some(hit)) {
            out.push(s);
            continue;
        }
        changed = true;
        let run: Pt[] = [];
        for (const p of s) {
            if (hit(p)) {
                if (run.length > 1) out.push(run);
                run = [];
            } else {
                run.push(p);
            }
        }
        if (run.length > 1) out.push(run);
    }
    return changed ? out : ink;
}

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
/* Nothing to subscribe to — the platform does not change under a page. */
const still = () => () => {};

/**
 * The whole page, as one sheet to draw on.
 *
 * The ink sits above everything, so a doodle can go over words and pictures
 * alike, and it stays — through scrolling, through the dock being folded —
 * until it is cleared, erased, undone or the page is reloaded. Drawing only
 * happens with a pen in hand, picked up from the dock: with none, the sheet
 * lets every click and every swipe through to the page as normal; with one,
 * it takes them — which on a phone means the page holds still under the
 * finger until the pen is put down again. Folding the dock sets the pen
 * aside, so the page is the page again; opening it hands the same pen back.
 *
 * Two pens: the sign pen's nib and the eraser. With a keyboard: D for the
 * dock, S for the sign pen, E for the eraser, C to clear, Esc to fold the
 * dock, and the usual undo and redo.
 */
export default function DoodleArea({ children }: { children: React.ReactNode }) {
    const area = useRef<HTMLDivElement>(null);
    /* the dock, open or folded */
    const [on, setOn] = useState(false);
    /* the pen picked, if any — only in hand while the dock is open */
    const [tool, setTool] = useState<Tool | null>(null);
    const held = on ? tool : null;

    const [ink, setInk] = useState<Ink>([]);
    const [past, setPast] = useState<Ink[]>([]);
    const [future, setFuture] = useState<Ink[]>([]);
    const [cut, setCut] = useState<number | null>(null);

    const down = useRef(false);
    const before = useRef<Ink>([]);
    const last = useRef({ x: 0, y: 0, t: 0, w: 0 });
    const raf = useRef(0);

    const rewinding = cut !== null;
    const total = ink.reduce((n, s) => n + s.length, 0);

    /* what the last gesture changed goes on the history, and anything that
       had been undone is no longer there to redo */
    const commit = (was: Ink) => {
        setPast((p) => [...p, was]);
        setFuture([]);
    };

    const undo = () => {
        if (!past.length || rewinding || down.current) return;
        setFuture((f) => [...f, ink]);
        setInk(past[past.length - 1]);
        setPast((p) => p.slice(0, -1));
    };

    const redo = () => {
        if (!future.length || rewinding || down.current) return;
        setPast((p) => [...p, ink]);
        setInk(future[future.length - 1]);
        setFuture((f) => f.slice(0, -1));
    };

    /* Clear rewinds: the ink un-draws, last point first, all the way
       back to the first touch — taken back in the order it was given.
       And it can be undone, like anything else. */
    const clear = () => {
        if (!total || rewinding) return;
        const was = ink;
        const n = total;
        const per = 2 + ((100 - clamp(REWIND, 0, 100)) / 100) * 8;
        const dur = clamp(n * per, 350, 2400);
        const t0 = performance.now();
        const step = (t: number) => {
            const k = Math.min(1, (t - t0) / dur);
            setCut(Math.round(n * (1 - ease(k))));
            if (k < 1) {
                raf.current = requestAnimationFrame(step);
                return;
            }
            setInk([]);
            setCut(null);
            commit(was);
        };
        raf.current = requestAnimationFrame(step);
    };

    /* folding the dock sets the pen aside; opening it picks it back up */
    const toggle = () => setOn((o) => !o);
    /* a pen picked up a second time is put down */
    const pick = (next: Tool) => setTool((t) => (t === next ? null : next));

    useEffect(() => () => cancelAnimationFrame(raf.current), []);

    /* A tool for the site's owner, and only on a development build: X with
       the dock open copies everything drawn so far — each stroke's points in
       the order they were drawn, with the pen's width at each — as JSON, so
       a signature signed here can be handed over and set in the footer
       stroke for stroke. */
    const copyInk = () => {
        const strokes = ink.map((s) => s.map((p) => [Math.round(p.x), Math.round(p.y), Number(p.w.toFixed(2))]));
        const json = JSON.stringify({ strokes });
        navigator.clipboard?.writeText(json).catch(() => undefined);
        console.info(`Doodle ink — ${strokes.length} strokes, copied to the clipboard:
${json}`);
    };

    // The keyboard. Never while typing — the contact form is on this page,
    // and its own undo has to keep working — and never with a modifier on a
    // letter, which belongs to the browser.
    const keys = useRef<(e: KeyboardEvent) => void>(() => {});
    useEffect(() => {
        keys.current = (e: KeyboardEvent) => {
            const t = e.target;
            if (t instanceof Element && t.closest("input, textarea, select, [contenteditable='true']")) return;
            const mod = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();

            if (mod && key === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
                return;
            }
            if (mod && key === "y") {
                e.preventDefault();
                redo();
                return;
            }
            if (mod || e.altKey) return;

            if (key === "d") toggle();
            else if (key === "escape" && on) setOn(false);
            else if (key === "s" && on) pick("sign");
            else if (key === "e" && on) pick("erase");
            else if (key === "c" && on) clear();
            else if (key === "x" && on && process.env.NODE_ENV === "development") copyInk();
        };
    });
    useEffect(() => {
        const handler = (e: KeyboardEvent) => keys.current(e);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    /* the pointer, in the sheet's own pixels */
    const local = (e: React.PointerEvent) => {
        const r = area.current!.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!held || rewinding) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        // No text selection, and no scrolling, starting from a stroke.
        e.preventDefault();
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            /* a scripted pointer */
        }
        down.current = true;
        before.current = ink;
        const p = local(e);
        const w = (THIN + THICK) / 2;
        last.current = { ...p, t: performance.now(), w };
        if (held === "erase") setInk((all) => erase(all, p, p));
        else setInk((all) => [...all, [{ ...p, w }]]);
    };

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!down.current) return;
        const raw = local(e);
        const l = last.current;

        if (held === "erase") {
            last.current = { ...l, x: raw.x, y: raw.y };
            setInk((all) => erase(all, l, raw));
            return;
        }

        /* smoothing: the pen follows the hand on a lag */
        const k = 1 - (clamp(SMOOTH, 0, 100) / 100) * 0.75;
        const x = l.x + (raw.x - l.x) * k;
        const y = l.y + (raw.y - l.y) * k;
        const d = Math.hypot(x - l.x, y - l.y);
        if (d < 0.8) return;
        const t = performance.now();

        const v = d / Math.max(1, t - l.t);
        /* fast is thin, slow pools; and the width itself eases, so
           a single quick frame cannot make a notch in the line */
        const target = THICK - (THICK - THIN) * clamp(v / 1.6, 0, 1);
        const w = l.w + (target - l.w) * 0.35;
        last.current = { x, y, t, w };
        setInk((all) => [...all.slice(0, -1), [...all[all.length - 1], { x, y, w }]]);
    };

    const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* never captured */
        }
        if (!down.current) return;
        down.current = false;
        if (ink !== before.current) commit(before.current);
    };

    /* draw up to the cut, stroke by stroke */
    const strokes: React.ReactNode[] = [];
    let left = cut ?? Infinity;
    ink.forEach((s, i) => {
        if (left <= 0) return;
        strokes.push(<Stroke key={i} id={String(i)} points={s} upto={left} />);
        left -= s.length;
    });

    return (
        <div ref={area} className="relative">
            {children}

            {/* The sheet, in two layers. What takes the pen sits over the
                whole page and its menus — everything but the dock, which has
                to stay in reach to put the pen down again — and lets
                everything through until a pen is in hand. The ink itself is
                the very front of the page, over the dock too, so nothing on
                it is out of reach of a doodle; only the intro's curtains and
                the dialogs that open over the page are above it. */}
            <div
                data-tool={held ?? undefined}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className={cn(
                    "doodle-sheet absolute inset-0 z-[44]",
                    held ? "pointer-events-auto touch-none select-none" : "pointer-events-none"
                )}
            />
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[85] h-full w-full overflow-visible text-ink opacity-85"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {strokes}
            </svg>

            <DoodleDock
                on={on}
                tool={held}
                canUndo={past.length > 0 && !rewinding}
                canRedo={future.length > 0 && !rewinding}
                canClear={total > 0 && !rewinding}
                onToggle={toggle}
                onUndo={undo}
                onRedo={redo}
                onSign={() => pick("sign")}
                onErase={() => pick("erase")}
                onClear={clear}
            />
        </div>
    );
}

/* The core's icon, and what it becomes: a scribble, and an X to put it away.
   Both are drawn with the same commands — two pieces of two curves each —
   so one can be tweened into the other number by number. The X's curves are
   straight lines with their handles laid along them. */
const SCRIBBLE =
    "M3.5 16.5 C6.5 12 10.5 5 14 5.5 C17.5 6 10 16 12.5 18.5 M12.5 18.5 C14.5 20.5 16 12.5 18 13 C20 13.5 18 18 20.5 18.5";
const CLOSE =
    "M6 6 C8 8 10 10 12 12 C14 14 16 16 18 18 M18 6 C16 8 14 10 12 12 C10 14 8 16 6 18";

/* The sign pen's icon: a fountain-pen nib, drawn point down — collar, body,
   and the breather hole and slit cut out of it — then turned to point down
   and to the left. The sign-pen cursor in globals.css is the same path, so
   the button and the pointer read as one pen. */
const NIB =
    "M8.8 1.5h6.4a.8.8 0 0 1 .8.8v1.9a.8.8 0 0 1-.8.8H8.8a.8.8 0 0 1-.8-.8V2.3a.8.8 0 0 1 .8-.8Z" +
    "M8 6.4h8v3.1c0 4-2.5 8.5-4 13-1.5-4.5-4-9-4-13Z" +
    "M13.5 11.4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 1 1 3 0Z" +
    "M11.45 12.9h1.1V20h-1.1Z";

function Nib({ size = 24, ...props }: LucideProps) {
    return (
        <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" transform="rotate(45 12 12)" d={NIB} />
        </svg>
    );
}

/* The options, nearest the core first. Each is dealt out to the left of the
   core in turn — the Radial menu's `stagger`, along a row instead of round an
   arc — one button's width plus a hair apart. On a phone the row spans the
   top of the screen instead: the six buttons spread evenly between the
   dock's 1rem margins, so the gaps between them match and the row sits
   square on the screen. */
const STEP = [
    "-translate-x-[calc((100vw_-_4.75rem)/5)] sm:-translate-x-[3rem]",
    "-translate-x-[calc((100vw_-_4.75rem)*2/5)] sm:-translate-x-[6rem]",
    "-translate-x-[calc((100vw_-_4.75rem)*3/5)] sm:-translate-x-[9rem]",
    "-translate-x-[calc((100vw_-_4.75rem)*4/5)] sm:-translate-x-[12rem]",
    "-translate-x-[calc(100vw_-_4.75rem)] sm:-translate-x-[15rem]",
];
const DELAY = ["[transition-delay:0ms]", "[transition-delay:28ms]", "[transition-delay:56ms]", "[transition-delay:84ms]", "[transition-delay:112ms]"];

/* A click or tap leaves no focus behind, so a shortcut pressed after it does
   not light the button's keyboard ring. Enter and Space (`detail` 0) keep
   focus where it is, ring and all. */
const press = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.detail) e.currentTarget.blur();
    action();
};

/* The tool names under the buttons, on hover — never on a touch screen,
   which has no keys to offer. */
const TIP =
    "pointer-events-none absolute top-[calc(100%+6px)] whitespace-nowrap font-mono text-[0.5625rem] not-italic uppercase tracking-[0.08em] text-ink-3 opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-hover:opacity-100";

/**
 * The doodle dock: one button, the size of the tools it holds. Pressed, the
 * scribble on it turns into an X, with a little give, and the tools deal out
 * from it in a row; pressed again, they fold back, the drawing left where it
 * is and the pen set aside until the dock is opened again. A pen in hand is
 * a solid disc in the row; one put down is glass.
 *
 * Top right on every screen; below `lg` the hero's top row is set low
 * enough to clear it.
 *
 * The resume sits just left of it, the same glass — and steps aside while
 * the dock is open, the tools dealing out over where it was.
 */
function DoodleDock({
    on,
    tool,
    canUndo,
    canRedo,
    canClear,
    onToggle,
    onUndo,
    onRedo,
    onSign,
    onErase,
    onClear,
}: {
    on: boolean;
    tool: Tool | null;
    canUndo: boolean;
    canRedo: boolean;
    canClear: boolean;
    onToggle: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSign: () => void;
    onErase: () => void;
    onClear: () => void;
}) {
    // Read on the client only, with the server's answer as "not a Mac", so
    // the shortcut labels never disagree with the server-rendered page.
    const mac = useSyncExternalStore(still, isMac, () => false);
    const mod = mac ? "⌘" : "Ctrl ";

    // The core's wobble: the scribble and the X reshape into each other past
    // where they settle and back, and the icon rocks as it goes.
    const icon = useRef<SVGSVGElement>(null);
    const shape = useRef<SVGPathElement>(null);
    const first = useRef(true);
    useEffect(() => {
        const svg = icon.current;
        const path = shape.current;
        if (!svg || !path) return;
        if (first.current) {
            first.current = false;
            return;
        }
        const d = on ? CLOSE : SCRIBBLE;
        if (!motionEnabled()) {
            gsap.set(path, { attr: { d } });
            return;
        }
        gsap.to(path, { attr: { d }, duration: 0.6, ease: "back.out(2.4)", overwrite: true });
        gsap.fromTo(
            svg,
            { rotate: on ? -28 : 28 },
            { rotate: 0, duration: 0.9, ease: "elastic.out(1.1, 0.4)", overwrite: true }
        );
    }, [on]);

    const options = [
        { key: "sign", label: "Sign pen", keys: "S", Icon: Nib, action: onSign, enabled: true, active: tool === "sign" },
        { key: "erase", label: "Erase", keys: "E", Icon: Eraser, action: onErase, enabled: true, active: tool === "erase" },
        { key: "clear", label: "Clear", keys: "C", Icon: Trash2, action: onClear, enabled: canClear, active: false },
        { key: "redo", label: "Redo", keys: mac ? "⇧⌘Z" : "Ctrl Y", Icon: Redo2, action: onRedo, enabled: canRedo, active: false },
        { key: "undo", label: "Undo", keys: `${mod}Z`, Icon: Undo2, action: onUndo, enabled: canUndo, active: false },
    ];

    return (
        <div
            data-chrome
            data-surface="glass"
            className="doodle-dock fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[45] flex items-center gap-2 lg:right-6 lg:top-6"
        >
            <div
                inert={on}
                className={cn(
                    "transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    on && "pointer-events-none scale-90 opacity-0"
                )}
            >
                <ResumeButton />
            </div>
            <div role="toolbar" aria-label="Doodle" className="relative h-11 w-11">
                {options.map((o, i) => (
                    <button
                        key={o.key}
                        type="button"
                        onClick={press(o.action)}
                        disabled={!o.enabled}
                        tabIndex={on ? 0 : -1}
                        aria-hidden={!on}
                        aria-label={o.label}
                        aria-pressed={o.key === "sign" || o.key === "erase" ? o.active : undefined}
                        className={cn(
                            "group absolute inset-0 rounded-full",
                            "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            "disabled:cursor-default",
                            on
                                ? cn(STEP[i], DELAY[i], o.enabled ? "opacity-100" : "opacity-40")
                                : "pointer-events-none translate-x-0 scale-75 opacity-0"
                        )}
                    >
                        {/* The glass is a layer of its own: its stylesheet
                            makes whatever carries it `position: relative`,
                            and the button has to stay where it was dealt.
                            A pen in hand trades it for the core's solid ink,
                            so on and off read apart at a glance. */}
                        <span
                            className={cn(
                                "grid h-full w-full place-items-center rounded-full transition-colors duration-200",
                                o.active ? "bg-ink text-on-ink" : "gpane"
                            )}
                        >
                            <o.Icon size={17} strokeWidth={2} aria-hidden="true" />
                        </span>
                        <i className={TIP}>
                            {o.label} · {o.keys}
                        </i>
                    </button>
                ))}

                {/* The core: the dock, open and folded. The same size as the
                    tools, set apart by being filled — white on the page's
                    black — and it keeps the Radial menu's give when it is
                    pressed. */}
                <button
                    type="button"
                    onClick={press(onToggle)}
                    aria-expanded={on}
                    aria-label={on ? "Close doodle tools" : "Open doodle tools"}
                    className="group absolute inset-0 z-10 grid place-items-center rounded-full bg-ink text-on-ink transition-transform duration-[380ms] ease-[cubic-bezier(0.24,1.34,0.38,1)] active:scale-90"
                >
                    <svg
                        ref={icon}
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path ref={shape} d={SCRIBBLE} />
                    </svg>
                    <i className={TIP}>{on ? "Close" : "Doodle"} · D</i>
                </button>
            </div>
        </div>
    );
}
