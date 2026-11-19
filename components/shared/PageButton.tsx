import { TextMorph } from "@/components/ui/text-morph";

/* The white pill a home page section opens its own page with — "View my
   experience", "View my works" — the same on a button and on a link. */
export const PAGE_BUTTON =
    "group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-7 font-mono text-label uppercase tracking-[0.16em] text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.85)] transition-colors duration-300 hover:bg-white/85";

const BUSY = "Redirecting…";

/**
 * What the pill says: its label, or "Redirecting…" with a spinner while the
 * page it opens waits on something — see `beforeOpen` on either page.
 *
 * One size whatever it says: both labels share a cell sized by the longer of
 * the two, and the mark beside them has a slot of its own, the spinner's size.
 */
export function PageButtonLabel({ label, busy }: { label: string; busy: boolean }) {
    return (
        <>
            <span className="grid justify-items-center">
                {[label, BUSY].map((word) => (
                    <span key={word} aria-hidden="true" className="invisible [grid-area:1/1]">
                        {word}
                    </span>
                ))}
                <TextMorph
                    words={[label, BUSY]}
                    index={busy ? 1 : 0}
                    morphDuration={480}
                    className="[grid-area:1/1]"
                />
            </span>
            <span aria-hidden="true" className="grid w-3 place-items-center">
                {busy ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-black/20 border-t-black" />
                ) : (
                    <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                        ↗
                    </span>
                )}
            </span>
        </>
    );
}
