"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, useGsap } from "@/lib/motion";

/**
 * A full-bleed image section, sized to fill the screen and shown clean — no
 * tint, no scrim, no filter. It is there to be looked at, and to give the page
 * somewhere to breathe between two blocks of reading.
 *
 * Without a `src` it stays an empty tonal band, so one can be placed now and
 * filled later without the layout moving.
 */
export default function ImageBand({
    src,
    alt = "",
    caption,
    tone = "from-paper-3 to-paper",
    height = "h-[60svh] min-h-[20rem] md:h-[88svh]",
    position = "object-center",
    className,
    priority = false,
}: {
    src?: string;
    alt?: string;
    caption?: string;
    tone?: string;
    height?: string;
    position?: string;
    className?: string;
    priority?: boolean;
}) {
    const scope = useGsap<HTMLDivElement>((el) => {
        const q = gsap.utils.selector(el);
        if (!q(".js-band-img").length) return;

        gsap.fromTo(
            q(".js-band-img"),
            { yPercent: -7, scale: 1.12 },
            {
                yPercent: 7,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.9 },
            }
        );

        gsap.fromTo(
            q(".js-band-caption"),
            { opacity: 0, y: 18 },
            {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power4.out",
                scrollTrigger: { trigger: el, start: "top 78%" },
            }
        );
    });

    return (
        <div
            ref={scope}
            className={cn("relative overflow-hidden bg-gradient-to-b", tone, height, className)}
        >
            {src && (
                <div className="js-band-img absolute inset-0">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        quality={90}
                        sizes="100vw"
                        className={cn("object-cover", position)}
                    />
                </div>
            )}

            {caption && (
                <div className="shell absolute inset-x-0 bottom-0 mx-auto max-w-shell pb-8">
                    {/* The only ink over the photograph, so it carries its own
                        legibility rather than dimming the whole image. */}
                    <p className="js-band-caption inline-block rounded bg-paper/85 px-4 py-2 font-mono text-label uppercase text-ink backdrop-blur-sm">
                        {caption}
                    </p>
                </div>
            )}
        </div>
    );
}
