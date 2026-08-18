import { cn } from "@/lib/utils";

/**
 * Index + rule + label. The one structural device repeated across sections.
 *
 * Pass `as="h2"` where the label really is the section's heading — several
 * sections lead with a statement rather than a title, and this keeps the
 * document outline intact without adding a second visible one.
 */
export default function SectionMark({
    index,
    label,
    as: Tag = "div",
    className,
}: {
    index?: string;
    label: string;
    as?: "div" | "h2" | "h3";
    className?: string;
}) {
    return (
        <Tag className={cn("flex items-center gap-4", className)}>
            {index && <span className="font-mono text-label text-accent">{index}</span>}
            <span aria-hidden="true" className="h-px w-10 bg-rule-strong" />
            <span className="font-mono text-label uppercase text-ink-3">{label}</span>
        </Tag>
    );
}
