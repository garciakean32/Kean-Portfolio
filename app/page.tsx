import Hero from "@/components/home/Hero";
import Intro from "@/components/sections/Intro";
import About, { Experience, Works } from "@/components/sections/About";
import VideoIntro from "@/components/sections/VideoIntro";
import Contact from "@/components/sections/Contact";

/**
 * The whole site, in one scroll — and all of it about the person.
 *
 * There are no routes: the dock and the footer point at anchors on this page,
 * and `lib/sections` owns both the scroll to a section and the question of
 * which one you are currently in.
 *
 * It runs dark from top to bottom: who I am, how I got here, what I have
 * built, a short video introduction, and a way to get in touch — each at
 * least a screen of its own, so no section crowds the next.
 */
/* Rebuilt at most once a day. The page is otherwise built once, at deploy,
   and the "years of coding" in the about section is worked out from a start
   date — so without this the prerendered copy would keep saying "1+" after
   the anniversary until the next deploy happened to come along. */
export const revalidate = 86400;

export default function HomePage() {
    return (
        <>
            <Hero />
            <Intro />
            <About />
            <Experience />
            <Works />
            <VideoIntro />
            <Contact />
        </>
    );
}
