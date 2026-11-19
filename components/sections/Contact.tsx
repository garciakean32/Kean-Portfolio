"use client";

import { useRef, useState } from "react";
import { RevealText } from "@/components/motion/Reveal";
import Sketch from "@/components/shared/Sketch";
import { ThreadLines, useThread } from "@/components/shared/Thread";
import { dashed, loopArrow, turn } from "@/components/shared/doodles";
import { LabelInput } from "@/components/ui/label-input";
import { personal } from "@/lib/data";
import { dropLine, type Pt2 } from "@/lib/hand";
import { fadeUp, gsap, motionEnabled, useGsap } from "@/lib/motion";

type Status = "idle" | "sending" | "sent" | "error";
type Field = "name" | "email" | "message";

/* The server's own test for an address — see app/api/contact. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* A paper plane off the send button: a trail of dashes from under it,
   throwing one loop on the way, and the plane at the end of it, nose along
   the way it is going. */
const PLANE: Pt2[][] = (() => {
    const [trail] = loopArrow([0, 0], [168, 52]);
    const dashes = dashed(trail, 9, 7);

    const end = trail[trail.length - 1];
    const before = trail[trail.length - 4];
    const deg = (Math.atan2(end[1] - before[1], end[0] - before[0]) * 180) / Math.PI;
    const plane = (pts: Pt2[]) => pts.map(([x, y]) => turn([end[0] + 6 + x, end[1] + y], end, deg));
    return [
        ...dashes,
        // its outline — wing tip, nose, tail, fold — and the fold to the nose
        plane([[0, -22], [60, 0], [60, 0], [10, 18], [10, 18], [16, 2], [16, 2], [0, -22]]),
        plane([[16, 2], [60, 0]]),
    ];
})();

/* What each field says, in its own label, when a send finds it wanting. */
function problems(form: Record<Field, string>): Record<Field, string> {
    return {
        name: form.name.trim() ? "" : "Your name is still empty",
        email: !form.email.trim()
            ? "Your email is still empty"
            : EMAIL.test(form.email.trim())
              ? ""
              : "That email doesn't look right",
        message: form.message.trim() ? "" : "Your message is still empty",
    };
}

/**
 * The close and the form in one place, since there is only one page and no
 * reason to ask twice.
 *
 * Everything here is choreographed across the section's arrival — the mark
 * first, then the statement, then the form — so nothing resolves before
 * there is anything to see it resolve against. The line saying where a
 * message goes waits for the statement's last word, so the column reads in
 * from the top down.
 *
 * A send with a field left empty, or an address that will not do, does not
 * go: each such field says what it is missing in its own label — see
 * `problems` — and the first of them takes the focus.
 *
 * Two columns from `lg`: what to say on the left — the heading, the standing
 * offer, and where the message lands — and the form to say it in on the
 * right. Below `lg` they stack, the statement centred over the form.
 *
 * The form fades in as one block rather than field by field: "Send another"
 * swaps the form out for a confirmation and back, and a per-field reveal would
 * leave the second set of fields sitting at the pre-animation opacity nothing
 * had tweened.
 */
