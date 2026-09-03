import { personal, sections } from "@/lib/data";
import ResumeButton from "./ResumeButton";
import SectionLink from "./SectionLink";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-rule bg-paper-2">
            {/* The extra bottom padding is clearance for the scroll dock, which
                sits along the bottom edge below `lg`. */}
            <div className="shell mx-auto max-w-shell pb-28 pt-16 md:pt-24 lg:pb-24">
                {/* Two blocks, not three: the standing offer on the left and
                    the index against the right edge. `auto` on the second
                    column rather than a second `fr` is what keeps the nav a
                    column of links pinned to the margin instead of a half-empty
                    panel — with the "Elsewhere" list gone there is nothing left
                    to justify a third even share of the row. */}
                <div className="grid gap-14 md:grid-cols-[1.3fr_auto] md:items-start md:gap-16">
                    <div>
                        <p className="font-display text-d1 font-semibold tracking-[-0.025em] text-ink">
                            Available for new work.
                        </p>
                        <a
                            href={`mailto:${personal.email}`}
                            className="link-rule tap mt-5 inline-block font-mono text-meta lowercase text-ink-2"
                        >
                            {personal.email}
                        </a>
                        <div className="mt-8">
                            <ResumeButton />
                        </div>
                    </div>

                    <nav aria-label="Footer" className="md:justify-self-end">
                        <h2 className="font-mono text-label uppercase text-ink-3">Index</h2>
                        <ul className="mt-6 space-y-4">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <SectionLink
                                        id={section.id}
                                        className="link-rule tap inline-flex items-baseline gap-3 text-body text-ink-2 transition-colors hover:text-ink"
                                    >
                                        <span className="font-jp text-[0.8125rem] text-ink-3">
                                            {section.jp}
                                        </span>
                                        {section.label}
                                    </SectionLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-16 flex flex-col gap-3 border-t border-rule pt-6 font-mono text-meta uppercase tracking-[0.12em] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        © {year} {personal.name}
                    </span>
                    <span>
                        {personal.location} · {personal.timezone}
                    </span>
                </div>
            </div>
        </footer>
    );
}
