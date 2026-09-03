"use client";

import { useEffect, useRef } from "react";
import PrismDrift, { type PrismDriftHandle } from "@/components/motion/PrismDrift";
import ShaderFlow from "@/components/motion/ShaderFlow";
import SectionLink from "@/components/shared/SectionLink";
import { heroList } from "@/lib/data";
import { claimIntro, endIntro, revealChrome } from "@/lib/intro";
import { EASE, gsap, motionEnabled, useGsap } from "@/lib/motion";

/** Hard fringe at a given split, in pixels — the text-side equivalent of the
    portrait's own split, and driven off the same kind of rolled intensity
    rather than a fixed offset.

    Ash one side, near-black the other, not magenta and cyan: the tear is a
    wet double of the word, the way ink lifts and smears off a page, and the
    only colour anywhere on this site is the accent. Keep in step with `ASH`
    and `SMOKE` in PrismDrift, which give the portrait the same two edges. */
const fringe = (px: number) =>
    `${px}px 0 rgba(198,205,216,0.8), ${-px}px 0 rgba(6,6,8,0.9)`;

/** The fixed split the glitch hits carry — on the portrait as it cuts in, and
    on every line already standing when it does. */
const FRINGE = fringe(3);

/** The glitch that closes the intro: how many hits, the gap between them, and
    the hold. Everything else is drawn in by the time the first one lands, so
    these hits are what the portrait itself arrives on — it is not wiped in with
    the rest, it cuts in mid-tear. */
const HITS = 2;
const HIT_GAP = 0.19;
const HIT_HOLD = 0.09;

/** What the name reads as mid-glitch — same two halves, different letters. */
const NAME = ["KE", "AN"] as const;
const GLITCHED_NAME = ["KY", "RA"] as const;

/** The dolly.

    The poster starts small and arrives at its own size, which is what a camera
    closing on a subject looks like. The ground it is printed on does not come
    with it: `hero-ground` is on the section and the dolly is on a frame inside
    it, so the room holds still and the poster comes forward through it — the
    difference between moving closer to something and it growing at you.

    `DOLLY_FROM` is as far back as the frame can sit and still read as the same
    frame rather than a thumbnail of one. `DOLLY` is the length of the whole
    intro; every reveal below is placed inside it. */
const DOLLY_FROM = 0.62;
const DOLLY = 2.8;

/** One element's reveal: how long its stroke takes to be laid down, and the
    beat between one element and the next in the order below. */
const WIPE = 1.1;
const STEP = 0.17;

/** The last thing to arrive, and so the length of the reveal — the bottom row
    starts nine beats in and takes a full stroke. The glitch is placed just past
    it on purpose: the hits set opacity by hand, and nothing may still be
    tweening the same property when they do. */
