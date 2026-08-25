import { Fragment } from "react";
import { marqueeServices } from "@/lib/data";

/**
 * The section separator: services set in Japanese in one straight run, each
 * glossed in English beside it, travelling left forever.
 *
 * Two identical tracks side by side, each translating left by exactly its own
 * width — see `.marquee` in globals.css. When the first has moved a full width
 * the second is sitting precisely where it started, so the loop has no seam
 * and needs no measurement to find one. That is the whole reason this is CSS
 * rather than JS: the arch it replaced had to measure a mixed-size text run at
 * runtime and wait on webfonts before it could even start.
 *
 * Decorative: every term here is set again as real text in the "What I build"
 * section, so there is nothing for a screen reader to gain by reading the run
 * a second time.
 */
export default function Marquee() {
    return (
        <div
            aria-hidden="true"
            className="marquee select-none border-y border-rule py-6 md:py-8"
        >
            {[0, 1].map((track) => (
                <div key={track} className="marquee-track">
                    {marqueeServices.map((service) => (
                        <Fragment key={service.jp}>
                            <span className="flex shrink-0 items-baseline gap-4 px-6 md:gap-5 md:px-8">
                                <span className="font-jp text-d2 font-medium leading-none text-ink">
                                    {service.jp}
                                </span>
                                <span className="font-mono text-label uppercase text-ink-3">
                                    {service.en}
                                </span>
                            </span>
                            <span className="shrink-0 font-display text-d2 leading-none text-rule-strong">
                                —
                            </span>
                        </Fragment>
                    ))}
                </div>
            ))}
        </div>
    );
}
