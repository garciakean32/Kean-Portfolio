"use client";

import { useRef } from "react";
import { Portrait, driftPortraits, masthead } from "@/components/shared/Portrait";
import SectionMark from "@/components/shared/SectionMark";
import Sketch from "@/components/shared/Sketch";
import { ThreadLines, useThread } from "@/components/shared/Thread";
import { fit, ring, squiggle, turn } from "@/components/shared/doodles";
import { RevealBlock, RevealText } from "@/components/motion/Reveal";
import HangingFrame from "@/components/sections/HangingFrame";
import { introVideo, personal } from "@/lib/data";
import { dropLine, type Pt2 } from "@/lib/hand";
import { fadeUp, gsap, useGsap } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A short video of me, in my own words — the quickest way to know who is
 * behind the page.
 *
 * Until the video is recorded the frame holds its place with a "coming soon"
 * card, so dropping the file in later is a one-line change in `lib/data.ts`
 * (`introVideo.src`) and nothing here moves.
 *
 * Two screens, the way the about section has two. The first is laid out
 * like the about section's masthead — the heading and a word on what the
 * video is on the left, a photograph in its frame on the right — with the
 * thread from the experience button coming down the middle onto it. The
 * video's frame has the second to itself, strung on the thread: it picks up
 * again under the masthead, is taped to the top of the frame, and carries on
 * from under its foot into the contact section — rope you can pull the frame
 * about on, by its tape. See `HangingFrame`.
 */
export default function VideoIntro() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        // The heading, the line under it and the frame reveal themselves —
        // see `RevealText` and `RevealBlock`.
        fadeUp(q(".js-mark"), { trigger: el, start: "top 82%" });

        driftPortraits(el);
    });

    const head = useRef<HTMLDivElement>(null);
    // In from the top to just short of the masthead. From under it on, the
    // thread is the rope the frame hangs on.
    const thread = useThread(scope, (box, at) => {
        if (!head.current) return [];
        const top = at(head.current);
        const mid = box.width / 2;
        return [dropLine(mid, -2, mid + 6, top.top - 24, 0.04)];
    });

    return (
        <section id="video" ref={scope} className="relative overflow-hidden bg-paper">
            <div className="flex min-h-[100svh] flex-col justify-center py-20 md:py-28">
                <div ref={head} className={cn("shell mx-auto w-full max-w-shell", masthead.column)}>
                    <SectionMark as="h2" label="Video introduction" className="js-mark" />

                    {/* The about section's masthead, said again: the words
                        on the left, the photograph in its frame on the right
                        — stacked below `lg` as every masthead is, the title,
                        the photograph, then the words. */}
                    <div className={masthead.grid}>
                        <div className={cn(masthead.text, "lg:col-span-7")}>
                            <p className={cn("font-display text-d4 font-bold tracking-[-0.035em] text-ink", masthead.title)}>
                                <RevealText text="In my own" innerClassName={masthead.centred} />
                                <RevealText
                                    text="words."
                                    delay={0.18}
                                    className="text-ink-3"
                                    innerClassName={masthead.centred}
                                />
                            </p>

                            <p className={cn(masthead.copy, "lg:mt-8")}>
                                <RevealText
                                    text="A short hello, in my own words — who I am, what I enjoy building, and what I am like to work with. It is the quickest way to get a feel for the person behind this page, and the next best thing to sitting down for a conversation."
                                    delay={0.3}
                                    stagger={0.012}
                                    distance={12}
                                    innerClassName={masthead.centred}
                                />
                            </p>
                        </div>

                        <Portrait
                            src="/images/kean sakura.png"
                            alt={`${personal.name} on a bench under a cherry tree in the snow`}
                            className="lg:col-span-4 lg:col-start-9"
                        />
                    </div>
                </div>
            </div>

            {/* The frame, on a screen of its own — most of one below `lg`,
                where the frame is no taller than its width allows. */}
            <div className="flex min-h-[70svh] items-center py-20 md:py-28 lg:min-h-[100svh]">
                <div className="shell mx-auto w-full max-w-shell">
                    {/* Centred on the page rather than the column, which
                        leaves room on the right for the dock: the thread runs
                        down the page's middle, so the rope hangs plumb above
                        and below the frame. */}
                    <HangingFrame
                        section={scope}
                        head={head}
                        around={introVideo.src ? null : <FilmSet />}
                        className="mx-auto w-full max-w-3xl translate-x-[calc(var(--rail)/2)]"
                    >
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-rule bg-paper-3">
                            {introVideo.src ? (
                                <video
                                    src={introVideo.src}
                                    poster={introVideo.poster || undefined}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    aria-label={`Video introduction from ${personal.name}`}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <Placeholder />
                            )}
                        </div>
                    </HangingFrame>
                </div>
            </div>

            <ThreadLines thread={thread} />
        </section>
    );
}

