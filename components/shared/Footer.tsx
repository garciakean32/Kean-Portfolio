import { personal, sections } from "@/lib/data";
import ResumeButton from "./ResumeButton";
import SectionLink from "./SectionLink";

const socials = [
    { href: personal.social.github, label: "GitHub" },
    { href: personal.social.instagram, label: "Instagram" },
    { href: personal.social.facebook, label: "Facebook" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-rule bg-paper-2">
            {/* The extra bottom padding is clearance for the scroll dock, which
                sits along the bottom edge below `lg`. */}
            <div className="shell mx-auto max-w-shell pb-28 pt-16 md:pt-24 lg:pb-24">
                <div className="grid gap-14 md:grid-cols-[1.3fr_1fr_1fr] md:gap-10">
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

                    <nav aria-label="Footer">
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

                    <div>
                        <h2 className="font-mono text-label uppercase text-ink-3">Elsewhere</h2>
                        <ul className="mt-6 space-y-4">
                            {socials.map((social) => (
                                <li key={social.label}>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-rule tap inline-block text-body text-ink-2 transition-colors hover:text-ink"
                                    >
                                        {social.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
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
