"use client";

import Image from "next/image";
import { MaskLine } from "@/components/motion/Text";
import { personal, stats } from "@/lib/data";
import { DUR, EASE, gsap, MASK_HIDDEN, pageIntro, useGsap } from "@/lib/motion";

/**
 * The About page opens on identity: the name at full size, the portrait
 * uncovering from the bottom, and the facts set as data.
 */
export default function Masthead() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const tl = pageIntro();

        tl.fromTo(q(".js-eyebrow .js-mask-inner"), MASK_HIDDEN, { yPercent: 0, duration: 0.8 })
            .fromTo(
                q(".js-name .js-mask-inner"),
                MASK_HIDDEN,
                { yPercent: 0, duration: DUR.long, stagger: 0.1 },
                "-=0.55"
            )
            .fromTo(
                q(".js-portrait"),
                { clipPath: "inset(100% 0 0 0)", scale: 1.1 },
                { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 1.4, ease: EASE.io },
                "-=1.1"
            )
            .fromTo(q(".js-fact"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07 }, "-=1");

        gsap.to(q(".js-portrait-wrap"), {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
        });
    });

    const facts = [
        { k: "Based in", v: personal.location },
        { k: "Coordinates", v: personal.coordinates },
        { k: "Timezone", v: personal.timezone },
        ...stats.map((s) => ({ k: s.label, v: s.value })),
    ];

    return (
        <section
            ref={scope}
            className="relative overflow-hidden bg-gradient-to-b from-paper to-paper-3 pb-16 pt-[calc(var(--nav-h)+4rem)] md:pb-24 md:pt-[calc(var(--nav-h)+6rem)]"
        >
            <div className="shell mx-auto max-w-shell">
                <div className="js-eyebrow">
                    <MaskLine className="font-mono text-label uppercase text-ink-3">
                        02 / About — {personal.role}
                    </MaskLine>
                </div>

                <h1 className="js-name mt-8 font-display font-extrabold tracking-[-0.04em] text-ink">
                    <MaskLine className="text-d4">Kean Valgere</MaskLine>
                    <MaskLine className="pl-[10%] text-d4 text-ink-2">E. Garcia</MaskLine>
                </h1>

                <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-20">
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-8 self-end sm:grid-cols-3">
                        {facts.map((fact) => (
                            <div key={fact.k} data-anim="fade"
                                className="js-fact border-t border-rule pt-4">
                                <dt className="font-mono text-label uppercase text-ink-3">
                                    {fact.k}
                                </dt>
                                <dd className="mt-2 font-display text-d1 font-medium text-ink">
                                    {fact.v}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="js-portrait-wrap order-first lg:order-none">
                        <div data-anim="rise" className="js-portrait relative aspect-[4/5] w-full overflow-hidden rounded-md bg-paper-3">
                            <Image
                                src="/images/kean hero.jpg"
                                alt={personal.name}
                                fill
                                priority
                                quality={95}
                                sizes="(min-width: 1024px) 24rem, 100vw"
                                className="object-cover object-[center_25%]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
