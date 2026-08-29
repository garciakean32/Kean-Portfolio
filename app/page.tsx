import Hero from "@/components/home/Hero";
import Intro from "@/components/sections/Intro";
import About from "@/components/sections/About";
import Work, { WorkIntro } from "@/components/sections/Work";
import Services from "@/components/sections/Services";
import Contact from "@/components/sections/Contact";
import ImageBand from "@/components/shared/ImageBand";
import RevealUnder from "@/components/shared/RevealUnder";
import SlideOver from "@/components/shared/SlideOver";

/**
 * The whole site, in one scroll.
 *
 * There are no routes: the dock and the footer point at anchors on this page,
 * and `lib/sections` owns both the scroll to a section and the question of
 * which one you are currently in.
 *
 * The page runs dark, turns to paper for the work and what it leads to, then
 * comes back to dark to close — with a transition at each seam and ordinary
 * scrolling in between.
 *
 * Going in, About scrolls away upwards and uncovers the light region waiting
 * underneath it. Coming out, the close climbs over the last screen of that
 * region. The two are deliberate mirrors of each other, and neither stops the
 * page: both are one region drifting against the other and landing flush as
 * the seam closes.
 *
 * The light region is one continuous scroll from the work's heading to the end
 * of the services — three siblings rather than one block only because the
 * reveal displaces what it uncovers for the length of the seam, and the work's
 * sideways track reads its own document position to size its scroll budget. So
 * the heading goes under the reveal on its own and the track follows in plain
 * flow. The services are the drifting side of the close, which is measured at
 * rest and can hold scroll-linked work quite happily.
 */
export default function HomePage() {
    return (
        <>
            <Hero />
            <Intro />

            <RevealUnder under={<WorkIntro />} underClassName="light-panel">
                <About />
            </RevealUnder>

            {/* `light-panel` goes on each held region only — put it on a
                wrapper around the close and it would cascade into the dark
                section rising over it. */}
            <div className="light-panel">
                <Work />
                <ImageBand
                    src="/images/gray wave.webp"
                    alt=""
                    tone="from-paper to-paper-3"
                    height="h-[34svh] min-h-[12rem] md:h-[52svh]"
                />
            </div>

            <SlideOver
                tone="dark"
                effect="dim"
                hold={
                    <div className="light-panel">
                        <Services />
                    </div>
                }
            >
                <Contact />
            </SlideOver>
        </>
    );
}
