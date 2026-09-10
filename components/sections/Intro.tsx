import DotGrid from "@/components/motion/DotGrid";

/**
 * The breath between the hero and the page: a field of dots that answers the
 * cursor, on the same ground the section either side of it is painted on.
 *
 * It replaces a run of service names travelling past — first flat, then around
 * a drum. Both said the same thing the services section says in full a screen
 * later, and said it loudly. This says nothing, which is what a breath is for.
 */
export default function Intro() {
    return (
        <section className="bg-gradient-to-b from-paper to-paper-3">
            <div className="h-[15rem] border-y border-rule md:h-[20rem]">
                <DotGrid />
            </div>
        </section>
    );
}
