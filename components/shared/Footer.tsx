import { personal, sections } from "@/lib/data";
import ResumeButton from "./ResumeButton";
import SectionLink from "./SectionLink";
import VisitorCount from "./VisitorCount";
import FooterDoodles from "./FooterDoodles";

export default function Footer() {
    return (
        <footer className="border-t border-rule bg-paper-2">
            <div className="shell mx-auto w-full max-w-shell pb-10 pt-12 md:pb-14 md:pt-16">
                {/* The standing offer on the left, the index against the right
                    edge. */}
                <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start md:gap-12">
                    <div>
                        <p className="font-display text-d1 font-semibold tracking-[-0.025em] text-ink">
                            Available for work.
                        </p>
                        <a
                            href={`mailto:${personal.email}`}
                            className="link-rule tap mt-4 inline-block font-mono text-meta lowercase text-ink-2"
                        >
                            {personal.email}
                        </a>
                        <div className="mt-6">
                            <ResumeButton />
                        </div>
                    </div>

                    <nav aria-label="Footer" className="md:justify-self-end">
                        <h2 className="font-mono text-label uppercase text-ink-3">Index</h2>
                        <ul className="mt-5 space-y-3">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <SectionLink
                                        id={section.id}
                                        className="link-rule tap inline-block text-body text-ink-2 transition-colors hover:text-ink"
                                    >
                                        {section.label}
                                    </SectionLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-10 flex flex-col gap-3 border-t border-rule pt-5 font-mono text-meta uppercase tracking-[0.12em] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        © {personal.name}
                        <VisitorCount />
                    </span>
                    <span>
                        {personal.location} · {personal.timezone}
                    </span>
                </div>
            </div>

            {/* The name of the thing, standing on the floor of the page.

                Clipped on both axes, not just sideways. The word is set at a
                line height well under its own glyph box, so that box spills
                past the bottom of the line — and unclipped, the spill made
                the document taller than the footer, leaving a strip of bare
                page under it. Nothing visible is lost: the letters themselves
                sit inside the line, on its bottom edge.

                Flush with the bottom of the screen from `lg`. Below it the
                section bar is pinned along that edge, so the padding there is
                exactly its height (plus a phone's home-indicator inset) and
                the bar sits in it rather than on the word.

                `aria-hidden`: it is the site's own name set as decoration,
                already in the document title, and a screen reader reaching
                the end of the page does not need it again.

                The room above it is for the doodles drawn round it — the
                hero's own, so the page closes the way it opened; see
                FooterDoodles. They are laid out over the word, so they come
                first. */}
            <div className="relative overflow-clip pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-20 md:pt-28 lg:pb-0 lg:pt-36">
                <FooterDoodles />
                <span
                    aria-hidden="true"
                    className="block select-none text-center font-display text-[clamp(2.5rem,14vw,12rem)] font-extrabold uppercase leading-[0.78] tracking-[-0.05em] text-ink"
                >
                    Portfolio
                </span>
            </div>
        </footer>
    );
}
