"use client";

import Image from "next/image";
import SectionMark from "@/components/shared/SectionMark";
import { MaskWords } from "@/components/motion/Text";
import { personal } from "@/lib/data";
import { drawRule, fadeUp, gsap, riseMasks, useGsap } from "@/lib/motion";

/**
 * Who I am — the working half, the school it started in, then the off-duty
 * half. Text rises while the photographs travel the other way, and the rows
 * lead from alternating sides so the page does not settle into a column.
 */
export default function Story() {
    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        riseMasks(q(".js-lead .js-mask-inner"), { trigger: el, start: "top 76%", stagger: 0.035 });
        fadeUp(q(".js-para"), { trigger: el, start: "top 70%", stagger: 0.12 });

        q(".js-shot").forEach((shot, i) => {
            gsap.fromTo(
                shot,
                { clipPath: i === 0 ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)" },
                {
                    clipPath: "inset(0% 0 0% 0)",
                    duration: 1.3,
                    ease: "power3.inOut",
                    scrollTrigger: { trigger: shot, start: "top 84%" },
                }
            );

            gsap.fromTo(
                shot.querySelector("img"),
                { yPercent: i === 0 ? -8 : 8 },
                {
                    yPercent: i === 0 ? 8 : -8,
                    ease: "none",
                    scrollTrigger: { trigger: shot, start: "top bottom", end: "bottom top", scrub: 0.8 },
                }
            );
        });

        fadeUp(q(".js-school-aside"), { trigger: q(".js-school")[0], start: "top 78%", stagger: 0.1 });
        fadeUp(q(".js-aside"), { trigger: q(".js-offduty")[0], start: "top 78%", stagger: 0.1 });

        const close = q(".js-close")[0];
        drawRule(q(".js-close-rule"), { trigger: close, start: "top 78%", axis: "y" });
        riseMasks(q(".js-close .js-mask-inner"), { trigger: close, start: "top 74%", stagger: 0.035 });
        fadeUp(q(".js-close-meta"), { trigger: close, start: "top 72%", stagger: 0.1 });
    });

    return (
        <section ref={scope} className="bg-gradient-to-b from-paper-3 to-paper pb-40 pt-20 md:pb-64 md:pt-28">
            <div className="shell mx-auto max-w-shell">
                <SectionMark as="h2" index="i" label="Who I am" />

                <p className="js-lead mt-10 max-w-4xl font-serif text-d2 text-ink md:mt-14">
                    <MaskWords text="A web developer from the Philippines, and an IT graduate who found web development interesting in the middle of the course." />
                </p>

                <div className="mt-16 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-20">
                    <div className="max-w-measure">
                        <p className="js-para text-body text-ink-2">{personal.bio}</p>
                        <p className="js-para mt-10 hidden rounded-r border-l-2 border-accent bg-paper-2 py-4 pl-5 pr-4 font-serif text-lead text-ink lg:block">
                            The part I actually enjoy is watching a site take shape — the
                            gap between an idea described out loud and the thing you can
                            open in a browser.
                        </p>
                    </div>

                    <figure className="lg:pt-10">
                        <div className="js-shot relative aspect-[3/4] w-full overflow-hidden rounded-md bg-paper-3">
                            <Image
                                src="/images/kean grad.jpg"
                                alt={`${personal.name} at his college graduation`}
                                fill
                                sizes="(min-width: 1024px) 24rem, 100vw"
                                className="scale-110 object-cover"
                            />
                        </div>
                        <figcaption className="mt-4 font-mono text-label uppercase text-ink-3">
                            Information Technology — the finish line
                        </figcaption>
                    </figure>

                    {/* Same quote as above — shown here instead, below the
                        photo, on mobile only; `lg:hidden` drops it once the
                        two-column layout has room to set it beside the bio. */}
                    <p className="js-para rounded-r border-l-2 border-accent bg-paper-2 py-4 pl-5 pr-4 font-serif text-lead text-ink lg:hidden">
                        The part I actually enjoy is watching a site take shape — the
                        gap between an idea described out loud and the thing you can
                        open in a browser.
                    </p>
                </div>

                {/* Where it started — the school block leads from the left, a
                    wider figure than the graduation shot so the two portraits
                    never read as the same column twice. */}
                <div className="js-school mt-20 grid gap-10 md:mt-28 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center lg:gap-20">
                    <figure className="order-2 lg:order-1">
                        <div className="js-shot relative aspect-[4/5] w-full overflow-hidden rounded-md bg-paper-3">
                            <Image
                                src="/images/kean school.png"
                                alt={`${personal.name} during his university years at USTP`}
                                fill
                                sizes="(min-width: 1024px) 26rem, 100vw"
                                className="scale-105 object-cover"
                            />
                        </div>
                        <figcaption className="mt-4 font-mono text-label uppercase text-ink-3">
                            USTP — the first four years
                        </figcaption>
                    </figure>

                    <div className="js-school-aside order-1 max-w-measure lg:order-2">
                        <span className="font-mono text-label uppercase text-ink-3">
                            Where it started
                        </span>
                        <p className="mt-5 font-serif text-d1 text-ink">
                            I took college from the University of Science and Technology
                            of Southern Philippines.
                        </p>
                        <p className="mt-6 text-body text-ink-2">
                            USTP is where I wrote my first lines of code — a course
                            requirement at first, then the part of the week I actually
                            looked forward to. Four years of projects, late submissions
                            and group work later, I left with an Information Technology
                            degree and a much clearer idea of what I wanted to build.
                        </p>
                    </div>
                </div>

                {/* Off duty — text leads this time, image held on the right,
                    so the row mirrors the USTP block instead of repeating it. */}
                <div className="js-offduty mt-20 grid gap-10 md:mt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-20">
                    <div className="js-aside max-w-measure lg:order-1">
                        <span className="font-mono text-label uppercase text-ink-3">
                            Away from the screen
                        </span>
                        <p className="mt-5 font-serif text-d1 text-ink">
                            {personal.bioExtended}
                        </p>
                        <p className="mt-6 hidden text-body text-ink-2 lg:block">
                            I tend to get invested in the things I enjoy — whether it's playing a game, following a good story, or building a website.
                        </p>
                    </div>

                    <figure className="lg:order-2">
                        <div className="js-shot relative aspect-[3/4] w-full overflow-hidden rounded-md bg-paper-3">
                            <Image
                                src="/images/kean float.jpg"
                                alt={`${personal.name} off duty, headphones on`}
                                fill
                                sizes="(min-width: 1024px) 22rem, 100vw"
                                className="scale-105 object-cover"
                            />
                        </div>
                    </figure>

                    {/* Same sentence as above — shown here instead, below the
                        photo, on mobile only. See the kean-grad quote above
                        for why. */}
                    <p className="js-aside text-body text-ink-2 lg:hidden">
                        I tend to get invested in the things I enjoy — whether it's playing a game, following a good story, or building a website.
                    </p>
                </div>

                {/* The close — same treatment as Stack's closing statement,
                    so the section hands off to Journey the way the page later
                    hands off from tools to "what carries over". */}
                <div className="js-close mt-28 flex flex-col items-center text-center md:mt-40">
                    <span
                        aria-hidden="true"
                        data-anim="rule-y"
                        className="js-close-rule h-[8vh] w-px origin-top bg-rule-strong"
                    />

                    <p className="js-close-meta mt-10 font-mono text-label uppercase text-ink-3">
                        What stays true either way
                    </p>

                    <p className="mt-10 mb-24 max-w-4xl font-serif text-d2 leading-tight text-ink md:mb-32">
                        <MaskWords text="A city, a school, a screen — the setting keeps changing. What I'm actually chasing hasn't." />
                    </p>
                </div>
            </div>
        </section>
    );
}
