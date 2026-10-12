import { cn } from "@/lib/utils";

/**
 * The small label that opens a section. The one structural device repeated
 * across sections.
 *
 * There is no index any more. Numbering the sections only ever told the reader
 * something the order had already told them.
 *
 * Pass `as="h2"` where the label really is the section's heading — several
 * sections lead with a statement rather than a title, and this keeps the
 * document outline intact without adding a second visible one.
 */
export default function SectionMark({
    label,
    as: Tag = "div",
    className,
}: {
    label: string;
    as?: "div" | "h2" | "h3";
    className?: string;
}) {
    return (
        <Tag className={cn("font-mono text-label uppercase text-ink-3", className)}>
            {label}
        </Tag>
    );
}
