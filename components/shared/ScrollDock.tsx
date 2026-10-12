"use client";

import { useEffect, useRef, useState } from "react";
import {
    BriefcaseBusiness,
    House,
    Mail,
    User,
    Video,
    type LucideIcon,
} from "lucide-react";
import { IconBar, type IconBarItem } from "@/components/ui/icon-bar";
import { sections } from "@/lib/data";
import { gsap, ScrollTrigger, motionEnabled, useIsomorphicLayoutEffect } from "@/lib/motion";
import { JUMP_MS, scrollToSection, useActiveSection } from "@/lib/sections";

/* One mark per section, and plain enough that nobody has to learn them: a
   house, a figure, a briefcase, a camera, an envelope. */
const ICONS: Record<string, LucideIcon> = {
    top: House,
    about: User,
    experience: BriefcaseBusiness,
    video: Video,
    contact: Mail,
};

const ITEMS: IconBarItem[] = sections.map(({ id, label }) => ({
    key: id,
    label,
    Icon: ICONS[id],
}));

/* The bar's elastic knobs, both at zero: no stretch across the two slots
   in transit and no overshoot on landing. The wash slides and stops. */
const STEADY = { dilate: 0, bounce: 0 } as const;

/**
 * All the chrome the site has, and it is two things.
 *
 * There is no navigation bar across the top and no side rail any more. What
 * replaced them:
 *
 * 1. A hairline across the very top, filling as you scroll. It costs three
 *    pixels of screen and answers the only question a progress bar is ever
 *    asked — how much of this is left.
 * 2. The sections, as a glass icon bar (`IconBar`): down the right margin
 *    from `lg`, along the bottom edge below it. No labels — each mark names
 *    its section to assistive tech and in a hover tooltip instead. The
 *    current section is a wash behind its mark that slides to the next one,
 *    whether the reader clicked it or simply scrolled there. Same bar, same
 *    marks — only the axis changes.
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

    /* A jump scrolls past every section between here and there, and the
       scroll-driven answer would walk the indicator through each of them on
       the way. So the slot clicked holds until the jump has landed, and the
       scroll takes over again from there. */
    const [pinned, setPinned] = useState<string | null>(null);
    const release = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(release.current), []);

    const go = (id: string) => {
        setPinned(id);
        scrollToSection(id);
        window.clearTimeout(release.current);
        release.current = window.setTimeout(() => setPinned(null), JUMP_MS);
    };
    const current = pinned ?? active;

    /* The hairline, scrubbed against the whole document. Not gated on the
       motion flag like the rest of the site's animation: a progress bar that
       does not track the scroll is not a quieter progress bar, it is a broken
       one. What the flag does decide is the catch-up — a little lag reads as
       one continuous travel with motion on, and is the exact sensation to
       spare with it off.

       The span is read live, and that is the whole point of writing it this
       way. `<body>`'s bottom edge resolves to the same number once the page
       has settled — the bug was never the geometry, it was that the number
       is measured once and this page is not the length it was when the
       measurement happened — images and fonts keep arriving after the first
       triggers exist, and a bar still holding the earlier figure finishes
       its travel early and then sits full. A function `end` plus
       `invalidateOnRefresh` means the figure is re-read at every refresh
       rather than cached from the first one, and `maxScroll` states the
       quantity the bar actually wants instead of inferring it from a box.
       See `endIntro` in lib/intro.ts for the refresh that guarantees at
       least one of those happens after the page has finished growing. */
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
                        start: 0,
                        end: () => ScrollTrigger.maxScroll(window),
                        invalidateOnRefresh: true,
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
                <div ref={progress} className="h-full origin-left scale-x-0 bg-white" />
            </div>

            {/* 2a — down the right margin. `--rail` is the width the page's
                content column already holds clear on that side, so this sits
                in reserved space rather than over anything. */}
            <div
                data-chrome
                className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
            >
                <IconBar
                    items={ITEMS}
                    active={current}
                    onSelect={go}
                    axis="column"
                    label="Sections"
                    {...STEADY}
                />
            </div>

            {/* 2b — along the bottom edge, where there is no right margin to
                live in. Thumb height, one row, and nothing above it has to
                move to make room. Only as wide as the bar, so the rest of the
                bottom edge stays clickable — and with no `pointer-events`
                of its own, so the intro gate in globals.css still switches
                the whole thing off while the hero is running.

                The bottom padding is a floor, not a fixed gap: on a phone
                with a home indicator the last ~34px of the viewport is a
                system gesture area, and a bar sitting flush in it is one the
                thumb cannot reliably hit — the swipe wins. `env()` is 0 on
                every screen that has no such inset, so this is the same 12px
                gap everywhere else. */}
            <div
                data-chrome
                className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
            >
                <IconBar
                    items={ITEMS}
                    active={current}
                    onSelect={go}
                    label="Sections"
                    {...STEADY}
                />
            </div>
        </>
    );
}
