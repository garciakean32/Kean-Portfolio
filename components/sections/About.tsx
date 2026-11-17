"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import SectionMark from "@/components/shared/SectionMark";
import Sketch from "@/components/shared/Sketch";
import { loopArrow } from "@/components/shared/doodles";
import { RevealText } from "@/components/motion/Reveal";
import { Portrait, driftPortraits, masthead } from "@/components/shared/Portrait";
import { ThreadLines, type Thread } from "@/components/shared/Thread";
import { TextMorph } from "@/components/ui/text-morph";
import ExperienceDialog from "@/components/sections/ExperienceDialog";
import { aboutFacts, personal } from "@/lib/data";
import { bowLine, dropLine, handLine, sineInOut, type Pt2 } from "@/lib/hand";
import { fadeUp, gsap, motionEnabled, useGsap } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** The poster voice: uppercase display, set tight and heavy. */
const POSTER =
    "font-display text-d4 font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-ink";

/**
 * Every section here owns at least one full screen, with its content centred
 * in it — so whichever one a reader is in, the next is a clear scroll away
 * rather than already crowding in from below.
 */
const SCREEN = "flex min-h-[100svh] flex-col justify-center py-20 md:py-28";

/* The button's hint: an arrow thrown down and to the left from the word,
   onto the button's top — the video frame's "Pull me", said again. */
const CLICK_HINT = loopArrow([56, 0], [0, 30]);

/**
 * Who is building it, and how he got here — two sections in the same
 * language.
 *
 * Both are built the same way: a small rule-and-label across the top, a name
 * or a title set as large uppercase display on one side, and a photograph on
 * the other set inside a frame of type. Under each, the detail — the bio and
 * a line cycling through a few facts in the first, the stops of the story in
 * the second, each with what it was set out to its right the way a date would
 * be.
 *
 * Every photograph on this page is the same shape and the same size on
 * purpose. The old layout gave each one its own crop and its own column width
 * and the section never settled; one frame repeated is what makes a run of
 * pictures read as a set.
 */
export default function About() {
    const head = useRef<HTMLDivElement>(null);
    const facts = useRef<HTMLParagraphElement>(null);
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        /* The label. The name and the bio reveal themselves — see
           `RevealText` — and so does the photograph. */
        const head = q(".js-head")[0];
        fadeUp(q(".js-mark"), { trigger: head, start: "top 82%" });

        /* The facts, on their own screen — cued by it, not by the masthead */
        const facts = q(".js-facts")[0];
        fadeUp(q(".js-facts-in"), { trigger: facts, start: "top 60%" });

        driftPortraits(el);
    });

    const loop = useFactsLoop(scope, head, facts, aboutFacts);

    return (
        <section id="about" ref={scope} className="relative overflow-hidden bg-paper">
            <div className={SCREEN}>
                <div className={cn("js-head shell mx-auto w-full max-w-shell", masthead.column)}>
                    <SectionMark as="h2" label="About" className="js-mark" />

                    <div ref={head} className={masthead.grid}>
                        <div className={cn(masthead.text, "lg:col-span-7")}>
                            {/* One line at a time, each a beat after the
                                last, so the name reads down the page. */}
                            <h3 className={cn(POSTER, masthead.title)}>
                                <RevealText text="Hello, I'm" innerClassName={masthead.centred} />
                                <RevealText text="Kean Valgere" delay={0.18} innerClassName={masthead.centred} />
                                <RevealText
                                    text="Garcia"
                                    delay={0.36}
                                    className="text-ink-3"
                                    innerClassName={masthead.centred}
                                />
                            </h3>

                            <p className={cn(masthead.copy, "lg:mt-10")}>
                                <RevealText
                                    text={personal.bio}
                                    delay={0.4}
                                    stagger={0.012}
                                    distance={12}
                                    innerClassName={masthead.centred}
                                />
                            </p>
                        </div>

                        <Portrait
                            src="/images/kean suit.png"
                            alt={personal.name}
                            className="lg:col-span-4 lg:col-start-9"
                        />
                    </div>
                </div>
            </div>

            {/* A few facts, one at a time, morphing from each into the next —
                on a screen of their own, so a reader who stops on them sees
                nothing else. The email is not among them; it lives with the
                form in the contact section. The full list is read out once
                for screen readers, since the morph itself is decoration.

                The same size as the section titles, so the screen reads as
                one of them — except on a phone, a step under, so the ring
                round them can keep the desktop's wide shape inside the
                screen's width. "1+ years of coding" is the longest, 8.3x its
                own size wide, and fits the column at every width. The type
                is set on the line rather than on the morph so
                `min-h` can reserve it before the morph has measured itself —
                otherwise the screen jumps on hydration.

                Most of a screen below `lg` rather than all of one: the ring
                is wider than it is tall there too, and a whole upright
                screen round it was mostly empty. */}
            <div className="js-facts shell relative mx-auto flex min-h-[70svh] w-full max-w-shell items-center justify-center lg:min-h-[100svh]">
                <p ref={facts} className="js-facts-in relative z-10 min-h-[1.1em] text-center font-display text-[clamp(1.5rem,7.4vw,1.75rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-d4">
                    <TextMorph words={aboutFacts} interval={1100} morphDuration={560} />
                    <span className="sr-only">{aboutFacts.join(", ")}</span>
                </p>
            </div>

            {/* A line from the middle of the page under the masthead, down
                and twice round the facts — a hand-drawn ring round them, with
                its tail running back to where the reader came from — and out
                of the bottom of the ring, down to the foot of the section in
                the middle, where the experience section's thread picks it up.
                Measured from where the two actually are, see
                `useFactsLoop`, and drawn as the page scrolls down it. */}
            <ThreadLines thread={loop} />
        </section>
    );
}