const REVEAL_END = STEP * 9 + WIPE;
const GLITCH_AT = REVEAL_END + 0.06;

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

        // The frame everything in the poster hangs off — the one element the
        // dolly moves. See `DOLLY_FROM`.
        const dolly = q(".js-dolly")[0] as HTMLElement;
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
                gsap.set(dolly, { willChange: "auto" });
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

        // The figure is held out of the room until the glitch takes it in.
        // Set from inside the timeline rather than in the markup on purpose:
        // with motion off none of this runs, and the portrait is simply there.
        tl.set(portrait, { opacity: 0 }, 0);

        /** Draws one element with a soft-edged mask travelling up its own box,
            so the thing arrives foot to head rather than fading in whole.
            `.ink-wipe` in globals.css is that mask and `--ink-wipe` is the head
            of it. Everything in the poster arrives this way except the
            portrait, which cuts in on the glitch.

            The class is put on here rather than carried in the markup, and
            taken off again on the frame the stroke finishes: a mask is a
            compositing layer for as long as it is set, and none of these need
            one for the rest of the page's life. Nothing can be left hidden by
            it either — with motion off this never runs, and no element ever
            gets the class at all.

            Opacity is a second, shorter tween rather than part of the first.
            The paper a stroke is drawn on still has to arrive, and if it tracked
            the wipe the leading edge would start on a hard line. */
        const draw = (targets: Element[], at: number, duration: number) => {
            const els = targets as HTMLElement[];
            if (!els.length) return;
            for (const node of els) node.classList.add("ink-wipe");

            tl.fromTo(
                els,
                { "--ink-wipe": -18 },
                {
                    "--ink-wipe": 100,
                    duration,
                    ease: "power1.inOut",
                    onComplete: () => {
                        for (const node of els) {
                            node.classList.remove("ink-wipe");
                            node.style.removeProperty("--ink-wipe");
                        }
                    },
                },
                at
            ).fromTo(
                els,
                { opacity: 0 },
                { opacity: 1, duration: Math.min(duration * 0.6, 1.2), ease: EASE.out },
                at
            );
        };

        // 1 — the dolly, under everything else and running the whole length of
        // the intro: the frame comes forward while the rest of the poster is
        // still being laid down on it, so the two read as one move rather than
        // a move and then a reveal.
        tl.set(dolly, { transformOrigin: "50% 50%", willChange: "transform" }, 0).fromTo(
            dolly,
            { scale: DOLLY_FROM },
            { scale: 1, duration: DOLLY, ease: EASE.io },
            0
        );

        // 2 — the order, and the order is depth. The band of light is the
        // furthest thing back and comes up first, over the whole intro, as the
        // section's own backdrop; the name is behind it; the small type in the
        // corners is last, because it sits on the glass rather than in the
        // room. Read this list top to bottom and you are walking towards the
        // frame. The portrait is not in it: the room is built empty and the
        // figure is torn into it at the end.
        draw(q(".js-flow"), 0, DOLLY);
        draw([wordmark], STEP * 4, WIPE * 1.3);
        draw([...q(".js-role"), ...q(".js-tate")], STEP * 8, WIPE);
        draw(q(".js-body"), STEP * 9, WIPE);

        // 3 — the room is whole by now, and it is struck twice on the way into
        // its last tenth of a second of travel — which is where the figure
        // lands: the first hit cuts it in, the second is what it settles on. The curtains pull clear over the
        // same span rather than on their own timer, so the room they open up is
        // exactly the room the arrival needs — and the navbar lets itself in on
        // this instant too, rather than waiting for the sequence to finish. See
        // `revealChrome`.
        tl.addLabel("glitch", GLITCH_AT);
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
            className="hero-ground relative h-[100svh] min-h-[34rem] overflow-hidden"
        >
            {/* The poster, and only the poster: everything in the section
                except the ground it is printed on. It exists so the intro has
                something to dolly — the frame comes forward from `DOLLY_FROM`
                to its own size while the ground behind it holds still, which is
                what makes the move read as the camera closing in rather than
                the artwork inflating.

                `absolute inset-0` with the section's own flex layout moved onto
                it: the box is identical to the one the children had before, so
                nothing inside it moved. The transform does open a stacking
                context, which is why every `z-index` below is relative to this
                and not to the page. */}
            <div className="js-dolly absolute inset-0 flex flex-col">
            {/* The shader is the section's background now: it fills the whole
                frame rather than a band drifting across the middle of it, so
                the hero's backdrop is the shaderflow itself instead of a shape
                laid over `hero-ground`. See components/motion/ShaderFlow.tsx
                for what it is.

                Painted first, before everything else in the poster, with no
                `z-index` — it sits under the name (z-0) without opening a
                stacking context of its own. */}
            <div
                data-anim="fade"
                aria-hidden="true"
                className="js-flow pointer-events-none absolute inset-0"
            >
                <ShaderFlow />
            </div>

            {/* Top — the mark on the left, one small line centred, and the
                vertical run down the right margin at every size.

                和風 and the vertical run are both centred on the row, rather
                than pinned to an edge of it.

                z-20: stays in front of the portrait, which only needs to sit
                over the name below. */}
            <div className="shell relative z-20 mx-auto grid w-full max-w-shell grid-cols-[1fr_auto_1fr] items-center gap-3 pt-10 md:gap-6 md:pt-12">
                <p
                    data-glitch="jp"
                    className="js-body col-start-1 translate-y-2 font-jp text-[0.6875rem] leading-none text-white"
                >
                    和風
                </p>

                <p
                    data-glitch="role"
                    className="js-role col-start-2 self-start text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white sm:tracking-[0.28em]"
                >
                    Full-Stack Web Developer
                </p>

                <span
                    aria-hidden="true"
                    data-glitch="tate"
                    className="js-tate tate col-start-3 justify-self-end translate-y-2 font-jp text-[0.6875rem] tracking-[0.4em] text-white"
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
                // Two shadows, and they do different jobs: the tight one is an
                // outline, dark enough to hold the figure's edge against the
                // band of light now moving behind it, and the wide one is the
                // ground shadow that was always here. Written as a single
                // `filter` because they have to stack, which Tailwind's
                // `drop-shadow-*` chain has room for only one of.
                className="js-portrait pointer-events-none absolute inset-0 z-10 [filter:drop-shadow(0_0_3px_rgba(0,0,0,0.95))_drop-shadow(0_25px_45px_rgba(0,0,0,0.45))]"
            >
                <PrismDrift
                    ref={prism}
                    src="/images/kean hero.png"
                    priority
                    sizes="100vw"
                    className="object-contain"
                />
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
                <div className="-translate-y-8 sm:-translate-y-4 lg:-translate-y-6">
                <h1
                    aria-label="Kean"
                    // The whole name reveals as one stroke rather than the two
                    // halves doing it independently, so the gate sits here and
                    // `draw` in the timeline above masks this element.
                    data-anim="fade"
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
                    // Pushed up below `sm`, against the portrait. The figure
                    // is a cutout and dead centre is where the torso is widest,
                    // which buries the word almost entirely; the higher the
                    // name goes the more of it clears. Sampling the source
                    // PNG's alpha channel at each candidate offset is what
                    // settled the number rather than eyeballing it — at 32px
                    // about a third of the word is in the clear, and going
                    // further starts pulling the name off the centre of the
                    // frame the dolly is closing on.
                    className="js-wordmark select-none font-display text-[clamp(4.25rem,32vw,8rem)] font-extrabold leading-[0.82] tracking-[-0.055em] text-white sm:text-[min(25vw,45vh)]"
                >
                    {/* Two halves rather than one word, and the split is what
                        the glitch is written against: the closing hits swap the
                        pair for KY and RA, which only works while each half is
                        its own text node. The layout is always the resting one,
                        which is also exactly what a visitor with motion off
                        gets. */}
                    <span className="flex items-center justify-center">
                        <span className="js-name-part inline-block">KE</span>
                        <span className="js-name-part inline-block">AN</span>
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
                lines up with the middle of the button under it rather than
                its right edge.

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
                the button dead centre, offer on the right. `items-end` is what
                puts "Available for work" level with the last line of the list
                rather than floating above it.

                Every cell names its row. Sparse auto-placement only ever moves
                the cursor forwards, so the button — third in the DOM but in
                column two — would otherwise be pushed onto a second row rather
                than back into the gap the offer had just skipped over.

                z-20: see the top row above. */}
            <div className="shell relative z-20 mx-auto w-full max-w-shell pb-24 lg:pb-12">
                <div className="grid grid-cols-2 items-stretch gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-8">
                    <div className="hidden h-full flex-col justify-end md:flex md:contents">
                        <ul
                            data-glitch="jp"
                            className="js-body mb-4 space-y-1 font-mono text-[0.6875rem] uppercase leading-tight tracking-[0.1em] text-ink md:mb-0"
                        >
                            {heroList.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 flex h-full flex-col items-center justify-end gap-3 md:contents">
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
                        <div className="js-body js-steady order-2 flex justify-center md:order-none md:col-start-2 md:row-start-1 md:justify-self-center">
                            {/* One control, and it is sized to its own label at
                                every width. The blurred panel that used to lift
                                a bare text link off the portrait went with the
                                link — a solid pill carries itself.

                                Nothing here may stretch. The pill's width is
                                its content, so the disc at the trailing edge
                                stays hard against the arrow instead of drifting
                                off across a column it was never meant to fill;
                                that drift is the whole reason this looked
                                broken on a phone.

                                The disc IS the resting state of the fill: the
                                circle below sits exactly under the arrow, and
                                hover only scales it until it has swallowed the
                                pill. The arrow rides on top and never travels
                                with it, so the growth reads as that one disc
                                opening out rather than a wash arriving from
                                nowhere — and because it is clipped by the
                                pill's own `overflow-hidden`, no part of it is
                                ever drawn outside the shape. */}
                            <SectionLink
                                id="contact"
                                className="group relative inline-flex min-h-11 items-center gap-4 overflow-hidden whitespace-nowrap rounded-full border border-accent bg-accent py-1.5 pl-6 pr-1.5 font-mono text-label uppercase tracking-[0.16em] text-on-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.85)] transition-shadow duration-500 ease-out hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)]"
                            >
                                {/* 22x clears the pill's far corner from a 32px
                                    disc at its trailing edge with room to spare,
                                    at every width the label can produce. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-on-ink transition-transform duration-500 ease-out group-hover:scale-[22]"
                                />

                                <span className="relative z-10 transition-colors duration-500 ease-out group-hover:text-accent">
                                    Start a project
                                </span>

                                {/* Two arrows, not one: the resting glyph leaves
                                    to the upper right while its twin arrives
                                    from the lower left, both clipped to the disc
                                    so neither is ever seen outside it. */}
                                <span
                                    aria-hidden="true"
                                    className="relative z-10 h-8 w-8 shrink-0 overflow-hidden rounded-full text-accent"
                                >
                                    <span className="absolute inset-0 grid place-items-center transition-transform duration-500 ease-out group-hover:-translate-y-6 group-hover:translate-x-6">
                                        →
                                    </span>
                                    <span className="absolute inset-0 grid -translate-x-6 translate-y-6 place-items-center transition-transform duration-500 ease-out group-hover:translate-x-0 group-hover:translate-y-0">
                                        →
                                    </span>
                                </span>
                            </SectionLink>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}