/* The set, doodled in on the page round the frame. A clapperboard with its clapper
   up — the board, the band of stripes along its top and two lines written
   on it, then the clapper, hinged at the left — in a box 100 wide. */
const CLAPPER: Pt2[][] = (() => {
    const up = (pts: Pt2[]) => pts.map((p) => turn(p, [4, 30], -16));
    return [
        [[4, 30], [96, 30], [96, 30], [96, 82], [96, 82], [4, 82], [4, 82], [4, 30]],
        [[4, 44], [96, 44]],
        ...[18, 38, 58, 78].map((x): Pt2[] => [[x, 30], [x - 8, 44]]),
        [[14, 58], [62, 58]],
        [[14, 70], [44, 70]],
        up([[4, 28], [96, 28], [96, 28], [96, 15], [96, 15], [4, 15], [4, 15], [4, 28]]),
        ...[22, 42, 62, 82].map((x) => up([[x, 15], [x - 8, 28]])),
    ];
})();
/* A loop round the recording light, and a line scribbled under the clock. */
const RING: Pt2[][] = [fit(ring(1.15, 3.6), 50, 20, 100, 40)];
const SCRIBBLE: Pt2[][] = [fit(squiggle(), 50, 5, 100, 10)];

/**
 * The set the frame hangs in while it waits for the video, set down on the
 * page round it and staying put while it swings: recording, over its top
 * left corner; the clock at zero, over its top right; and the clapperboard
 * by its foot on the left. On a phone, with no room beside the frame, the
 * clock and the clapperboard go under it instead — and on a tablet, where
 * the frame is the column's full width, the clapperboard does. Each draws
 * itself in as it comes into view.
 */
function FilmSet() {
    return (
        <RevealBlock className="pointer-events-none absolute inset-0">
            <span
                aria-hidden="true"
                className="absolute bottom-full left-1 mb-5 flex items-center gap-1.5 font-mono text-label uppercase text-ink-2 md:mb-6"
            >
                <span className="h-1.5 w-1.5 rounded-full bg-ink motion-safe:animate-pulse md:h-2 md:w-2" />
                Rec
                <Sketch
                    lines={RING}
                    weight={2.2}
                    duration={0.8}
                    wander={0.4}
                    className="absolute -left-3 -top-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)]"
                />
            </span>
            <span
                aria-hidden="true"
                className="absolute right-0 top-full mt-5 font-mono text-label text-ink-3 md:bottom-full md:top-auto md:mb-6 md:mt-0"
            >
                00:00:00:00
                <Sketch
                    lines={SCRIBBLE}
                    weight={1.6}
                    duration={0.6}
                    wander={0.3}
                    className="absolute -bottom-2.5 left-0 w-full"
                />
            </span>
            <Sketch
                lines={CLAPPER}
                weight={2.6}
                duration={1.4}
                wander={0.5}
                className="absolute left-1 top-full mt-4 w-10 md:mt-5 md:w-14 lg:bottom-0 lg:left-auto lg:right-full lg:top-auto lg:mr-6 lg:mt-0 lg:w-16"
            />
        </RevealBlock>
    );
}

/** The frame's stand-in: a viewfinder with nothing in it yet. */
function Placeholder() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center md:gap-4">
            {/* Viewfinder corners */}
            {[
                "left-3 top-3 border-l border-t md:left-5 md:top-5",
                "right-3 top-3 border-r border-t md:right-5 md:top-5",
                "bottom-3 left-3 border-b border-l md:bottom-5 md:left-5",
                "bottom-3 right-3 border-b border-r md:bottom-5 md:right-5",
            ].map((corner) => (
                <span
                    key={corner}
                    aria-hidden="true"
                    className={cn("absolute h-4 w-4 border-rule-strong md:h-6 md:w-6", corner)}
                />
            ))}

            <span
                aria-hidden="true"
                className="grid h-12 w-12 place-items-center rounded-full border border-rule-strong text-ink-2 md:h-16 md:w-16"
            >
                <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 md:h-5 md:w-5" fill="currentColor">
                    <path d="M7 4.5v15l12-7.5z" />
                </svg>
            </span>
            <p className="font-mono text-label uppercase text-ink-3">Video coming soon</p>
        </div>
    );
}