/**
 * The ring round the facts: its tail starts a little left of the middle of
 * the page, just under the masthead — the name, the bio and the photograph —
 * sweeps down in one smooth stroke to the ring's upper left, and the line
 * goes round twice — then on along the bottom and out of it, down to the foot
 * of the section in the middle, so the thread carries on into the next.
 *
 * It is big on purpose: most of the screen's height, so the ring holds a lot
 * of open space round the facts rather than leaving the screen bare outside
 * it, and only a third as wide again as it is tall, so it reads as a ring
 * rather than a band. Never smaller than it needs to be to stay clear of the
 * words, either — it is sized against the widest of the facts, measured in
 * the line's own font, not whichever one is showing, so the line never
 * crosses them as they change. On a phone or an upright tablet it is held
 * inside the width of the screen and keeps the same shape, shorter, rather
 * than running tall.
 *
 * And it is drawn the way a hand draws one. The two passes are not one
 * ellipse traced twice: each is its own, centred a little differently, a
 * touch wider or taller, tipped a degree or two — so they cross each other
 * here and there instead of running round in parallel like a compass's.
 */
function useFactsLoop(
    section: React.RefObject<HTMLElement | null>,
    from: React.RefObject<HTMLElement | null>,
    around: React.RefObject<HTMLElement | null>,
    words: string[]
) {
    const [path, setPath] = useState<Thread | null>(null);

    useLayoutEffect(() => {
        const box = section.current;
        const start = from.current;
        const line = around.current;
        const host = line?.parentElement;
        if (!box || !start || !line || !host) return;
        const ctx = document.createElement("canvas").getContext("2d");

        const measure = () => {
            const o = box.getBoundingClientRect();
            const a = start.getBoundingClientRect();
            const style = getComputedStyle(line);
            const size = parseFloat(style.fontSize);

            let widest = line.offsetWidth;
            if (ctx) {
                ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing;
                widest = Math.max(...words.map((word) => ctx.measureText(word).width));
            }

            // The centre of the text, in the section's pixels. Across, the
            // line's own middle; down, the middle of its screen — the line
            // itself is still lifted by its reveal when this first runs.
            const l = line.getBoundingClientRect();
            const h = host.getBoundingClientRect();
            const cx = l.left - o.left + l.width / 2;
            const cy = h.top - o.top + h.height / 2;

            // 36% of the screen's height up and down from the centre, and
            // 1.35x that across — held inside the screen, with room for the
            // passes to wander, and kept that shape when it is: shorter,
            // not taller — and never so small that the words' box reaches
            // past 62% of the way to the line, which leaves room for the
            // passes to wander inwards too.
            const halfW = widest / 2;
            const halfH = size * 0.55;
            const room = Math.min(cx, o.width - cx) - 8;
            let ry = Math.max(h.height * 0.36, halfH * 2.6);
            const rx = Math.min(Math.max(ry * 1.35, halfW / 0.8), room / 1.09);
            ry = Math.min(ry, rx / 1.35);
            ry = Math.max(ry, halfH / Math.sqrt(Math.max(0.62 - (halfW / rx) ** 2, 0.04)));

            // A point on the ring, `t` of the way through both passes. Each
            // pass is its own slightly different ellipse — the centre
            // drifting, the width and height breathing, the whole thing
            // tipping a little — which is what makes the two cross.
            const at = (th: number, t: number) => {
                const ox = rx * 0.045 * Math.cos(Math.PI * t);
                const oy = ry * 0.05 * Math.sin(Math.PI * t + 0.6);
                const sx = rx * (1 + 0.03 * Math.sin(2 * Math.PI * t + 0.4));
                const sy = ry * (0.97 + 0.06 * t);
                const tilt = 0.07 * (t - 0.5);
                const wobble = 1 + 0.012 * Math.sin(3 * th + 4 * t);
                const ex = sx * wobble * Math.cos(th);
                const ey = sy * wobble * Math.sin(th);
                return {
                    x: cx + ox + ex * Math.cos(tilt) - ey * Math.sin(tilt),
                    y: cy + oy + ex * Math.sin(tilt) + ey * Math.cos(tilt),
                };
            };

            // It joins the ring at the upper left. One curve and no wiggle:
            // it leaves heading straight down and arrives already running the
            // way the ring runs from there — down and round by the left — so
            // the two read as one stroke of the pen.
            const enter = (3 * Math.PI) / 2 - 0.6;
            const join = at(enter, 0);
            const next = at(enter - 0.01, 0);
            const sx = o.width / 2 - o.width * 0.06;
            const sy = a.bottom - o.top + 32;
            const reach = Math.hypot(join.x - sx, join.y - sy) * 0.4;
            const along = Math.hypot(next.x - join.x, next.y - join.y);
            const c2x = join.x - ((next.x - join.x) / along) * reach;
            const c2y = join.y - ((next.y - join.y) / along) * reach;
            const tail = `M${sx.toFixed(1)} ${sy.toFixed(1)} C${sx.toFixed(1)} ${(sy + reach).toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${join.x.toFixed(1)} ${join.y.toFixed(1)}`;

            // Twice round, and on past where it started — down the left and
            // along the bottom, to just short of the bottom's middle, still
            // running the way the ring runs.
            const ring: string[] = [];
            const turns = 5 * Math.PI - 0.95;
            for (let i = 1; i <= 270; i++) {
                const t = i / 270;
                const p = at(enter - t * turns, t);
                ring.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
            }

            // Then it leaves the ring the way it is heading and bends down
            // to the foot of the section, in the middle — where the line in
            // the section below picks it up.
            const last = at(enter - turns, 1);
            const prev = at(enter - turns + 0.01, 1);
            const run = Math.hypot(last.x - prev.x, last.y - prev.y);
            const ex = o.width / 2;
            const ey = o.height + 2;
            const pull = Math.hypot(ex - last.x, ey - last.y) * 0.45;
            const leave = `C${(last.x + ((last.x - prev.x) / run) * pull).toFixed(1)} ${(last.y + ((last.y - prev.y) / run) * pull).toFixed(1)} ${ex.toFixed(1)} ${(ey - pull).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;

            setPath({
                w: Math.round(o.width),
                h: Math.round(o.height),
                // Three strokes, end to end: the tail down to the ring; the
                // ring itself, drawn quickly and done by the time the facts
                // are mid-screen; and the way out of it, down to the next
                // section.
                lines: [
                    tail,
                    { d: `M${join.x.toFixed(1)} ${join.y.toFixed(1)} L${ring.join(" L")}`, until: cy },
                    `M${last.x.toFixed(1)} ${last.y.toFixed(1)} ${leave}`,
                ],
            });
        };

        measure();
        // The facts are measured in their own font, which may land later.
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        return () => observer.disconnect();
    }, [section, from, around, words]);

    return path;
}

/**
 * How I got here — its own section so the menu can take a reader straight to
 * it. The photograph and the title share a screen; the button that opens the
 * story itself as a full-screen carousel of cards has the next one to itself.
 */
export function Experience() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        const story = q(".js-story")[0];
        fadeUp(q(".js-story-mark"), { trigger: story, start: "top 84%" });

        // The button only fades in: it holds still.
        const cta = q(".js-story-cta")[0];
        fadeUp(q(".js-story-cta-in"), { trigger: cta, start: "top 60%", y: 0 });

        driftPortraits(el);
    });

    const head = useRef<HTMLDivElement>(null);
    const target = useRef<HTMLDivElement>(null);
    const thread = useThread(scope, head, target);
    const cta = useRef<HTMLDivElement>(null);
    const calls = useCallArrows(cta, target);
    const [pointing, setPointing] = useState(false);
    const [held, setHeld] = useState(false);
    const ink = useRef({ p: 0 });
    const settle = useRef<(() => void) | null>(null);

    // Pressed, the arrows stay pointing at the button — whatever the pointer
    // does, the page opening over them included — until the page it opens
    // is closed again. Not all in yet — never started, as on a touch screen,
    // included — they finish first and the page waits for them, the button
    // saying so. On a phone there are none, and it opens straight away.
    // Arrows gone from under a page waiting on them — the window narrowed to
    // a phone's — and it stops waiting.
    useEffect(() => {
        if (calls) return;
        settle.current?.();
        settle.current = null;
    }, [calls]);
    const holdArrows = () => {
        if (!calls) return;
        setHeld(true);
        if (ink.current.p >= 1) return;
        return new Promise<void>((resolve) => {
            settle.current = resolve;
        });
    };
    const arrowsDrawn = () => {
        settle.current?.();
        settle.current = null;
    };

    return (
        <section id="experience" ref={scope} className="relative overflow-hidden bg-paper">
            <div className={SCREEN}>
                <div className={cn("js-story shell mx-auto w-full max-w-shell", masthead.column)}>
                    <SectionMark as="h2" label="Experience" className="js-story-mark" />

                    <div ref={head} className={masthead.grid}>
                        <Portrait
                            src="/images/kean grad.jpg"
                            alt={`${personal.name} at his college graduation`}
                            className="lg:col-span-4"
                        />

                        <div className={cn(masthead.text, "lg:col-span-7 lg:col-start-6")}>
                            <h3 className={cn(POSTER, masthead.title)}>
                                <RevealText text="My" innerClassName={masthead.centred} />
                                <RevealText
                                    text="Experience"
                                    delay={0.18}
                                    className="text-ink-3"
                                    innerClassName={masthead.centred}
                                />
                            </h3>
                            <p className={cn(masthead.copy, "lg:mt-8")}>
                                <RevealText
                                    text="Every step that brought me here, from university to the work I do now — the places that taught me, the things I made along the way, and what each one added to how I build. Open them all with the button below."
                                    delay={0.3}
                                    stagger={0.012}
                                    distance={12}
                                    innerClassName={masthead.centred}
                                />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* The button, on a screen of its own — and, while a mouse is on
                it or once it is pressed, five arrows at it from round the
                screen; see `CallArrows`. Most of a screen below `lg`, and
                no arrows on a phone. */}
            <div ref={cta} className="js-story-cta relative flex min-h-[65svh] items-center justify-center lg:min-h-[100svh]">
                {calls && (
                    <CallArrows
                        art={calls}
                        on={pointing || held}
                        ink={ink}
                        onDrawn={arrowsDrawn}
                    />
                )}
                <div className="js-story-cta-in relative">
                    {/* Click me, for a visitor who would not think to — out
                        of the way while the arrows point, and back once
                        they have gone. */}
                    <span
                        aria-hidden="true"
                        className={cn(
                            "pointer-events-none absolute bottom-[calc(100%+0.375rem)] left-[calc(100%-4.5rem)] flex items-start gap-1 transition-opacity duration-500 md:left-[calc(100%-2.5rem)]",
                            pointing || held ? "opacity-0" : "delay-700"
                        )}
                    >
                        <Sketch lines={CLICK_HINT} weight={1.6} duration={0.7} wander={0.3} className="w-9 md:w-11" />
                        <span className="-mt-1.5 whitespace-nowrap font-mono text-label uppercase text-ink-3">Click me</span>
                    </span>
                    {/* Hover is a mouse's; a touch draws them on the press. */}
                    <div
                        ref={target}
                        onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") setPointing(true);
                        }}
                        onPointerLeave={() => setPointing(false)}
                    >
                        <ExperienceDialog
                            beforeOpen={holdArrows}
                            onClosed={() => setHeld(false)}
                        />
                    </div>
                </div>
            </div>

            {/* The thread through the section, in three pieces and all of it
                down the middle: in from the section above until just short
                of the masthead, which it leaves alone; on again under it,
                down to the button, stopping just short of it; and on again
                just past the button, to the section below. Laid out in the
                section's own pixels, from where everything actually is, and
                again whenever the section changes size; drawn as the page
                scrolls down it. */}
            <ThreadLines thread={thread} />
        </section>
    );
}

/* How far the thread stops short of the button, above it and below: enough
   that the button stands on its own rather than being run through. */
const BUTTON_GAP = 20;

/**
 * The thread through the experience section, in `section`'s own pixels:
 *
 * - in from the top edge, in the middle — where the line round the facts
 *   leaves the section above — and stopping short of the masthead, `story`;
 * - on again from the middle just under `from`, the photograph and the title,
 *   down to just above `to`, the button;
 * - and on from just below the button to the bottom edge, in the middle,
 *   where the line in the video section picks it up.
 *
 * Measured, because where these sit depends on the screen: the masthead is a
 * row on a desktop and a column on a phone, and the button is half a screen
 * further down either way.
 */
function useThread(
    section: React.RefObject<HTMLElement | null>,
    from: React.RefObject<HTMLElement | null>,
    to: React.RefObject<HTMLElement | null>
) {
    const [path, setPath] = useState<{ w: number; h: number; lines: string[] } | null>(null);

    useLayoutEffect(() => {
        const box = section.current;
        const start = from.current;
        const end = to.current;
        const story = box?.querySelector(".js-story");
        if (!box || !start || !end || !story) return;

        const measure = () => {
            const o = box.getBoundingClientRect();
            const a = start.getBoundingClientRect();
            const b = end.getBoundingClientRect();
            const s = story.getBoundingClientRect();
            const mid = o.width / 2;
            const bx = b.left - o.left + b.width / 2;
            setPath({
                w: Math.round(o.width),
                h: Math.round(o.height),
                lines: [
                    dropLine(mid, -2, mid + 4, s.top - o.top - 24, 0.03),
                    bowLine(mid, a.bottom - o.top + 32, bx, b.top - o.top - BUTTON_GAP, 0.12),
                    dropLine(bx, b.bottom - o.top + BUTTON_GAP, mid, o.height + 2, -0.04),
                ],
            });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        return () => observer.disconnect();
    }, [section, from, to]);

    return path;
}

/* The calls, round the button clockwise from the top left — the thread has
   the top to itself, and the foot below the button too. Each starts off the
   edge of the screen (`from`, in fractions of it), passes through `via`, and
   comes in to a tip off one side of the button — `tip` is which side, -1, 0
   or 1 across and down, then how far past it in pixels — the last stretch
   coming in from `come`, in pixels from the tip. `at` is its beat in the
   drawing: the top left and the bottom together, then the top right, the
   bottom left, and the bottom right last. */
const CALLS: {
    from: Pt2;
    via: Pt2[];
    tip: [number, number, number, number];
    come: Pt2;
    width: number;
    at: number;
}[] = [
    { from: [-0.04, -0.05], via: [[0.18, 0.22]], tip: [-1, 0, -40, -30], come: [-90, -30], width: 2.8, at: 0 },
    { from: [0.8, -0.05], via: [[0.7, 0.15], [0.72, 0.3]], tip: [1, 0, 40, -34], come: [85, -40], width: 2.4, at: 1 },
    { from: [1.04, 0.78], via: [[0.86, 0.72]], tip: [1, 0, 36, 30], come: [90, 30], width: 2.2, at: 3 },
    { from: [0.6, 1.05], via: [[0.66, 0.9]], tip: [0, 1, 40, 40], come: [30, 110], width: 3, at: 0 },
    { from: [-0.04, 0.78], via: [[0.18, 0.88], [0.27, 0.72]], tip: [-1, 0, -36, 34], come: [-80, 50], width: 2.6, at: 2 },
];

/* Below this width — a phone — there are no calls: the button is the
   screen's one thing there, with only its "Click me". */
const NARROW = 640;

/* The pen's pause lifting from a shaft to its head, in pixels of line it
   could have drawn instead. */
const LIFT_HEAD = 60;

/* In seconds: how long each arrow takes to draw, shaft and head; how far
   apart the beats they start on are; and how long they all take to rewind
   together. */
const ARROW_TIME = 0.9;
const STAGGER = 0.1;
const CLEAR_TIME = 1.2;

/**
 * The calls' strokes in the screen's own pixels, in the order the pen takes
 * them — each shaft, then its head — measured from where the button actually
 * is and redrawn whenever the screen changes size.
 */
function useCallArrows(
    screen: React.RefObject<HTMLElement | null>,
    button: React.RefObject<HTMLElement | null>
) {
    const [art, setArt] = useState<{
        w: number;
        h: number;
        strokes: { d: string; len: number; width: number }[];
    } | null>(null);

    useLayoutEffect(() => {
        const box = screen.current;
        const end = button.current;
        if (!box || !end) return;

        const measure = () => {
            const o = box.getBoundingClientRect();
            const b = end.getBoundingClientRect();
            const cx = b.left - o.left + b.width / 2;
            const cy = b.top - o.top + b.height / 2;
            if (o.width < NARROW) {
                setArt(null);
                return;
            }

            const strokes = CALLS.flatMap((call, i) => {
                const [sx, sy, dx, dy] = call.tip;
                const tip: Pt2 = [cx + (sx * b.width) / 2 + dx, cy + (sy * b.height) / 2 + dy];
                const back = call.come;
                const come: Pt2 = [tip[0] + back[0], tip[1] + back[1]];
                const pts: Pt2[] = [
                    [call.from[0] * o.width, call.from[1] * o.height],
                    ...call.via.map(([x, y]): Pt2 => [x * o.width, y * o.height]),
                    come,
                    tip,
                ];
                const shaft = handLine(pts, i * 1.7 + 0.4);

                // An open head, one stroke barb to tip to barb, lined up with
                // the way the shaft arrives — not quite even, as a hand's is.
                const l = Math.hypot(back[0], back[1]);
                const ux = back[0] / l;
                const uy = back[1] / l;
                const barb = (turn: number, size: number): Pt2 => [
                    tip[0] + (ux * Math.cos(turn) - uy * Math.sin(turn)) * size,
                    tip[1] + (ux * Math.sin(turn) + uy * Math.cos(turn)) * size,
                ];
                const a = barb(0.52, 21 + (i % 3));
                const c = barb(-0.44, 17 + (i % 2) * 2);
                return [
                    { d: shaft.d, len: shaft.len, width: call.width },
                    {
                        d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} L${c[0].toFixed(1)} ${c[1].toFixed(1)}`,
                        len: Math.hypot(a[0] - tip[0], a[1] - tip[1]) + Math.hypot(c[0] - tip[0], c[1] - tip[1]),
                        width: call.width,
                    },
                ];
            });

            setArt({ w: Math.round(o.width), h: Math.round(o.height), strokes });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        return () => observer.disconnect();
    }, [screen, button]);

    return art;
}

