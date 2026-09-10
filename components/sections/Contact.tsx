"use client";

import { useState } from "react";
import { MaskLine } from "@/components/motion/Text";
import { personal } from "@/lib/data";
import { fadeUp, gsap, riseMasks, useGsap } from "@/lib/motion";

type Status = "idle" | "sending" | "sent" | "error";

const fields = [
    { name: "name", label: "Your name", type: "text" },
    { name: "email", label: "Email", type: "email" },
] as const;

/**
 * The close and the form in one place, since there is only one page and no
 * reason to ask twice.
 *
 * This is `SlideOver`'s incoming region: it climbs over the light region
 * rather than being uncovered by it, so it travels a viewport at ordinary
 * scroll speed and its own position is an honest reference. Everything here is
 * choreographed across that climb — the margins draw inward on the mark first,
 * then the statement, then the form — so nothing resolves before there is
 * anything to see it resolve against.
 *
 * There is one column, centred. It used to be two — the form on the right and
 * the address, the location and the local time down the left — and the left
 * one was a directory of things this page had already said: the address is in
 * the about section's contact line, and so are the place and the timezone.
 * What it had that the page did not is the standing offer and the fact that
 * the form goes to a real inbox, and both of those are a line rather than a
 * column. So the form is the section, set on the centre line of the page, and
 * those two lines sit above and below it.
 *
 * The form fades in as one block rather than field by field: "Send another"
 * swaps the form out for a confirmation and back, and a per-field reveal would
 * leave the second set of fields sitting at the pre-animation opacity nothing
 * had tweened.
 */
export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<Status>("idle");

    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);

        gsap.fromTo(
            q(".js-converge-l"),
            { xPercent: -60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 80%", end: "top 25%", scrub: 0.7 },
            }
        );
        gsap.fromTo(
            q(".js-converge-r"),
            { xPercent: 60, opacity: 0 },
            {
                xPercent: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 80%", end: "top 25%", scrub: 0.7 },
            }
        );

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

        riseMasks(q(".js-title .js-mask-inner"), { trigger: el, start: "top 55%", stagger: 0.09 });
        fadeUp(q(".js-soft"), { trigger: el, start: "top 40%", stagger: 0.12 });
    });

    const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            setStatus("error");
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
            setStatus("sent");
        } catch {
            setStatus("error");
        }
    };

    return (
        <section
            id="contact"
            ref={scope}
            // The top padding is a pause, and it is measured against the one
            // the about section closes on — the ground under "That is the
            // person. Below is the proof." is 43svh, and this is the same
            // fall of black on the other side of the page. Two dark rooms of
            // the same depth, one on the way out of the work and one on the
            // way in to the close.
            //
            // It is not what a jump to this section lands on any more: the
            // form nominates itself for that with `data-land` below, so the
            // arrival is centred on the thing a reader came here to use and
            // this ground is left to be scrolled through.
            className="relative min-h-[100svh] overflow-hidden bg-gradient-to-b from-paper to-paper-3 pb-24 pt-[43svh] md:pb-32"
        >
            {/* What a jump to this section is actually aimed at. The ground
                above is a pause to scroll through, not a thing to land on —
                see `landingFor` in lib/sections.ts. */}
            <div data-land className="shell mx-auto max-w-shell">
                <div className="flex items-center justify-between gap-6">
                    <span
                        aria-hidden="true"
                        className="js-converge-l h-px flex-1 origin-left bg-rule-strong"
                    />
                    <span className="js-mark shrink-0 font-mono text-label uppercase tracking-[0.3em] text-ink-3">
                        Contact
                    </span>
                    <span
                        aria-hidden="true"
                        className="js-converge-r h-px flex-1 origin-right bg-rule-strong"
                    />
                </div>

                {/* The three margins down this column carry a short-screen step as
                    well as a width one. A centred form is a taller shape than
                    the two columns this replaced, and on a 720-tall laptop that
                    difference is the send button: it is the last thing in the
                    section and the first thing to go under the fold. */}
                <h2 className="js-title mt-10 text-center font-display text-d3 font-bold tracking-[-0.035em] text-ink [@media(max-height:800px)]:!mt-6 md:mt-12">
                    <MaskLine>Have something</MaskLine>
                    <MaskLine className="font-serif font-normal italic text-ink-2">
                        you want built?
                    </MaskLine>
                </h2>

                {/* The standing offer, on the centre line with the heading
                    rather than off in a column of its own. */}
                <div
                    data-anim="fade"
                    className="js-soft mt-6 flex flex-col items-center gap-4 text-center [@media(max-height:800px)]:!mt-4 md:mt-8"
                >
                    <p className="flex items-center gap-3 font-mono text-label uppercase text-ink-3">
                        <span aria-hidden="true" className="h-1.5 w-1.5 bg-ink" />
                        Available for work
                    </p>
                </div>

                {/* The form, on the page's own centre line. `max-w-2xl` is
                    what keeps a centred field from running the full width of
                    the shell, which is a long way to drag an eye back. */}
                <div
                    data-anim="fade"
                    className="js-soft relative mx-auto mt-10 w-full max-w-2xl [@media(max-height:800px)]:!mt-6 md:mt-12"
                >
                    {status === "sent" ? (
                        <div
                            className="confirm-rise border-t border-rule pt-10"
                            role="status"
                        >
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
                                It landed in my inbox. I usually reply within a day or two.
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
                        <form onSubmit={submit} noValidate className="grid gap-6">
                            {fields.map((field) => (
                                <div key={field.name}>
                                    <label
                                        htmlFor={field.name}
                                        className="block font-mono text-label uppercase text-ink-3"
                                    >
                                        {field.label}
                                    </label>
                                    <input
                                        id={field.name}
                                        name={field.name}
                                        type={field.type}
                                        value={form[field.name]}
                                        onChange={update}
                                        autoComplete={field.name === "email" ? "email" : "name"}
                                        required
                                        className="field mt-2.5 text-lead"
                                    />
                                </div>
                            ))}

                            <div>
                                <label
                                    htmlFor="message"
                                    className="block font-mono text-label uppercase text-ink-3"
                                >
                                    What are you trying to build?
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={form.message}
                                    onChange={update}
                                    rows={4}
                                    required
                                    placeholder="What it is, who it is for, and roughly when you need it."
                                    className="field mt-2.5 resize-none text-lead placeholder:text-sm"
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6">
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

                                <p aria-live="polite" className="font-mono text-meta text-ink-3">
                                    {status === "error" &&
                                        "Fill in every field, then try again."}
                                </p>
                            </div>

                            {/* Where it lands. One line, because it is the
                                only thing the address column was really
                                for — and the address is still a link for
                                anyone who would rather write it himself. */}
                            <p className="text-center font-mono text-meta text-ink-3">
                                Sends straight to{" "}
                                <a
                                    href={`mailto:${personal.email}`}
                                    // `break-words`: the address is a
                                    // single unbroken token and this line
                                    // is narrow on a phone.
                                    className="link-rule tap break-words text-ink-2"
                                >
                                    {personal.email}
                                </a>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
