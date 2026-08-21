"use client";

import { MaskLine } from "@/components/motion/Text";
import { services } from "@/lib/data";
import { DUR, EASE, gsap, MASK_HIDDEN, pageIntro, useGsap } from "@/lib/motion";

export default function ServicesMasthead() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const tl = pageIntro();

        tl.fromTo(q(".js-eyebrow .js-mask-inner"), MASK_HIDDEN, { yPercent: 0, duration: 0.8 })
            .fromTo(
                q(".js-title .js-mask-inner"),
                MASK_HIDDEN,
                { yPercent: 0, duration: DUR.long, stagger: 0.1 },
                "-=0.55"
            )
            .fromTo(q(".js-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: EASE.io }, "-=1")
            .fromTo(q(".js-meta"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, "-=0.9");
    });

    return (
        <section
            ref={scope}
            className="bg-gradient-to-b from-paper to-paper-3 pb-14 pt-[calc(var(--nav-h)+4rem)] md:pb-20 md:pt-[calc(var(--nav-h)+6rem)]"
        >
            <div className="shell mx-auto max-w-shell">
                <div className="js-eyebrow">
                    <MaskLine className="font-mono text-label uppercase text-ink-3">
                        04 / Services — {services.length} ways in
                    </MaskLine>
                </div>

                <h1 className="js-title mt-8 font-display font-extrabold tracking-[-0.04em] text-ink">
                    <MaskLine className="text-d4">What I can</MaskLine>
                    <MaskLine className="pl-[10%] font-serif text-d4 font-normal text-ink-2">
                        build for you
                    </MaskLine>
                </h1>

                <div data-anim="rule-x" className="js-rule mt-12 h-px w-full origin-left bg-rule md:mt-16" aria-hidden="true" />

                <p data-anim="fade" className="js-meta mt-8 max-w-2xl text-pretty text-lead text-ink-2">
                    Describe your desired website, not the framework it is built
                    on. Most projects are some combination of the entries below.
                </p>
            </div>
        </section>
    );
}
