"use client";

import Image from "next/image";
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

        /** Draws one element the way the two sumi strokes are drawn: a
            soft-edged mask travelling up its own box, so the thing arrives foot
            to head rather than fading in whole. `.ink-wipe` in globals.css is
            that mask and `--ink-wipe` is the head of it — the same pair the
            branch and the bamboo have always used. Everything in the poster
            arrives this way except the portrait, which cuts in on the glitch.

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
        // the intro: the frame comes forward while the strokes are still being
        // laid down on it, so the two read as one move rather than a move and
        // then a reveal.
        tl.set(dolly, { transformOrigin: "50% 50%", willChange: "transform" }, 0).fromTo(
            dolly,
            { scale: DOLLY_FROM },
            { scale: 1, duration: DOLLY, ease: EASE.io },
            0
        );

        // 2 — the order, and the order is depth. The band of light is the
        // furthest thing back and comes up first, over the whole intro; the two
        // strokes stand either side of the figure; the name is behind it; the
        // small type in the corners is last, because it sits on the glass
        // rather than in the room. Read this list top to bottom and you are
        // walking towards the frame. The portrait is not in it: the room is
        // built empty and the figure is torn into it at the end.
        draw(q(".js-flow"), 0, DOLLY);
        draw(q(".js-tree"), STEP, WIPE * 1.7);
        draw(q(".js-bamboo"), STEP * 2, WIPE * 1.7);
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
            {/* A slow band of light drifting across the middle of the frame —
                see components/motion/ShaderFlow.tsx for what it is and what
                was changed to make it belong here.

                A band rather than the whole section, and that is what sets its
                scale: the shader normalises by the shorter side, so a wide,
                short element puts the wave's full swing inside its own height
                and leaves it reading as a horizon behind the figure rather
                than a ribbon laid over the poster. Centred a little below the
                middle, where the ground is already lifting.

                Painted first, before the two strokes, with no `z-index` for
                the same reason they have none. */}
            <div
                data-anim="fade"
                aria-hidden="true"
                className="js-flow pointer-events-none absolute inset-x-0 top-[36%] h-[46svh] md:top-[38%] md:h-[52svh]"
            >
                <ShaderFlow />
            </div>

            {/* Two sumi strokes standing off either shoulder of the name: the
                plum branch leaning out of the left margin, the bamboo running
                the full height of the right. Both are cut-outs on transparent
                ground, so there is no paper to drop out. Both are cut to the
                same three tones — black, dark gray, dim white — by the two
                filters below, which are SVG rather than CSS because CSS has no
                primitive that remaps a range onto named values. They share a
                table and differ only in the pass that feeds it: the branch is
                already light where it matters, so its stretch is a positive
                slope, while the bamboo is near-black ink at a median of 29 —
                on this ground not a dark stroke but no stroke — so its slope
                is negative and inverts.

                The branch is turned well past upright and set past the left
                edge: the trunk swings left as it rotates, and runs off the side
                of the frame rather than stopping inside it. The bamboo is a hair
                taller than the screen on purpose — just enough that its culms
                run off both the top and the bottom of it.

                No `z-index`, deliberately: painted first among the section’s
                positioned children, they sit under the name (z-0) without
                opening a stacking context of their own. */}
            {/* Three tones and nothing in between: black, a dark gray, and a dim
                white. CSS filters cannot do this — `contrast` only steepens a
                ramp, it never quantizes — so the step that actually cuts the
                bands is `feComponentTransfer type="discrete"`, which splits its
                input into as many equal bands as it has table values and
                flattens each one onto the value it names.

                The three values are `0 0.28 0.78`: true black, 71, and 199 —
                dim rather than paper-white, so the pair sits into the ground
                rather than glaring off it. Sharing them is what makes the two
                images read as one hand.

                The bamboo takes only the top two. Black is the ground here, so
                a stroke that reaches it does not darken, it disappears, and the
                bamboo’s dark end is broad enough that it was hollowing out the
                culms rather than shading them — the branch’s equivalent range
                is a thin trunk, which is why it can afford the full ramp. `0.28
                0.78` is the same ramp with its floor raised to the middle
                anchor: no black anywhere in the stroke, gray at its darkest.

                Both read the table as `type="table"`, which treats the three
                values as anchors on a ramp rather than as band edges — it
                interpolates where `discrete` steps. Hard bands were tried and
                are wrong for these images. Both are fine drawings of brush
                strokes, dry-brush texture and all, and quantizing that speckles
                them: every grain that straddles a cut becomes its own island,
                so a trunk arrives as salt-and-pepper rather than as a trunk.
                Blurring first only trades the speckle for melted blossoms,
                since the twigs are thinner than any blur that would fix the
                grain. Interpolating keeps the same black, gray and dim white at
                the ends and in the middle, and lets the texture shade
                continuously between them.

                So the `linear` pass is the whole of the difference, and it is
                where the two are actually matched. The branch sets the terms: a
                slope of 0.71 lifted by 0.28, chosen to keep the trunk — the
                darkest thing in the image — up off the floor, since left alone
                it lands in black, and on this ground that means gone, blossoms
                floating unattached. That lands the branch at quartiles of 0.23
                and 0.60.

                The bamboo’s slope is negative, which is where the inversion
                happens, and it was fitted rather than picked: at this steepness
                the bamboo’s own quartiles land on the branch’s, which on the
                full ramp matched the two images exactly.

                Raising its floor then broke that match — with the dark end
                gone the stroke could only sit lighter, and it did, meaning 0.58
                against the branch’s 0.42. The intercept is what buys it back.
                Dropping it from 0.917 to 0.72 slides the whole stroke down its
                ramp, toward the dark gray at the floor instead of the dim white
                at the top: mean 0.49, and the share of the stroke sitting on
                the floor outright goes from 6% to 14%. Slope sets how much of
                the ramp the stroke uses, intercept sets where on it the stroke
                sits, and only the second one is a matter of taste. The bamboo is the inverse problem: it
                clusters high once flipped, quartiles at 0.73 and 0.96, so fed
                in raw nearly all of it would land in the top band and come back
                one flat tone. Its slope is negative, which is where the
                inversion happens, and steep, which is what pulls the cuts apart
                onto 0.62 and 0.85 — 14% black, 29% dark gray, 57% dim white.

                `saturate 0` leads both, so the faint warm cast in the bamboo
                file cannot survive into a band and tint it.
                `color-interpolation-filters` is sRGB by necessity: the default
                is linearRGB, which would put every number above somewhere other
                than where it was measured. Alpha is left untouched throughout,
                so the cut-outs keep their own antialiased edges and the hard
                tones arrive on a soft outline. */}
            <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
                <defs>
                    <filter id="tree-ink" colorInterpolationFilters="sRGB">
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncR type="linear" slope="0.7092" intercept="0.2766" />
                            <feFuncG type="linear" slope="0.7092" intercept="0.2766" />
                            <feFuncB type="linear" slope="0.7092" intercept="0.2766" />
                        </feComponentTransfer>
                        <feComponentTransfer>
                            <feFuncR type="table" tableValues="0 0.28 0.78" />
                            <feFuncG type="table" tableValues="0 0.28 0.78" />
                            <feFuncB type="table" tableValues="0 0.28 0.78" />
                        </feComponentTransfer>
                    </filter>
                    <filter id="bamboo-ink" colorInterpolationFilters="sRGB">
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncR type="linear" slope="-1.904" intercept="0.72" />
                            <feFuncG type="linear" slope="-1.904" intercept="0.72" />
                            <feFuncB type="linear" slope="-1.904" intercept="0.72" />
                        </feComponentTransfer>
                        <feComponentTransfer>
                            <feFuncR type="table" tableValues="0.28 0.78" />
                            <feFuncG type="table" tableValues="0.28 0.78" />
                            <feFuncB type="table" tableValues="0.28 0.78" />
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>
            <Image
                src="/images/tree.png"
                alt=""
                aria-hidden="true"
                data-anim="fade"
                width={1024}
                height={1536}
                sizes="(min-width: 1024px) 45vw, 50vw"
                className="js-tree [filter:url(#tree-ink)] pointer-events-none absolute left-[-32%] top-[1%] h-[72svh] w-auto rotate-[68deg] md:left-[-13%] md:top-[-3%] md:h-[90svh] lg:left-[-4%] lg:top-[-4%] lg:h-[118svh]"
            />
            <Image
                src="/images/bamboo.png"
                alt=""
                aria-hidden="true"
                data-anim="fade"
                width={941}
                height={1672}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="js-bamboo [filter:url(#bamboo-ink)] pointer-events-none absolute right-[-72%] top-[-10%] h-[114svh] w-auto rotate-[-15deg] md:right-[-32%] md:top-[-10%] md:h-[112svh] lg:right-[-5%]"
            />

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
                        <div className="js-body js-steady order-2 w-full md:order-none md:col-start-2 md:row-start-1 md:w-auto md:justify-self-center">
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
            </div>
        </section>
    );
}
