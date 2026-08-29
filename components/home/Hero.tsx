"use client";

import { useEffect, useRef } from "react";
import PrismDrift, { type PrismDriftHandle } from "@/components/motion/PrismDrift";
import SectionLink from "@/components/shared/SectionLink";
import { heroList } from "@/lib/data";
import { claimIntro, endIntro, revealChrome } from "@/lib/intro";
import { EASE, gsap, motionEnabled, useGsap } from "@/lib/motion";

/** Hard RGB fringe at a given split, in pixels — the text-side equivalent of
    the portrait's chromatic split, and driven off the same kind of rolled
    intensity rather than a fixed offset. */
const fringe = (px: number) =>
    `${px}px 0 rgba(255,0,80,0.85), ${-px}px 0 rgba(0,229,255,0.85)`;

/** The fixed split the portrait's own reveal hits still use. */
const FRINGE = fringe(3);

/** The portrait's reveal: how many hits, the gap between them, and the hold. */
const HITS = 2;
const HIT_GAP = 0.19;
const HIT_HOLD = 0.09;

/** What the name reads as mid-glitch — same two halves, different letters. */
const NAME = ["KE", "AN"] as const;
const GLITCHED_NAME = ["KY", "RA"] as const;

/** The layout turns at `lg`, and so does the name: one line above it, two
    stacked halves below, where a single line has no room to grow into. */
const DESKTOP = "(min-width: 1024px)";

/** How long the name takes to stand back down to its resting size — and, with
    it, everything that arrives in the room that makes. Desktop only — see
    `MORPH_HOLD`/`MORPH_OUT`/`MORPH_IN` for the stacked layout's equivalent. */
const RESIZE = 1.25;

/** The clip-path the name's two halves resolve out of and, on a stacked
    layout, dissolve back into between the open position and the resting one
    — an uneven silhouette rather than a rectangle, so the appearance and
    disappearance both read as "coming into focus" rather than a fade. */
const NAME_HIDDEN_CLIP = "polygon(9% 24%, 46% 4%, 93% 15%, 89% 79%, 51% 98%, 5% 84%)";
const NAME_VISIBLE_CLIP = "polygon(0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%)";

/** Stacked layout only (mobile/tablet): how long the big, oversized stand-in
    holds fully formed before it dissolves, and how long that dissolve takes.
    Deliberately not a resize-and-slide like the desktop reveal — KE and AN
    never translate between the stacked spread and the inline rest. */
const MORPH_HOLD = 0.35;
const MORPH_OUT = 0.55;

/** How long everything real takes to rise into place, stacked layouts only.
    Starts on the same frame as the dissolve above, so the two overlap and the
    screen is never empty, but runs well past it: the dissolve is a half-second
    and this is nearly three times that, which is the difference between the
    frame snapping into place and settling into it. */
const REVEAL = 1.45;

/** How long the curtains take to pull clear — long enough to still be moving
    on the portrait's last hit, short enough that they're not lagging behind
    once the frame has settled. */
const CURTAIN_DURATION = HITS * HIT_GAP + HIT_HOLD + 0.3;

