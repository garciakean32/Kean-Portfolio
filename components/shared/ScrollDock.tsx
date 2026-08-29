"use client";

import { useRef } from "react";
import { sections } from "@/lib/data";
import { gsap, motionEnabled, useIsomorphicLayoutEffect } from "@/lib/motion";
import { scrollToSection, useActiveSection } from "@/lib/sections";
import { cn } from "@/lib/utils";
import SectionIcon from "./SectionIcon";

/**
 * All the chrome the site has, and it is two things.
 *
 * There is no navigation bar across the top and no side rail any more. What
 * replaced them:
 *
 * 1. A hairline of accent across the very top, filling as you scroll. It costs
 *    three pixels of screen and answers the only question a progress bar is
 *    ever asked — how much of this is left.
 * 2. The five sections, as a plain menu: down the right margin from `lg`,
 *    along the bottom edge below it. Same markup, same marks, same labels —
 *    only the axis changes, which is why `Dock` below is written once and
 *    handed an orientation rather than written twice.
 *
 * It used to be a map: the marks sat at each section's real position in the
 * document, so the gaps between them were the distances between sections.
 * That was a nice idea and a bad menu — the marks bunched wherever two
 * sections were close, needed a relaxation pass to stop them colliding, and
 * moved under the cursor whenever the page's height changed. Evenly spaced,
 * always in the same place, is what a navigation control is for.
 *
 * `data-chrome` holds all of it out of frame until the hero has finished
 * introducing itself; see the gate in globals.css.
 */
export default function ScrollDock() {
    const progress = useRef<HTMLDivElement>(null);
    const active = useActiveSection();

    /* The hairline, scrubbed against the whole document. Not gated on the
       motion flag like the rest of the site's animation: a progress bar that
       does not track the scroll is not a quieter progress bar, it is a broken
       one. What the flag does decide is the catch-up — a little lag reads as
       one continuous travel with motion on, and is the exact sensation to
       spare with it off. */
    useIsomorphicLayoutEffect(() => {
        const bar = progress.current;
        if (!bar) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                bar,
                { scaleX: 0 },
                {
                    scaleX: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: document.body,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: motionEnabled() ? 0.4 : true,
                    },
                }
            );
        });
        return () => ctx.revert();
    }, []);

    return (
        <>
            {/* 1 — how far there is left to go */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]"
            >
                <div ref={progress} className="h-full origin-left scale-x-0 bg-accent" />
            </div>

            {/* 2a — down the right margin. `--rail` is the width the page's
                content column already holds clear on that side, so this sits
                in reserved space rather than over anything. */}
            <nav
                data-chrome
                aria-label="Sections"
                className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
            >
                <Dock active={active} vertical />
            </nav>

            {/* 2b — along the bottom edge, where there is no right margin to
                live in. Thumb height, one row, and nothing above it has to
                move to make room. */}
            <nav
                data-chrome
                aria-label="Sections"
                className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 lg:hidden"
            >
                <Dock active={active} />
            </nav>
        </>
    );
}

/**
 * The menu itself, in one axis or the other.
 *
 * Everything that differs between the two is a flex direction and a couple of
 * sizes; everything that matters — the marks, the labels, what "current"
 * looks like — is shared, so the two can never drift apart.
 */
function Dock({ active, vertical = false }: { active: string; vertical?: boolean }) {
    return (
        <div
            className={cn(
                "border border-rule bg-paper/90 shadow-[0_8px_28px_-8px_rgb(0_0_0/0.6)] backdrop-blur-md",
                vertical
                    ? "flex w-16 flex-col items-stretch rounded-3xl py-1.5"
                    : "flex w-full max-w-md items-stretch justify-between rounded-full px-1.5"
            )}
        >
            {sections.map((section) => (
                <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-current={active === section.id ? "true" : undefined}
                    className={cn(
                        "group relative flex flex-col items-center justify-center gap-1 transition-colors duration-300",
                        active === section.id ? "text-ink" : "text-ink-3 hover:text-ink-2",
                        vertical ? "h-[3.75rem] w-full" : "h-14 flex-1 px-0.5"
                    )}
                >
                    {/* Which one you are in, said once. On the vertical menu it
                        is a stroke down the margin beside the mark; on the
                        horizontal one there is no margin to put it in, so the
                        accent on the mark carries it alone. */}
                    {vertical && (
                        <span
                            aria-hidden="true"
                            className={cn(
                                "absolute left-1 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full transition-colors duration-300",
                                active === section.id ? "bg-accent" : "bg-transparent"
                            )}
                        />
                    )}

                    <SectionIcon
                        id={section.id}
                        className={cn(
                            "h-[1.05rem] w-[1.05rem] transition-colors duration-300",
                            active === section.id && "text-accent"
                        )}
                    />
                    <span
                        className={cn(
                            "font-mono uppercase leading-none",
                            vertical
                                ? "text-[0.5625rem] tracking-[0.04em]"
                                : "text-[0.625rem] tracking-[0.06em]"
                        )}
                    >
                        {section.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
