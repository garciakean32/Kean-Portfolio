"use client";

import { Fragment, useId } from "react";
import { marqueeServices } from "@/lib/data";
import { gsap, useGsap } from "@/lib/motion";

/**
 * The run has to stay covered across the whole loop, so it needs to span at
 * least one repeat (the travel distance) plus the arc itself.
 */
const REPEATS = 3;
const GLOSS_DROP = 30;

/** User units per second. Lower is statelier. */
const SPEED = 130;

/**
 * The section separator: services set in Japanese along an arc, each glossed
 * in English just beneath it.
 *
 * No background — the arc itself is the divider.
 *
 * Two things worth knowing:
 *
 * 1. The gloss shares the Japanese text run (dropped with `dy`) rather than
 *    riding its own concentric path. Two paths would need two measurements and
 *    two loop periods, and since the English and Japanese runs are different
 *    lengths the gloss would slide out from under its term.
 * 2. The loop animates `startOffset` in user units, not percentages, because
 *    seamlessness needs travel of exactly one repeat of the text — which is a
 *    text length, not a fraction of the path. That length is measured off the
 *    real first repeat, not a stand-in: the run mixes an 88px display face
 *    with a 26px mono gloss, so anything measured at a single size comes back
 *    short and the loop visibly jumps on every reset.
 */
export default function Marquee() {
    const archId = `arch-${useId().replace(/:/g, "")}`;

    const scope = useGsap<HTMLDivElement>((el) => {
        const run = () => {
            const path = el.querySelector<SVGTextPathElement>(".js-arch");
            const unitEl = el.querySelector<SVGTSpanElement>(".js-unit");
            if (!path || !unitEl) return;

            const unit = unitEl.getComputedTextLength();
            if (!unit || !Number.isFinite(unit)) return;

            // Travels 0 → -unit. It has to go negative: glyphs sitting past
            // the end of the path are not rendered, so starting at +unit would
            // push the entire run off the arc and draw nothing. Going negative
            // slides the head off the near end while the tail keeps feeding in,
            // and after exactly one repeat the arc looks identical again.
            gsap.fromTo(
                path,
                { attr: { startOffset: 0 } },
                {
                    attr: { startOffset: -unit },
                    duration: unit / SPEED,
                    ease: "none",
                    repeat: -1,
                }
            );
        };

        // Measuring before the webfonts land gives a short unit and a visible
        // seam, so wait for them where the browser supports it.
        if (!document.fonts || document.fonts.status === "loaded") run();
        else document.fonts.ready.then(run).catch(run);
    });

    return (
        <div ref={scope} className="relative overflow-hidden">
            <h2 className="sr-only">Services</h2>

            {/* The run rides above the path at the apex and rotates out at the
                ends, so the box is taller than the arc it holds. */}
            <svg
                viewBox="0 -100 1600 560"
                className="w-full text-ink"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
            >
                <defs>
                    {/* A wide, shallow arch. Both ends run well off-canvas so
                        the run never appears to start or stop. */}
                    <path id={archId} d="M -260 340 C 300 60, 1300 60, 1860 340" fill="none" />
                </defs>

                <text
                    className="font-display"
                    fontSize="88"
                    fontWeight="700"
                    letterSpacing="-1"
                    fill="currentColor"
                >
                    <textPath className="js-arch" href={`#${archId}`} startOffset="0">
                        {Array.from({ length: REPEATS }).map((_, repeat) => (
                            // The first repeat is what gets measured, so it has
                            // to be the real thing rather than a copy set at a
                            // single size.
                            <tspan key={repeat} className={repeat === 0 ? "js-unit" : undefined}>
                                {marqueeServices.map((service) => (
                                    <Fragment key={service.jp}>
                                        <tspan>{service.jp}</tspan>
                                        <tspan
                                            dy={GLOSS_DROP}
                                            fontSize="26"
                                            fontWeight="400"
                                            letterSpacing="3"
                                            fill="rgb(var(--ink-3))"
                                            className="font-mono"
                                        >
                                            {service.en.toUpperCase()}
                                        </tspan>
                                        <tspan dy={-GLOSS_DROP}>{"　—　"}</tspan>
                                    </Fragment>
                                ))}
                            </tspan>
                        ))}
                    </textPath>
                </text>
            </svg>
        </div>
    );
}
