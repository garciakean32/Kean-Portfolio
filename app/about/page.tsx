import type { Metadata } from "next";
import Masthead from "@/components/about/Masthead";
import Story from "@/components/about/Story";
import Journey from "@/components/about/Journey";
import Stack from "@/components/about/Stack";
import AboutClose from "@/components/about/AboutClose";
import SlideOver from "@/components/shared/SlideOver";
import RevealUnder from "@/components/shared/RevealUnder";

export const metadata: Metadata = {
    title: "About",
    description:
        "Kean Valgere E. Garcia — full-stack web developer and IT graduate based in the Philippines. How he got into the web, how he works, and what he builds with.",
};

export default function AboutPage() {
    return (
        <>
            <Masthead />

            {/* "Who I am" holds while "How I got here" and the tools arrive
                over it in paper — one continuous light region until the reveal
                uncovers the close underneath, same shape as the home page. */}
            <RevealUnder under={<AboutClose />}>
                <SlideOver effect="scale" hold={<Story />}>
                    <Journey />
                    <Stack />
                </SlideOver>
            </RevealUnder>
        </>
    );
}
