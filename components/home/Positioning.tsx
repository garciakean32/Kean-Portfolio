"use client";

import Marquee from "@/components/home/Marquee";
import { MaskWords } from "@/components/motion/Text";
import { gsap, riseMasks, useGsap } from "@/lib/motion";

/**
 * The gap between the hero and the pitch, with the arch marquee sitting in
 * the middle of it. Top padding (hero → statement) and bottom padding
 * (marquee → where the "for you" panel starts covering) are the same value
 * on purpose, so the marquee reads as the midpoint of one held breath rather
 * than a divider bolted onto either side — and because it's a generous value,
 * it doubles as the settle room the incoming light panel needs before it
 * starts sliding over this one.
 */
export default function Positioning() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        riseMasks(q(".js-statement .js-mask-inner"), {
            trigger: el,
            start: "top 78%",
            stagger: 0.035,
        });
    });

    return (
        <section
            ref={scope}
            className="bg-gradient-to-b from-paper-3 to-paper pb-0 pt-28 md:pt-40"
        >
            <div className="shell mx-auto max-w-shell">
                <p className="js-statement max-w-4xl font-serif text-d1 text-ink">
                    <MaskWords text="One developer, from the database to the design, with this portfolio as a glimpse into the ideas, skills, and experiences I bring to every project." />
                </p>
            </div>

            <div className="mt-24 md:mt-32">
                <Marquee />
            </div>
        </section>
    );
}
