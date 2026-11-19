import { cn } from "@/lib/utils";

/**
 * A picture behind a pane of glass — the frame every photograph and
 * screenshot on the page sits in: a clear slab a few pixels proud of the
 * picture, lit along its top edge, and the light splitting blue and red down
 * the picture's two sides, the works page's glass held still. The slab
 * stands out from the picture's box by its own thickness on every side
 * rather than eating into it, so a framed picture is as big as it would be
 * bare.
 *
 * `className` goes on the slab — its size and where it sits; `inner` on the
 * picture's own box — its shape, and anything that moves the picture inside
 * it.
 */
export default function GlassFrame({
    children,
    className,
    inner,
}: {
    children: React.ReactNode;
    className?: string;
    inner?: string;
}) {
    return (
        <div
            className={cn(
                "-m-[calc(0.5rem_+_1px)] rounded-[1.375rem] border border-white/15 bg-white/[0.04] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_30px_60px_-30px_rgba(0,0,0,0.9)]",
                className
            )}
        >
            <div
                className={cn(
                    "relative overflow-hidden rounded-[0.875rem] shadow-[-1.5px_0_0_rgba(0,157,255,0.55),1.5px_0_0_rgba(255,64,160,0.45),0_0_0_1px_rgba(255,255,255,0.1)]",
                    inner
                )}
            >
                {children}
            </div>
        </div>
    );
}
