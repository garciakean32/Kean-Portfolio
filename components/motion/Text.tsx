import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * A single line inside a clipping mask. The outer element hides overflow, the
 * inner element is what GSAP moves — see the `[data-anim="mask"]` gate in
 * globals.css for the pre-animation state.
 */
export function MaskLine({
    children,
    className,
    innerClassName,
}: {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
}) {
    return (
        <span className={cn("mask", className)} data-anim="mask">
            <span className={cn("js-mask-inner", innerClassName)}>{children}</span>
        </span>
    );
}

/**
 * Words wrapped individually so they can stagger. Spaces stay outside the
 * masks so the text still wraps and selects as a sentence.
 */
export function MaskWords({
    text,
    className,
    wordClassName,
}: {
    text: string;
    className?: string;
    wordClassName?: string;
}) {
    const words = text.split(" ").filter(Boolean);

    return (
        <span className={className}>
            {words.map((word, i) => (
                <Fragment key={`${word}-${i}`}>
                    <span
                        className="mask inline-block align-bottom"
                        data-anim="mask"
                    >
                        <span className={cn("js-mask-inner inline-block", wordClassName)}>
                            {word}
                        </span>
                    </span>
                    {i < words.length - 1 ? " " : null}
                </Fragment>
            ))}
        </span>
    );
}
