"use client";

import Marquee from "@/components/home/Marquee";
import { MaskWords } from "@/components/motion/Text";
import { gsap, riseMasks, useGsap } from "@/lib/motion";

/**
 * The breath between the hero and the page: one sentence, set as large as it
 * can be read at a glance, with the arch marquee under it as the divider.
 */
export default function Intro() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        riseMasks(q(".js-statement .js-mask-inner"), {
            trigger: el,
            start: "top 80%",
            stagger: 0.04,
        });
    });

    return (
        <section
            ref={scope}
            className="bg-gradient-to-b from-paper to-paper-3 pt-16 md:pt-24"
        >
            <div className="shell mx-auto max-w-shell">
                <p className="js-statement max-w-5xl font-serif text-d2 leading-[1.15] text-ink">
                    <MaskWords text="One developer," />{" "}
                    <span className="text-ink-3">
                        <MaskWords text="from the database to the design." />
                    </span>
                </p>
            </div>

            <div className="mt-14 md:mt-20">
                <Marquee />
            </div>
        </section>
    );
}
