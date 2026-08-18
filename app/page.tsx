import Hero from "@/components/home/Hero";
import Positioning from "@/components/home/Positioning";
import Capabilities from "@/components/home/Capabilities";
import SelectedWork, { SelectedWorkIntro } from "@/components/home/SelectedWork";
import Together from "@/components/home/Together";
import CallToAction from "@/components/home/CallToAction";
import SlideOver from "@/components/shared/SlideOver";
import RevealUnder from "@/components/shared/RevealUnder";

/**
 * The page runs dark, turns to paper for the work, and comes back to dark to
 * close — with a transition at each seam and normal scrolling in between.
 *
 * Going in, "What can I do for you?" scrolls away upwards and uncovers the
 * light region waiting underneath it. Coming out, the close climbs over the
 * last screen of that region. The two are deliberate mirrors of each other,
 * and neither stops the page: both are a matter of one region drifting
 * against the other and landing flush as the seam closes.
 *
 * The light region is one continuous scroll from the work's heading to the
 * end of "How it goes" — three siblings rather than one block only because
 * the reveal displaces what it uncovers for the length of the seam, and the
 * work's sideways track reads its own document position to size its scroll
 * budget. So the heading goes under the reveal on its own and the track
 * follows in plain flow. "How it goes" is the drifting side of the close,
 * which is measured at rest and can hold scroll-linked work quite happily.
 */
export default function HomePage() {
    return (
        <>
            <Hero />
            <Positioning />

            <RevealUnder under={<SelectedWorkIntro />} underClassName="light-panel">
                <Capabilities />
            </RevealUnder>

            <div className="light-panel">
                <SelectedWork />
            </div>

            {/* `light-panel` goes on the held region only — put it on the
                wrapper and it would cascade into the close rising over it. */}
            <SlideOver
                tone="dark"
                effect="dim"
                hold={
                    <div className="light-panel">
                        <Together />
                    </div>
                }
            >
                <CallToAction />
            </SlideOver>
        </>
    );
}
