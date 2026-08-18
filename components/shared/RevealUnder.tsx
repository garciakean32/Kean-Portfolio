"use client";

import { cn } from "@/lib/utils";
import { gsap, SEAM_DRIFT, useGsap } from "@/lib/motion";

/**
 * The mirror of `SlideOver`: the region on top scrolls away upwards and
 * uncovers the one waiting underneath it — and, as there, both keep moving.
 * Nothing is pinned and nothing is stuck; `under` starts `SEAM_DRIFT` of a
 * viewport higher than it belongs, tucked up behind the cover (which is
 * opaque and sits above it), and settles back to nought across the uncover.
 * It rises at a fraction of scroll speed rather than at none of it, so the
 * cover's bottom edge still outruns it and still peels it open, but nothing
 * on screen is ever stopped.
 *
 * The window is the cover's own exit — `bottom bottom` to `bottom top` — so
 * the drift is spent on the exact frame the cover clears the top of the
 * screen, which is also the frame `under` reaches the position it would have
 * had with no transition at all.
 *
 * ---
 *
 * The one thing this has to be careful about is what a drift leaves *behind*
 * it. Lifting a region by `SEAM_DRIFT` of a viewport opens a hole of exactly
 * that size between its bottom edge and whatever follows it in the document —
 * and since the thing that follows here is the rest of the light region, that
 * hole reads as a black band splitting the page's paper in two, closing only
 * as the seam finishes. It is not a rounding error at the seam; it is the
 * drift itself, seen from below.
 *
 * So the drift is kept off the element that holds the region's place. The
 * outer wrapper is never transformed: it keeps `under`'s full layout height,
 * carries `underClassName`'s background, and stays flush against the cover
 * above and the next section below, so there is no hole in the page for a
 * hole to show through. Only `js-reveal-drift` inside it moves. What the
 * drift now exposes is the wrapper's own background — paper against paper —
 * rather than the gap between two sections.
 *
 * `md:min-h-[100svh]` finishes the job. The wrapper is untransformed, so its
 * bottom edge sits at least a full screen below its top for the whole window,
 * which puts the next section off screen until the seam is done. Whatever the
 * drift is doing, the reader never sees the join until it is already correct
 * — the bug this guards against was watching the work's heading and the track
 * below it visibly finish connecting.
 *
 * Below `md`, and with motion off, nothing is transformed and the two regions
 * simply stack and scroll: a seam like this is not worth its cost on a phone,
 * and "one thing lags behind another" is the exact sensation reduced motion
 * asks to be spared.
 *
 * Anything inside `under` that animates on arrival should trigger off
 * `js-reveal-cover` — the cover's bottom edge is the honest measure of how
 * much of `under` the reader can see — rather than off its own position,
 * which is up to `SEAM_DRIFT` of a viewport out until the seam is done.
 */
export default function RevealUnder({
    children,
    under,
    className,
    underClassName,
}: {
    children: React.ReactNode;
    under: React.ReactNode;
    className?: string;
    /**
     * Goes on the wrapper that holds the region's place, not on the part that
     * drifts — `.light-panel` above all. That is what makes the drift expose
     * this region's own background instead of the page behind it.
     */
    underClassName?: string;
}) {
    const scope = useGsap<HTMLDivElement>((el) => {
        const cover = el.querySelector<HTMLElement>(".js-reveal-cover");
        const drift = el.querySelector<HTMLElement>(".js-reveal-drift");
        if (!cover || !drift) return;

        const mm = gsap.matchMedia();

        mm.add("(min-width: 768px)", () => {
            gsap.fromTo(
                drift,
                // Read per refresh, so a resize re-measures the tuck rather
                // than leaving the region parked at a stale offset.
                { y: () => -window.innerHeight * SEAM_DRIFT },
                {
                    y: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: cover,
                        start: "bottom bottom",
                        end: "bottom top",
                        scrub: true,
                        invalidateOnRefresh: true,
                    },
                }
            );
        });
    });

    return (
        <div ref={scope} className={cn("relative", className)}>
            <div className="js-reveal-cover relative z-10">{children}</div>
            <div className={cn("relative z-0 md:min-h-[100svh]", underClassName)}>
                <div className="js-reveal-drift">{under}</div>
            </div>
        </div>
    );
}
