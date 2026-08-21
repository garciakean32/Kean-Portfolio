"use client";

import { motion } from "framer-motion";
import { personal } from "@/lib/data";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Two states in one slot.
 *
 * At the top of the page: a small "my name is" label (オレの名は), then the full
 * name. Once the bar condenses, the label shrinks away and the name collapses
 * to nothing, and the KEAN mark takes the label's place — so the whole block
 * draws itself in from the right and the bar visibly tightens.
 *
 * The mark is what sizes the slot, and the label is absolutely positioned
 * across that same box.
 */
export default function Logo({
    condensed = false,
    reduce = false,
    className,
}: {
    condensed?: boolean;
    reduce?: boolean;
    className?: string;
}) {
    const t = reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT };

    return (
        <span className={cn("relative flex min-h-[1.75rem] items-center", className)}>
            <span className="relative inline-flex items-center">
                <motion.span
                    className="inline-flex items-center"
                    initial={false}
                    animate={{ opacity: condensed ? 1 : 0 }}
                    transition={t}
                >
                    <span className="font-display text-[1.0625rem] font-extrabold leading-none tracking-[-0.045em] text-ink">
                        Kean
                    </span>
                    <span className="font-jp text-[1.0625rem] font-extrabold leading-none text-accent">
                        一
                    </span>
                </motion.span>

                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 flex w-full items-center"
                >
                    <motion.span
                        className="origin-left whitespace-nowrap font-jp text-sm text-accent"
                        initial={false}
                        animate={{ scale: condensed ? 0 : 1, opacity: condensed ? 0 : 1 }}
                        transition={t}
                    >
                        オレの名は
                    </motion.span>
                </span>
            </span>

            <motion.span
                className="overflow-hidden whitespace-nowrap font-display text-[1.0625rem] font-medium tracking-[-0.01em] text-ink"
                initial={false}
                animate={{
                    width: condensed ? 0 : "auto",
                    opacity: condensed ? 0 : 1,
                    marginLeft: condensed ? 0 : 14,
                }}
                transition={t}
            >
                {personal.name}
            </motion.span>
        </span>
    );
}
