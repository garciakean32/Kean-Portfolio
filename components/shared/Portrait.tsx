import Image from "next/image";
import { RevealBlock } from "@/components/motion/Reveal";
import GlassFrame from "@/components/shared/GlassFrame";
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
 * `title` and `copy` to put either side of the photograph.
 */
export const masthead = {
    column: "text-center lg:text-left",
    grid: "mt-8 grid gap-8 md:mt-12 md:gap-10 lg:mt-16 lg:grid-cols-12 lg:items-center lg:gap-x-12",
    text: "contents lg:block",
    title: "max-lg:order-first",
    copy: "mx-auto max-w-measure text-copy text-ink-2 max-lg:order-last lg:mx-0",
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
 * A photograph behind a pane of glass — the same frame as every other
 * picture on the page; see GlassFrame. The picture is cropped 4:5 about a
 * point a quarter of the way down, where a face is, and drawn a little
 * bigger than its box so it has room to drift inside it; see
 * `driftPortraits`.
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
                <GlassFrame inner="js-figure aspect-[4/5] w-full bg-paper-3">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        quality={90}
                        sizes="(min-width: 1024px) 17rem, (min-width: 768px) 19rem, 15rem"
                        className="scale-105 object-cover object-[center_25%]"
                    />
                </GlassFrame>
            </RevealBlock>
        </div>
    );
}
