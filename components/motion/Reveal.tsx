"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { KineticTextReveal, type KineticTextRevealRef } from "@/components/ui/kinetic-text-reveal";
import { cn } from "@/lib/utils";

/* The page's one reveal, said once. A word rises into place out of its own
   box while it comes out of a blur, and so does every picture: same rise,
   same blur, same clock — so text and images arrive as one language rather
   than two. These are KineticTextReveal's own defaults, kept as they ship. */
const DURATION = 0.72;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const BLUR = "blur(6px)";

/* KineticTextReveal's own word-to-word stagger, for a line that takes it;
   and how far through its time a word looks in place on EASE. */
const KINETIC_STAGGER = 0.075;
const LANDED = 0.4;

/* Where on the screen something counts as arrived: a little way up from the
   bottom edge, so it reveals once it is properly in view rather than the
   instant its first pixel is. */
const IN_VIEW = "0px 0px -12% 0px";

/**
 * Text that reveals word by word when it scrolls into view.
 *
 * KineticTextReveal plays on mount, which on a page this long would spend
 * every reveal at load, out of sight. This holds it until its own line is on
 * screen and then plays it, once.
 *
 * Headings take the component's word-to-word stagger; a paragraph passes a
 * much smaller one, so a long one still lands in well under a second.
 */
export function RevealText({
    text,
    className,
    innerClassName,
    delay = 0,
    stagger,
    distance,
    onDone,
}: {
    text: string;
    /* on the line's own box */
    className?: string;
    /* on the row of words — `justify-center` for a centred line */
    innerClassName?: string;
    /* after arriving in view, seconds — to follow the line before it */
    delay?: number;
    stagger?: number;
    distance?: number;
    /* once the last word has landed, to the eye — for whatever follows it */
    onDone?: () => void;
}) {
    const box = useRef<HTMLSpanElement>(null);
    const handle = useRef<KineticTextRevealRef>(null);
    const done = useRef(0);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        let timer = 0;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                observer.disconnect();
                timer = window.setTimeout(() => handle.current?.play(), delay * 1000);
            },
            { rootMargin: IN_VIEW }
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            window.clearTimeout(timer);
            window.clearTimeout(done.current);
        };
    }, [delay]);

    // Landed is not finished: the ease puts a word in place in well under
    // half its time and spends the rest settling out of the blur, so waiting
    // for the animation to end leaves a beat of nothing after the words look
    // done. The last word starts one stagger per word in, and is in place
    // LANDED of the way through its own time.
    const words = text.split(/\s+/).filter(Boolean).length;
    const landed = ((words - 1) * (stagger ?? KINETIC_STAGGER) + DURATION * LANDED) * 1000;
    const started = onDone
        ? () => {
              window.clearTimeout(done.current);
              done.current = window.setTimeout(onDone, landed);
          }
        : undefined;

    return (
        <span ref={box} className={cn("block", className)}>
            <KineticTextReveal
                ref={handle}
                text={text}
                autoPlay={false}
                stagger={stagger}
                distance={distance}
                transition={{ duration: DURATION, ease: EASE }}
                onRevealStart={started}
                className={innerClassName}
                // Each word's clipping box carries a little padding underneath
                // for descenders; the negative margin gives that height back,
                // so the lines sit exactly as far apart as the type says.
                maskClassName="-mb-1"
            />
        </span>
    );
}

/**
 * A picture — or anything — revealed the way the words are: rising into place
 * as it comes out of a blur, once, when it scrolls into view.
 */
export function RevealBlock({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const reduced = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, filter: BLUR }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
            viewport={{ once: true, margin: IN_VIEW }}
            transition={reduced ? { duration: 0.01 } : { duration: DURATION, ease: EASE }}
        >
            {children}
        </motion.div>
    );
}
