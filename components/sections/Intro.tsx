import Marquee from "@/components/home/Marquee";

/**
 * The breath between the hero and the page: the arch marquee as the divider.
 */
export default function Intro() {
    return (
        <section className="bg-gradient-to-b from-paper to-paper-3">
            <Marquee />
        </section>
    );
}