export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<Status>("idle");
    /* whether a send has been tried, and so whether fields say what they lack */
    const [checked, setChecked] = useState(false);
    const wrong = checked ? problems(form) : null;
    const where = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);


    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        gsap.fromTo(
            q(".js-mark"),
            { scale: 1.35, opacity: 0, letterSpacing: "0.9em" },
            {
                scale: 1,
                opacity: 1,
                letterSpacing: "0.3em",
                duration: 0.9,
                ease: "power4.out",
                scrollTrigger: { trigger: el, start: "top 60%" },
            }
        );

        fadeUp(q(".js-soft"), { trigger: el, start: "top 40%", stagger: 0.12 });
    });

    // The thread's last stretch: in from the top edge in the middle, where
    // it left the video section, and down to just short of the content.
    const thread = useThread(scope, (box, at) => {
        if (!content.current) return [];
        const mid = box.width / 2;
        return [dropLine(mid, -2, mid + 4, at(content.current).top - 24, 0.04)];
    });

    const set = (key: keyof typeof form) => (value: string) =>
        setForm((current) => ({ ...current, [key]: value }));

    // Where it goes, in the way the words above it came: rising out of a
    // blur, once they have all landed.
    const showWhere = () => {
        const el = where.current;
        if (!el || !motionEnabled()) return;
        gsap.fromTo(
            el,
            { opacity: 0, y: 12, filter: "blur(6px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.72, ease: "power3.out" }
        );
    };

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const found = problems(form);
        const first = (Object.keys(found) as Field[]).find((key) => found[key]);
        if (first) {
            setChecked(true);
            setStatus("idle");
            (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
            return;
        }

        setStatus("sending");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Request failed");
            setForm({ name: "", email: "", message: "" });
            setChecked(false);
            setStatus("sent");
        } catch {
            setStatus("error");
        }
    };

    return (
        <section
            id="contact"
            ref={scope}
            // A screen of its own, the columns centred in it like every
            // section above. A jump here does not land on the section's top
            // edge either way: the content nominates itself with `data-land`
            // below, so the arrival is centred on the thing a reader came here
            // to use.
            className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-paper py-20 md:py-28"
        >
            {/* What a jump to this section is actually aimed at — see
                `landingFor` in lib/sections.ts. */}
            <div
                ref={content}
                data-land
                className="shell mx-auto grid w-full max-w-shell gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-12"
            >
                {/* Left — what to say, and where it goes. Seven columns,
                    because the title is set at the same size as every other
                    section's and "Tell me what you" needs the room to stay on
                    one line. */}
                <div className="text-center lg:col-span-7 lg:text-left">
                    <span className="js-mark inline-block font-mono text-label uppercase tracking-[0.3em] text-ink-3 lg:origin-left">
                        Contact
                    </span>

                    <h2 className="mt-8 font-display text-d4 font-bold tracking-[-0.035em] text-ink md:mt-12">
                        <RevealText text="Tell me what you" />
                        <RevealText text="have in mind." delay={0.18} className="text-ink-3" />
                    </h2>

                    <p className="mx-auto mt-6 max-w-measure text-copy text-ink-2 md:mt-8 lg:mx-0">
                        <RevealText
                            text="Have a website, a web app, or an idea that needs building? Tell me what it is, who it is for, roughly when you need it, and how much your budget is. Or just say hello. Every message lands straight in my inbox."
                            delay={0.3}
                            stagger={0.012}
                            distance={12}
                            onDone={showWhere}
                        />
                    </p>

                    <div
                        ref={where}
                        data-anim="fade"
                        className="mt-6 flex flex-col items-center gap-4 md:mt-8 lg:items-start"
                    >
                        {/* Where it lands. One line, and the address is still
                            a link for anyone who would rather write it
                            themselves. */}
                        <p className="font-mono text-meta text-ink-3">
                            Sends straight to{" "}
                            <a
                                href={`mailto:${personal.email}`}
                                // `break-words`: the address is a single
                                // unbroken token and this line is narrow on a
                                // phone.
                                className="link-rule tap break-words text-ink-2"
                            >
                                {personal.email}
                            </a>
                        </p>
                    </div>
                </div>

                {/* Right — the form. Stacked under the statement below `lg`,
                    and kept to a readable width there. */}
                <div
                    data-anim="fade"
                    className="js-soft relative mx-auto w-full max-w-2xl lg:col-span-5 lg:col-start-8 lg:max-w-none"
                >
                    {status === "sent" ? (
                        <div className="confirm-rise" role="status">
                            <span className="confirm-stamp inline-block">
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 40 40"
                                    className="h-11 w-11 text-ink"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.25"
                                >
                                    <circle cx="20" cy="20" r="19" />
                                    <path
                                        d="M12.5 20.5l5 5L28 14"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                            <h3 className="mt-8 font-display text-d2 font-semibold text-ink">
                                Message sent.
                            </h3>
                            <p className="mt-5 max-w-measure text-body text-ink-2">
                                It landed in my inbox.
                            </p>
                            <button
                                type="button"
                                onClick={() => setStatus("idle")}
                                className="link-rule tap mt-8 font-mono text-label uppercase text-ink"
                            >
                                Send another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submit} noValidate className="grid gap-4 md:gap-5">
                            <LabelInput
                                label="Your name"
                                name="name"
                                value={form.name}
                                onChange={set("name")}
                                autoComplete="name"
                                required
                                error={wrong?.name}
                            />
                            <LabelInput
                                label="Email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                autoComplete="email"
                                required
                                error={wrong?.email}
                            />
                            <LabelInput
                                label="What would you like to say?"
                                name="message"
                                multiline
                                height={152}
                                value={form.message}
                                onChange={set("message")}
                                required
                                error={wrong?.message}
                            />

                            <div className="relative mt-2 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                                <button
                                    type="submit"
                                    disabled={status === "sending"}
                                    className="group inline-flex min-h-11 items-center gap-3 rounded border border-ink bg-ink px-8 py-4 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink disabled:opacity-50"
                                >
                                    {status === "sending" ? "Sending" : "Send message"}
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                                        →
                                    </span>
                                </button>

                                {/* Only a send that went out and failed — what
                                    a field lacks, the field says itself. */}
                                <p aria-live="polite" className="font-mono text-meta text-ink-3">
                                    {status === "error" && "It didn't send. Try again, or email me directly."}
                                </p>

                                {/* Off it goes: the plane, out into the room
                                    under the form — the section's doodles are
                                    kept to its lower half. */}
                                <Sketch
                                    lines={PLANE}
                                    weight={1.6}
                                    duration={2.2}
                                    wander={0.3}
                                    className="pointer-events-none absolute left-1/2 top-full mt-2 w-28 md:mt-4 md:w-44 lg:left-28 lg:w-56"
                                />
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <ThreadLines thread={thread} />
        </section>
    );
}
