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

const channels = [
    { k: "Email", v: personal.email, href: `mailto:${personal.email}` },
    { k: "GitHub", v: "garciakean32", href: personal.social.github },
    { k: "Instagram", v: "kean.garcia32", href: personal.social.instagram },
    { k: "Facebook", v: "Kean Valgere Garcia", href: personal.social.facebook },
];

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
 * The right-hand column fades in as one block rather than field by field:
 * "Send another" swaps the form out for a confirmation and back, and a
 * per-field reveal would leave the second set of fields sitting at the
 * pre-animation opacity nothing had tweened.
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
            className="relative overflow-hidden bg-gradient-to-b from-paper to-paper-3 pb-24 pt-[14vh] md:pb-32 md:pt-[18vh]"
        >
            <div className="shell mx-auto max-w-shell">
                <div className="flex items-center justify-between gap-6">
                    <span
                        aria-hidden="true"
                        className="js-converge-l h-px flex-1 origin-left bg-rule-strong"
                    />
                    <span className="js-mark shrink-0 font-jp text-sm font-medium tracking-[0.3em] text-ink-3">
                        連絡
                    </span>
                    <span
                        aria-hidden="true"
                        className="js-converge-r h-px flex-1 origin-right bg-rule-strong"
                    />
                </div>

                <h2 className="js-title mt-12 text-center font-display text-d3 font-bold tracking-[-0.035em] text-ink md:mt-16">
                    <MaskLine>Have something</MaskLine>
                    <MaskLine className="font-serif font-normal italic text-ink-2">
                        you want built?
                    </MaskLine>
                </h2>

                <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-x-16">
                    {/* Direct channels */}
                    <div data-anim="fade" className="js-soft lg:col-span-5">
                        <p className="max-w-measure text-lead text-ink-2">
                            A rough idea is enough to start.
                        </p>

                        <dl className="mt-12 border-t border-rule">
                            {channels.map((channel) => (
                                <div
                                    key={channel.k}
                                    className="flex items-baseline justify-between gap-6 border-b border-rule py-5"
                                >
                                    <dt className="font-mono text-label uppercase text-ink-3">
                                        {channel.k}
                                    </dt>
                                    <dd className="min-w-0">
                                        <a
                                            href={channel.href}
                                            target={
                                                channel.href.startsWith("http") ? "_blank" : undefined
                                            }
                                            rel={
                                                channel.href.startsWith("http")
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            className="link-rule tap block truncate text-body text-ink transition-colors hover:text-accent"
                                        >
                                            {channel.v}
                                        </a>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <p className="mt-10 flex items-center gap-3 font-mono text-label uppercase text-ink-3">
                            <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
                            Available for work
                        </p>
                    </div>

                    {/* Form */}
                    <div data-anim="fade" className="js-soft relative lg:col-span-6 lg:col-start-7">
                        {status === "sent" ? (
                            <div
                                className="confirm-rise border-t border-rule pt-10"
                                role="status"
                            >
                                <span className="confirm-stamp inline-block">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 40 40"
                                        className="h-11 w-11 text-accent"
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
                            <form onSubmit={submit} noValidate className="grid gap-7">
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
                                        rows={5}
                                        required
                                        placeholder="What it is, who it is for, and roughly when you need it."
                                        className="field mt-2.5 resize-none text-lead placeholder:text-body"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-6">
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
                                            "Fill in all three fields, then try again."}
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
