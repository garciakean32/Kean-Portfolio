"use client";

import { cn } from "@/lib/utils";
import { gsap, SEAM_DRIFT, useGsap } from "@/lib/motion";

type HoldEffect = "dim" | "scale" | "still";

/**
 * The region below travels up over the one above it, and both keep moving.
 *
 * This used to pin the outgoing region: it froze dead for a viewport while
 * the new one climbed over it, and the scroll ran into that stop like a wall
 * — the page was still taking input but nothing above the seam answered it.
 * Now the outgoing region simply falls behind. A scrubbed `y` pushes it down
 * by `SEAM_DRIFT` of a viewport across exactly the span the incoming region
 * needs to climb from the bottom edge of the screen to the top, so it recedes
 * at a fraction of scroll speed rather than at none of it. Everything on
 * screen is moving the whole way through; only the rates differ.
 *
 * The timing falls out of that span rather than being dialled in. The window
 * is the incoming region's own arrival — `top bottom` to `top top` — so the
 * drift finishes on the exact frame that region comes flush with the top of
 * the screen. There is no overshoot to absorb and no hand-off to catch: the
 * transition ends where normal scrolling would have put things anyway.
 *
 * Nothing here changes layout. The drift is a transform and the incoming
 * region keeps its ordinary place in the document, so the page is the height
 * it reads as, no viewport of pinned scroll is bought or spent, and anything
 * inside either region measures its own position honestly — which is what
 * lets the outgoing region carry scroll-linked work of its own.
 *
 * The drift goes *downwards* here, and that is the direction that keeps it
 * safe: the hole it opens behind itself is at the outgoing region's top edge,
 * a screen or more above the seam and long gone by the time any of this runs,
 * while the edge it pushes into — the bottom — is the one already covered by
 * the incoming region on `z-10`. `RevealUnder` drifts the other way and has
 * to work considerably harder for the same guarantee; see it for what a hole
 * on the wrong side of a seam actually looks like. The one thing assumed here
 * is that `hold` is comfortably taller than a viewport, which it is by
 * nature — it is the tail of a long region, not a panel of its own.
 *
 * Pass `tone="light"` to invert the incoming region to paper — `.light-panel`
 * re-declares the colour tokens for the whole subtree, so nothing inside needs
 * to know which mode it is in.
 */
export default function SlideOver({
    hold,
    children,
    tone = "light",
    effect = "dim",
    className,
}: {
    hold: React.ReactNode;
    children: React.ReactNode;
    tone?: "light" | "dark";
    effect?: HoldEffect;
    className?: string;
}) {
    const scope = useGsap<HTMLDivElement>((el) => {
        const behind = el.querySelector<HTMLElement>(".js-hold");
        const front = el.querySelector<HTMLElement>(".js-over");
        if (!behind || !front) return;

        const mm = gsap.matchMedia();

        // Below `md` the page just changes colour at the seam. Two regions
        // moving at different rates costs more than it is worth on a phone.
        mm.add("(min-width: 768px)", () => {
            const to: gsap.TweenVars = {
                // Resolved per refresh, not once: `invalidateOnRefresh` below
                // re-reads it so the drift still matches the viewport after a
                // resize or a mobile browser's collapsing address bar.
                y: () => window.innerHeight * SEAM_DRIFT,
                ease: "none",
            };

            if (effect === "dim") to.opacity = 0.4;
            if (effect === "scale") {
                to.opacity = 0.55;
                to.scale = 0.94;
            }

            gsap.to(behind, {
                ...to,
                scrollTrigger: {
                    trigger: front,
                    start: "top bottom",
                    end: "top top",
                    // Straight through, no smoothing: the drift has to be
                    // spent exactly when the window closes, and Lenis has
                    // already eased the scroll position feeding it.
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });
        });
    });

    return (
        <div ref={scope} className={cn("relative", className)}>
            <div className="js-hold">{hold}</div>

            {/* No `overflow` here on purpose — clipping would break the
                sideways scroll a region like this can contain. The seam is a
                straight edge; the shadow is what separates it from the region
                falling behind it, which the drift carries in under this one. */}
            <div
                className={cn(
                    "js-over relative z-10 shadow-[0_-32px_64px_-16px_rgb(0_0_0/0.8)]",
                    tone === "light" && "light-panel"
                )}
            >
                {children}
            </div>
        </div>
    );
}
