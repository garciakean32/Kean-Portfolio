import Image from "next/image";
import { RevealBlock } from "@/components/motion/Reveal";
import { gsap } from "@/lib/motion";

/* The framed photograph every section that opens on a portrait shares —
   about, experience and the video introduction — the drift that keeps the
   picture moving inside its frame, and the masthead it sits in. */

/**
 * The masthead those sections open on — a label, a title, the photograph and
 * a word under it — and the one shape it takes everywhere below `lg`:
 * stacked and centred, the title first, then the photograph, then the words,
 * whichever side of the photograph they are written on. From `lg` the title
 * and the words are one column beside the photograph, as they always were.
 *
 * `column` goes on the section's column, `grid` on the grid inside it and
 * `text` on the title and words' wrapper — `display: contents` below `lg`,
 * which makes the title and the words the grid's own items there, for
 * `title` and `copy` to put either side of the photograph. `centred` is for
 * every `RevealText` inside, whose words sit in a row of their own.
 */
export const masthead = {
    column: "text-center lg:text-left",
    grid: "mt-8 grid gap-8 md:mt-12 md:gap-10 lg:mt-16 lg:grid-cols-12 lg:items-center lg:gap-x-12",
    text: "contents lg:block",
    title: "max-lg:order-first",
    copy: "mx-auto max-w-measure text-copy text-ink-2 max-lg:order-last lg:mx-0",
    centred: "justify-center lg:justify-start",
};

/**
 * Every photograph in `scope` drifts inside its own frame for as long as it
 * is on screen. Its arrival is `RevealBlock`'s, the same rise out of a blur
 * the words make, so pictures and text come in as one.
 */
export function driftPortraits(scope: HTMLElement) {
    gsap.utils.selector(scope)(".js-figure").forEach((figure) => {
        gsap.fromTo(
            figure.querySelector("img"),
            { yPercent: -5 },
            {
                yPercent: 5,
                ease: "none",
                scrollTrigger: {
                    trigger: figure,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.8,
                },
            }
        );
    });
}

/**
 * The frame's rule, set as type — and the one thing about it that has to be
 * exact is that it closes.
 *
 * `KeanImage ·` eighteen times, joined by a space: 215 characters, ending on
 * the separator rather than on a space. The path it runs around is 455.02 user
 * units, so at a 3-unit mono face (0.6em per character, JetBrains Mono) the
 * spacing that makes 216 character-widths span exactly that is 0.3066 — and
 * the 216th width, the one the string does not spend, is the gap between the
 * last `·` and the first `K`. It is the same width as every other gap in the
 * run, so the seam is invisible and there is nowhere the `·` is missing.
 *
 * Keep the three numbers below in step with the path in `Portrait`: change the
 * inset, the radius or the box and the perimeter changes with them.
 */
const FRAME_TEXT = Array.from({ length: 18 }, () => "KeanImage ·").join(" ");
const FRAME_SIZE = 3;
const FRAME_TRACKING = 0.3048;

/**
 * A photograph inside a frame written out of its own name.
 *
 * The rule around the picture is not a rule: it is "KeanImage" repeated around
 * a rounded rectangle, small enough that at a glance it still reads as one,
 * and close enough to read as a caption running around the mount.
 *
 * It sits concentric with the photograph and a hair outside its edge — the
 * frame the picture is in, not a second frame leaning out from behind it. The
 * ring's own corners are struck at the picture's corner radius plus that gap,
 * so the two curves are parallel the whole way round rather than merely both
 * being round.
 *
 * The geometry is one aspect ratio said twice. The box is the photograph's 4:5
 * grown by three units on every side — `3%` of the width and `2.4%` of the
 * height are the same distance, on a box where the height is 1.25x the width —
 * so the viewBox below matches it exactly at any size and nothing is stretched.
 */
export function Portrait({
    src,
    alt,
    className,
    priority = false,
}: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}) {
    return (
        <div className={className}>
            {/* Picture and frame arrive together, the way the words do. */}
            <RevealBlock className="relative mx-auto w-full max-w-[13rem] sm:max-w-[15rem] md:max-w-[19rem] lg:mx-0 lg:max-w-[17rem]">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 106 131"
                    className="plate -inset-x-[3%] -inset-y-[2.4%]"
                >
                    <path
                        id="portrait-frame"
                        fill="none"
                        d="M5.2 1.6H100.8A3.6 3.6 0 0 1 104.4 5.2V125.8A3.6 3.6 0 0 1 100.8 129.4H5.2A3.6 3.6 0 0 1 1.6 125.8V5.2A3.6 3.6 0 0 1 5.2 1.6Z"
                    />
                    <text
                        dominantBaseline="middle"
                        className="fill-ink-3 font-mono"
                        fontSize={FRAME_SIZE}
                        letterSpacing={FRAME_TRACKING}
                    >
                        <textPath href="#portrait-frame">{FRAME_TEXT}</textPath>
                    </text>
                </svg>

                <div className="js-figure relative z-10 aspect-[4/5] w-full overflow-hidden rounded-md bg-paper-3">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        quality={90}
                        sizes="(min-width: 1024px) 17rem, (min-width: 768px) 19rem, 15rem"
                        className="scale-105 object-cover object-[center_25%]"
                    />
                </div>
            </RevealBlock>
        </div>
    );
}
