import { cn } from "@/lib/utils";

/**
 * One mark per section, drawn rather than imported.
 *
 * They are hand-cut instead of pulled from an icon set for one reason: the
 * site's whole line vocabulary is a hairline — every rule, every underline,
 * every border on the page is 1px — and every icon library ships at a stroke
 * weight two or three times that. An icon set at its own weight would be the
 * heaviest thing on the screen. These sit at 1.25 and read as part of the same
 * drawing.
 *
 * Recognisability wins over theming here. The rail around them carries the
 * Japanese reading; the marks themselves stay plain enough that nobody has to
 * learn them: a house, a figure, stacked sheets, a set of panes, an envelope.
 */
const PATHS: Record<string, React.ReactNode> = {
    top: (
        <>
            <path d="M3.5 10.2 12 3.5l8.5 6.7" />
            <path d="M5.8 9v11.5h12.4V9" />
        </>
    ),
    about: (
        <>
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.8 20.5a7.2 7.2 0 0 1 14.4 0" />
        </>
    ),
    work: (
        <>
            <path d="M12 3.2 21 8l-9 4.8L3 8z" />
            <path d="m3 12.6 9 4.8 9-4.8" />
            <path d="m3 17.1 9 4.8 9-4.8" />
        </>
    ),
    services: (
        <>
            <rect x="3.3" y="3.3" width="7.4" height="7.4" rx="1" />
            <rect x="13.3" y="3.3" width="7.4" height="7.4" rx="1" />
            <rect x="3.3" y="13.3" width="7.4" height="7.4" rx="1" />
            <rect x="13.3" y="13.3" width="7.4" height="7.4" rx="1" />
        </>
    ),
    contact: (
        <>
            <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="1.6" />
            <path d="m3.4 6.6 8.6 6 8.6-6" />
        </>
    ),
};

export default function SectionIcon({
    id,
    className,
}: {
    id: string;
    className?: string;
}) {
    const path = PATHS[id];
    if (!path) return null;

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("shrink-0", className)}
        >
            {path}
        </svg>
    );
}