export default function Hero() {
    const prism = useRef<PrismDriftHandle>(null);

    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const rand = gsap.utils.random;

        // A fresh landing, or a route back to a page the visitor is already
        // reading? Only the first earns the locked open with the rest of the
        // page covered; the choreography below is the same either way.
        const cinematic = claimIntro();

        const wordmark = q(".js-wordmark")[0] as HTMLElement;
        const parts = q(".js-name-part");
        const portrait = q(".js-portrait");

        // The curtains and the navbar live outside this section — in the root
        // layout, so a sheet of paper and a hidden header are already in
        // place the instant the page paints, before this effect ever runs.
        // Only real when `cinematic`: on a route change it was never hidden,
        // so there's nothing here to pull open. The navbar isn't part of
        // this — it reveals itself in plain CSS once `data-intro` clears,
        // independent of this timeline entirely; see globals.css.
        const curtainTop = cinematic
            ? (document.querySelector('.js-intro-curtain[data-edge="top"]') as HTMLElement | null)
            : null;
        const curtainBottom = cinematic
            ? (document.querySelector('.js-intro-curtain[data-edge="bottom"]') as HTMLElement | null)
            : null;

        // Everything already on screen when the portrait cuts in — it takes
        // the same hits the portrait does. `js-steady` opts an element out:
        // it still arrives with the frame, it just never tears with it.
        const struck = [
            ...q(".js-role"),
            ...q(".js-tate"),
            ...q(".js-body:not(.js-steady)"),
            wordmark,
        ];

        /* ---- where the name opens from: as large as the frame allows ---- */

        const stacked = !window.matchMedia(DESKTOP).matches;

        const box = wordmark.getBoundingClientRect();
        const frame = el.getBoundingClientRect();

        // Which pair of halves the open actually moves: the stand-in below
        // `lg`, the real wordmark above it. Measuring the wrong pair is not a
        // rounding error — the two are set from different clamps, so between
        // `sm` and `lg` the real name is a good half again larger than the
        // stand-in, and offsets taken from one and applied to the other
        // threw KE and AN apart by that whole ratio.
        const openParts = stacked ? q(".js-open-part") : parts;
        const partRects = openParts.map((part) => part.getBoundingClientRect());
        // Each half's own rendered height, which is also exactly how far
        // apart `partY` (below) pushes the two of them when they stack.
        const line = Math.max(...partRects.map((r) => r.height));
        const [ke, an] = partRects.map((r) => r.width);

        // The section is the whole frame the name opens into — on a fresh
        // load it is also the only thing on screen, everything around it
        // covered by a sheet of the same paper (see globals.css).
        //
        // Both layouts are bounded on *both* axes. Height alone is not enough:
        // the resting size is already a `vw`-driven clamp sized to very nearly
        // span the frame, so any scale over about 1.2 runs the word off the
        // sides and the section's `overflow-hidden` cuts the K and the N off
        // mid-reveal. `min()` takes whichever axis runs out first, and the
        // ceilings below are what stop a very tall, narrow viewport finding a
        // scale neither factor bounds.
        //
        // Both are deliberately short of actually filling the frame: the name
        // wants to open large enough to be the only thing in the room, not so
        // large that it stops reading as a word.
        const nameW = stacked ? Math.max(ke, an) : ke + an;
        const nameH = stacked ? line * 2 : line;
        const open = stacked
            ? gsap.utils.clamp(
                  1,
                  2.4,
                  Math.min((frame.width * 0.82) / (nameW || 1), (frame.height * 0.6) / nameH)
              )
            : gsap.utils.clamp(
                  1.05,
                  1.5,
                  Math.min((frame.width * 0.88) / (nameW || 1), (frame.height * 0.58) / nameH)
              );
        // The name's resting place is neither centred nor full-width, so it
        // has to travel as well as grow.
        const dx = frame.left + frame.width / 2 - (box.left + box.width / 2);
        const dy = frame.top + frame.height / 2 - (box.top + box.height / 2);

        // Stacking is done with transforms, never layout: the two halves have
        // to travel back into one line while the name is still shrinking, and
        // a flex-direction swap mid-tween would jump instead of move.
        const partX = (i: number) => (stacked ? (i === 0 ? an / 2 : -ke / 2) : 0);
        const partY = (i: number) => (stacked ? (i === 0 ? -line / 2 : line / 2) : 0);

        /* ---- the reveal ---- */

        // Swaps both halves of the wordmark at once — the only place the
        // name's text content ever changes, now that the swap lives inside
        // the portrait's own reveal hits below rather than on its own
        // recurring clock.
        const setName = (text: readonly string[]) =>
            parts.forEach((part, i) => {
                part.textContent = text[i];
            });

        /* One hit: the portrait teleports, the split blows out, and every
           line already on screen tears with it — the navbar's logo, links,
           resume button and menu icon included, once the bar itself is up.
           No easing anywhere — each of these is on for a frame or two and
           then gone. The name reads as "KYRA" for the same span: set once,
           on the first hit, so it holds through the recovery in between
           rather than flickering back and forth with every strike. */
        const strike = (first: boolean) => {
            prism.current?.burst({ multiplier: rand(5, 9), distance: rand(30, 58) });
            gsap.set(portrait, {
                opacity: 1,
                x: rand(-56, 56),
                y: rand(-28, 28),
                scale: rand(0.96, 1.06),
            });
            gsap.set(struck, {
                x: rand(-22, 22),
                skewX: rand(-10, 10),
                opacity: rand(0.25, 1),
                textShadow: FRINGE,
            });
            if (first) setName(GLITCHED_NAME);
        };

        /* The gap between hits. The portrait all but disappears again for
           every one of them except the last, which is where it stays — and
           where the name reads as itself again, for good. */
        const recover = (last: boolean) => {
            gsap.set(portrait, { opacity: last ? 1 : 0.12, x: 0, y: 0, scale: 1 });
            gsap.set(struck, { x: 0, skewX: 0, opacity: 1, textShadow: "none" });
            if (last) setName(NAME);
        };

        const tl = gsap.timeline({
            // Long enough for the route panel to have finished clearing the
            // page on a fresh load; a beat on a route change, where it is
            // already out of the way.
            delay: cinematic ? 0.7 : 0.25,
            defaults: { ease: EASE.out },
            onComplete: () => {
                gsap.set(wordmark, { willChange: "auto" });
                endIntro();
            },
        });

        // Seeded explicitly rather than left for GSAP to infer from the CSS
        // that's hiding them — the curtains only ever get touched again from
        // inside a `.call()`, and a value GSAP has to parse off computed
        // style the first time one of those fires is a value it can get
        // wrong on the very hit that matters most, the first one.
        if (curtainTop && curtainBottom) {
            tl.set([curtainTop, curtainBottom], { yPercent: 0 }, 0);
        }

        // 1 and 2 — the open, and the hand-off out of it.
        //
        // Desktop is one continuous move: the real wordmark resolves out of an
        // uneven clip and a blur at full size, then stands down to its resting
        // size and place while the rest of the frame arrives in the room that
        // makes.
        //
        // Stacked (mobile/tablet) is a hand-off between two elements. The
        // stand-in opens big and split, and when it dissolves the real name
        // does not morph in behind it — it rises on the same fade-and-lift the
        // role, the vertical run and the two bottom columns use, on the same
        // frames as all three. Nothing translates from the split position to
        // the resting one, and there is no frame where the screen is empty.
        if (stacked) {
            const standIn = q(".js-open")[0];
            const openWord = q(".js-open-word")[0];

            tl.set(standIn, { opacity: 1 })
                .set(openWord, { scale: open, transformOrigin: "50% 50%", willChange: "transform" })
                .set(openParts, { x: partX, y: partY })
                .fromTo(
                    openParts,
                    { clipPath: NAME_HIDDEN_CLIP, filter: "blur(16px)", opacity: 0 },
                    {
                        clipPath: NAME_VISIBLE_CLIP,
                        filter: "blur(0px)",
                        opacity: 1,
                        duration: 1.05,
                        ease: EASE.io,
                    }
                )
                // The dissolve out, and everything real arriving on top of it.
                .to(
                    openParts,
                    {
                        clipPath: NAME_HIDDEN_CLIP,
                        filter: "blur(14px)",
                        opacity: 0,
                        duration: MORPH_OUT,
                        ease: EASE.io,
                        onComplete: () => gsap.set(standIn, { opacity: 0, willChange: "auto" }),
                    },
                    `+=${MORPH_HOLD}`
                )
                .fromTo(
                    parts,
                    { opacity: 0, y: 26 },
                    { opacity: 1, y: 0, duration: REVEAL, ease: EASE.out },
                    "<"
                )
                .fromTo(
                    q(".js-role"),
                    { opacity: 0, y: 14 },
                    { opacity: 1, y: 0, duration: REVEAL, ease: EASE.out },
                    "<"
                )
                .fromTo(
                    q(".js-tate"),
                    { opacity: 0, y: -14 },
                    { opacity: 1, y: 0, duration: REVEAL, ease: EASE.out },
                    "<"
                )
                .fromTo(
                    q(".js-body"),
                    { opacity: 0, y: 18 },
                    { opacity: 1, y: 0, duration: REVEAL, ease: EASE.out },
                    "<"
                );
        } else {
            tl.set(wordmark, {
                x: dx,
                y: dy,
                scale: open,
                transformOrigin: "50% 50%",
                willChange: "transform",
            })
                .set(parts, { x: partX, y: partY })
                .fromTo(
                    parts,
                    { clipPath: NAME_HIDDEN_CLIP, filter: "blur(16px)", opacity: 0 },
                    {
                        clipPath: NAME_VISIBLE_CLIP,
                        filter: "blur(0px)",
                        opacity: 1,
                        duration: 1.05,
                        ease: EASE.io,
                        // A settled clip-path still clips to its own polygon,
                        // which would crop the glitch nudges that come later.
                        onComplete: () => gsap.set(parts, { clearProps: "clipPath,filter" }),
                    }
                )
                .to(wordmark, { x: 0, y: 0, scale: 1, duration: RESIZE, ease: EASE.io }, ">-0.1")
                .to(parts, { x: 0, y: 0, duration: RESIZE, ease: EASE.io }, "<")
                .fromTo(
                    q(".js-role"),
                    { opacity: 0, y: 14 },
                    { opacity: 1, y: 0, duration: RESIZE, ease: EASE.io },
                    "<"
                )
                .fromTo(
                    q(".js-tate"),
                    { opacity: 0, y: -14 },
                    { opacity: 1, y: 0, duration: RESIZE, ease: EASE.io },
                    "<"
                )
                .fromTo(
                    q(".js-body"),
                    { opacity: 0, y: 18 },
                    { opacity: 1, y: 0, duration: RESIZE, ease: EASE.io },
                    "<"
                );
        }

        // 3 — the portrait does not fade in; it cuts in, twice. The curtains
        // pull clear over the same span rather than on their own timer, so
        // the room they open up is exactly the room the reveal needs — and
        // the navbar lets itself in at this exact instant too, rather than
        // waiting for the whole sequence to finish. See `revealChrome`.
        tl.addLabel("glitch", "+=0.12");
        tl.call(revealChrome, undefined, "glitch");
        if (curtainTop && curtainBottom) {
            tl.to(curtainTop, { yPercent: -100, duration: CURTAIN_DURATION, ease: EASE.out }, "glitch")
                .to(curtainBottom, { yPercent: 100, duration: CURTAIN_DURATION, ease: EASE.out }, "<");
        }
        for (let i = 0; i < HITS; i++) {
            tl.call(strike, [i === 0], `glitch+=${i * HIT_GAP}`).call(
                recover,
                [i === HITS - 1],
                `glitch+=${i * HIT_GAP + HIT_HOLD}`
            );
        }
        tl.call(
            () => {
                gsap.set(portrait, { opacity: 1, clearProps: "transform" });
                gsap.set(struck, { x: 0, skewX: 0, opacity: 1, textShadow: "none" });
            },
            undefined,
            `glitch+=${HITS * HIT_GAP}`
        );

        // A quiet drift once the page starts scrolling — the wordmark and the
        // portrait move at different speeds so the frame has some depth.
        gsap
            .timeline({
                scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
            })
            .to(q(".js-wordmark"), { yPercent: -12, ease: "none" }, 0)
            .to(q(".js-portrait"), { yPercent: 6, ease: "none" }, 0);
    });

    /* The page must never be left locked — not when motion is off and the
       timeline above never runs, not when the hero is unmounted mid-sequence,
       and not when a backgrounded tab starves the frame loop long enough to
       stall it. Both the curtains and the navbar are safe either way,
       hidden and revealed by the same attribute this clears — neither one
       carries any inline state of its own for a bail to leave behind.

       That teardown has to be told apart from dev's Strict Mode, which mounts
       this same effect, tears it down, and mounts it again — synchronously,
       before anything has actually gone wrong — purely to catch effects that
       aren't safe to run twice. A real unmount doesn't get that immediate
       second mount; deferring the check by a tick and comparing against a
       generation ref is what tells the two apart, since by the time the
       microtask runs, a genuine remount has already bumped it. */
    const introGen = useRef(0);
    useEffect(() => {
        if (!motionEnabled()) {
            endIntro();
            return;
        }
        const myGen = ++introGen.current;
        const guard = window.setTimeout(endIntro, 9000);
        return () => {
            window.clearTimeout(guard);
            queueMicrotask(() => {
                // Deliberately read live, not the value captured at cleanup
                // time — a real remount has to have already bumped it by the
                // time this runs, or the whole check is pointless.
                // eslint-disable-next-line react-hooks/exhaustive-deps
                if (introGen.current !== myGen) return;
                endIntro();
            });
        };
    }, []);

    return (
        <section
            id="top"
            ref={scope}
            // `data-stage`: lifted over the sheet that hides the rest of the
            // page while the open runs — see globals.css.
            data-stage
            // A full screen, always: the hero is a poster, and a poster that
            // stops halfway down the viewport is a banner. `hero-ground` is
            // the sumi-and-washi backdrop — see globals.css.
            className="hero-ground relative flex h-[100svh] min-h-[34rem] flex-col overflow-hidden"
        >
            {/* Top — the mark on the left, one small line centred, and the
                vertical run down the right margin at every size.

                和風 and the vertical run are both centred on the row, rather
                than pinned to an edge of it.

                z-20: stays in front of the portrait, which only needs to sit
                over the name below. */}
            <div className="shell relative z-20 mx-auto grid w-full max-w-shell grid-cols-[1fr_auto_1fr] items-center gap-3 pt-10 md:gap-6 md:pt-12">
                <p
                    data-glitch="jp"
                    className="js-body col-start-1 translate-y-2 font-jp text-[0.6875rem] leading-none text-ink-3"
                >
                    和風
                </p>

                <p
                    data-glitch="role"
                    className="js-role col-start-2 self-start text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-2 sm:tracking-[0.28em]"
                >
                    Full-Stack Web Developer
                </p>

                <span
                    aria-hidden="true"
                    data-glitch="tate"
                    className="js-tate tate col-start-3 justify-self-end translate-y-2 font-jp text-[0.6875rem] tracking-[0.4em] text-ink-3"
                >
                    ウェブ制作
                </span>
            </div>

            {/* The portrait cut-out, scaled to fit entirely inside the
                section — it shrinks or grows to stay fully in frame, never
                cropped by the section's overflow-hidden. `object-contain`
                centres it, which happens to land the figure over the name.

                z-10: above the name (z-0) it overlaps, below every other row
                (z-20) so only KEAN sits behind it. */}
            <div
                data-anim="fade"
                aria-hidden="true"
                className="js-portrait pointer-events-none absolute inset-0 z-10 drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)]"
            >
                <PrismDrift
                    ref={prism}
                    src="/images/kean hero.webp"
                    priority
                    sizes="100vw"
                    className="object-contain"
                />
            </div>

            {/* The opened name, stacked layouts only — a stand-in, never
                read, and invisible except for the three seconds of the intro
                it exists for.

                It is a separate element rather than the real wordmark because
                of what the open has to hand over to: below `lg` the big
                stacked name dissolves at the same moment the resting name
                reveals, and one element cannot both leave and arrive on the
                same frames. So the copy does the leaving, the original does
                the arriving, and the screen is never empty between them.
                Centred on the section rather than on the name's own row, which
                is where the open belongs.

                `opacity-0` rather than `data-anim="fade"`: the pre-animation
                gate is lifted whenever motion is off, and this must stay
                hidden then — nothing will ever animate it away. */}
            <div
                aria-hidden="true"
                className="js-open pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-[var(--gutter)] opacity-0 lg:hidden"
            >
                {/* Set from the same clamps as the real name, down to the
                    `sm` step. Not cosmetic: the opening scale is derived from
                    how big these halves already are, so a stand-in a third
                    smaller than the name it stands in for opens to a
                    different size than the frame was measured for. */}
                <span className="js-open-word select-none font-display text-[clamp(3.75rem,29vw,7.5rem)] font-extrabold leading-[0.82] tracking-[-0.055em] text-white sm:text-[min(25vw,45vh)]">
                    <span className="flex items-center justify-center">
                        <span className="js-open-part inline-block">KE</span>
                        <span className="js-open-part inline-block">AN</span>
                    </span>
                </span>
            </div>

            {/* Centre — the name, the whole point of the frame, and the
                largest thing anywhere on the site. z-0: the only row the
                portrait sits in front of. */}
            <div className="relative z-0 flex flex-1 items-center justify-center px-[var(--gutter)]">
                {/* The resting offset lives here, on a wrapper, rather than on
                    the name itself — and that is a correctness point, not a
                    tidiness one. GSAP owns the name's `transform` outright the
                    moment it first tears, so an offset set in CSS *on the name*
                    has to be read into JS once at mount and written back by
                    hand every time. It was, and it went stale the instant the
                    viewport crossed `sm`: the offset that applies below it is
                    not the offset above it, and every tear after a resize put
                    the name back 32px from where it belonged. On a wrapper
                    nothing reads it and nothing restores it; the breakpoint
                    just answers for itself. */}
                <div className="-translate-y-8 sm:translate-y-0 lg:-translate-y-6">
                <h1
                    aria-label="Kean"
                    // Sized to very nearly span the frame, the way a poster
                    // wordmark does. The number is not free: "KEAN" sets about
                    // 2.78x its own font size wide and cannot wrap, so the
                    // ceiling below `sm` is whatever still clears the two
                    // gutters — 32.5vw is as large as that gets without
                    // clipping down to 320px wide. From `sm` the ceiling is
                    // whatever still fits between the two edges the scroll
                    // section menu reserves for itself instead — 28vw clears
                    // those from 640px up, measured at 1024 where they are
                    // tightest. It is capped against the viewport's height
                    // too, so a short laptop screen shrinks the word rather
                    // than letting it eat the room the rest of the frame
                    // needs. `min()` takes whichever axis is tighter.
                    //
                    // Pushed up below `sm`, and the number is a compromise
                    // between two things that pull against each other. The
                    // portrait is a cutout: dead centre is where the torso is
                    // widest and buries the word almost entirely, and the
                    // higher the name goes the more of it clears the figure.
                    // But the stand-in that hands over to it is centred on the
                    // whole section, so the higher the name goes the further
                    // the reveal reads as landing away from where the big one
                    // just was. Sampling the source PNG's alpha channel at
                    // each candidate offset is what settled it rather than
                    // eyeballing: at 32px about a third of the word clears the
                    // figure, and the hand-off is a fifth of a screen rather
                    // than half of one.
                    className="js-wordmark select-none font-display text-[clamp(3.75rem,29vw,7.5rem)] font-extrabold leading-[0.82] tracking-[-0.055em] text-white sm:text-[min(25vw,45vh)]"
                >
                    {/* Two halves rather than one word: below `lg` the open
                        stacks them into a block that can fill a narrow screen,
                        and they travel back into a single line as the name
                        settles. Both moves are transforms — see the timeline
                        above — so the layout here is always the resting one,
                        which is also what a visitor with motion off gets.

                        `inline-block` is load-bearing, not cosmetic: transforms
                        do not apply to non-replaced inline elements, and these
                        two are moved, scaled and clipped throughout. */}
                    <span className="flex items-center justify-center">
                        <span data-anim="fade" className="js-name-part inline-block">
                            KE
                        </span>
                        <span data-anim="fade" className="js-name-part inline-block">
                            AN
                        </span>
                    </span>
                </h1>
                </div>
            </div>

            {/* Bottom — two shapes, not two layouts.

                Below `md` it is a pair of equal, matched panels: what I do on
                the left, the standing offer and the way in on the right —
                `grid-cols-2` gives both the same width, and `items-stretch`
                gives them the same height, with each side's own content
                bottom-anchored inside that shared box (see the two `h-full
                flex-col justify-end` wrappers below). The right panel is
                centred rather than right-aligned, so "Available for work"
                lines up with the middle of the buttons under it rather than
                their right edge.

                The list carries its own small `mb-4` on top of that. Matching
                outer boxes is not the same as matching text: "Start a
                project" is centred inside a 44px tap target, so its own text
                sits well above that button's bottom edge, while the list's
                last line — no padding of its own — sits right on top of the
                shared bottom edge. The margin is what closes that gap and
                brings "And many other things" level with the button's own
                label rather than just level with its box.

                From `md` the two wrappers around each side turn into
                `display: contents` — their children unwrap into the grid
                directly and the whole thing reshapes into three columns: list,
                buttons dead centre, offer on the right. `items-end` is what
                puts "Available for work" level with the last line of the list
                rather than floating above it.

                Every cell names its row. Sparse auto-placement only ever moves
                the cursor forwards, so the buttons — third in the DOM but in
                column two — would otherwise be pushed onto a second row rather
                than back into the gap the offer had just skipped over.

                z-20: see the top row above. */}
            <div className="shell relative z-20 mx-auto w-full max-w-shell pb-24 lg:pb-12">
                <div className="grid grid-cols-2 items-stretch gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-8">
                    <div className="flex h-full flex-col justify-end md:contents">
                        <ul
                            data-glitch="jp"
                            className="js-body mb-4 space-y-1 font-mono text-[0.6875rem] uppercase leading-tight tracking-[0.1em] text-ink md:mb-0"
                        >
                            {heroList.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex h-full flex-col items-center justify-end gap-3 md:contents">
                        {/* A step smaller and tighter-tracked than its `md`
                            self, and only below `md`: "Available for work" is
                            the widest thing in this half of a 50/50 split, and
                            at the narrowest phones the full-size, wide-tracking
                            treatment does not fit that column on one line —
                            wrapping it reads worse than a text one size down.
                            `md:text-[0.6875rem] md:tracking-[0.2em]` restores
                            the original size exactly, unchanged, once the
                            three-column layout gives it room. */}
                        <p
                            data-glitch="offer"
                            className="js-body order-1 whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink md:order-none md:col-start-3 md:row-start-1 md:justify-self-end md:text-[0.6875rem] md:tracking-[0.2em] md:text-right"
                        >
                            Available for work
                        </p>

                        {/* `js-steady`: arrives with the frame, never tears
                            with it. A control that jumps under the cursor is a
                            control you have to chase. */}
                        <div className="js-body js-steady order-2 md:order-none md:col-start-2 md:row-start-1 md:justify-self-center">
                            {/* Blur only — no fill, no border. It lifts the
                                words off the portrait behind them without
                                drawing an edge, and it is the same panel at
                                every size. */}
                            <div className="flex flex-col items-stretch gap-2.5 rounded-lg px-2.5 py-2 backdrop-blur-md sm:flex-row sm:items-center sm:gap-4">
                                <SectionLink
                                    id="work"
                                    className="group inline-flex min-h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded border border-accent bg-accent px-4 py-2.5 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-accent"
                                >
                                    See the work
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                                        →
                                    </span>
                                </SectionLink>
                                <SectionLink
                                    id="contact"
                                    className="link-rule inline-flex min-h-11 items-center justify-center whitespace-nowrap px-2 py-2 text-center font-mono text-label uppercase text-ink"
                                >
                                    Start a project
                                </SectionLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
