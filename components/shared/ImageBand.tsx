"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, useGsap } from "@/lib/motion";

/**
 * A full-bleed image section, sized to fill the screen and shown clean — no
 * tint, no scrim, no filter, no caption sitting on top of it. It is there to
 * be looked at, and to give the page somewhere to breathe between two blocks
 * of reading.
 *
 * Without a `src` it stays an empty tonal band, so one can be placed now and
 * filled later without the layout moving.
 */
export default function ImageBand({
    src,
    alt = "",
    tone = "from-paper-3 to-paper",
    height = "h-[60svh] min-h-[20rem] md:h-[88svh]",
    position = "object-center",
    className,
    priority = false,
}: {
    src?: string;
    alt?: string;
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
        </div>
    );
}