/**
 * Five more arrows at the button, from every other way into the screen, for
 * as long as the pointer is on it.
 *
 * They are drawn there and then, the way a hand would — all five at once,
 * on their beats (`at`): the shaft in from off the edge and then its head,
 * the pen easing in and out of every stroke and lifting between. When the
 * pointer leaves they all take themselves back off together, each the way
 * the doodle's Clear takes a drawing — last point first, all the way back to
 * the first, easing in and out over the whole. Either way, it carries on from
 * wherever the other left off.
 *
 * `ink` is how far through the whole drawing it is, 0..1, held by the page
 * so the button can see it; `onDrawn` is called each time it is all in.
 */
function CallArrows({
    art,
    on,
    ink,
    onDrawn,
}: {
    art: NonNullable<ReturnType<typeof useCallArrows>>;
    on: boolean;
    ink: React.RefObject<{ p: number }>;
    onDrawn: () => void;
}) {
    const lines = useRef<(SVGPathElement | null)[]>([]);
    const drawn = useRef(onDrawn);
    useEffect(() => {
        drawn.current = onDrawn;
    });

    useEffect(() => {
        const { strokes } = art;
        const arrows = strokes.length / 2;
        const drawTime = ARROW_TIME + STAGGER * Math.max(...CALLS.map((c) => c.at));
        // Each arrow's share of the whole, and how far apart the beats are,
        // both as fractions of it.
        const span = ARROW_TIME / drawTime;
        const step = STAGGER / drawTime;

        const stroke = (i: number, k: number) => {
            const el = lines.current[i];
            if (!el) return;
            const len = strokes[i].len;
            const shown = len * sineInOut(Math.min(1, Math.max(0, k)));
            el.style.strokeDashoffset = String(len - shown);
            el.style.visibility = shown > 0.5 ? "visible" : "hidden";
        };
        const paint = () => {
            for (let a = 0; a < arrows; a++) {
                const shaft = strokes[a * 2].len;
                const head = strokes[a * 2 + 1].len;
                const run = shaft + LIFT_HEAD + head;
                const pen = Math.min(1, Math.max(0, (ink.current.p - CALLS[a].at * step) / span)) * run;
                stroke(a * 2, pen / shaft);
                stroke(a * 2 + 1, (pen - shaft - LIFT_HEAD) / head);
            }
        };
        paint();

        const p = ink.current.p;
        const tween = on
            ? gsap.to(ink.current, {
                  p: 1,
                  duration: drawTime * (1 - p),
                  ease: "none",
                  onUpdate: paint,
                  onComplete: () => drawn.current(),
              })
            : gsap.to(ink.current, {
                  p: 0,
                  duration: CLEAR_TIME * p,
                  ease: "power1.inOut",
                  onUpdate: paint,
              });
        if (!motionEnabled()) tween.progress(1);
        return () => {
            tween.kill();
        };
    }, [on, art, ink]);

    return (
        <svg
            aria-hidden="true"
            width={art.w}
            height={art.h}
            viewBox={`0 0 ${art.w} ${art.h}`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-0 top-0 text-ink opacity-85"
        >
            {art.strokes.map((s, i) => (
                <path
                    key={i}
                    ref={(el) => {
                        lines.current[i] = el;
                    }}
                    d={s.d}
                    strokeWidth={s.width}
                    strokeDasharray={s.len}
                    className="invisible"
                />
            ))}
        </svg>
    );
}
