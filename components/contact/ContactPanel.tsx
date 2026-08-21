"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MaskLine } from "@/components/motion/Text";
import { personal } from "@/lib/data";
import { DUR, EASE, gsap, MASK_HIDDEN, motionEnabled, pageIntro, useGsap } from "@/lib/motion";

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
 * The contact page. Fields are drawn as real boxes so there is no doubt about
 * where to type, and they rise into place one after another as the page opens.
 */
export default function ContactPanel() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<Status>("idle");
    const reduce = useReducedMotion();

    // The entrance timeline owns the first reveal, but only that one: the
    // fields are hidden by the `data-anim="fade"` gate in globals.css, and
    // "Send another" mounts brand new field nodes that nothing has tweened.
    // This has to hang off the form element itself rather than an effect
    // keyed on `status` — AnimatePresence is in `mode="wait"`, so the form is
    // still unmounted when a status effect would run, and `.js-field` would
    // match nothing. A ref callback fires exactly when the form is attached.
    //
    // Flipped when the entrance actually finishes, not on mount: a ref
    // callback fires again whenever the form node is replaced, which dev's
    // Strict Mode does before the entrance has even started. Gated on mount,
    // that phantom re-attach fired this reveal straight away and the fields
    // arrived a beat ahead of everything above them.
    const enteredRef = useRef(false);

    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const tl = pageIntro({
            onComplete: () => {
                enteredRef.current = true;
            },
        });

        // Document order throughout — eyebrow, title, the column on the left,
        // then the form beside it — so the page opens top to bottom rather
        // than letting the form beat the copy it belongs to.
        tl.fromTo(q(".js-eyebrow .js-mask-inner"), MASK_HIDDEN, { yPercent: 0, duration: 0.8 })
            .fromTo(
                q(".js-title .js-mask-inner"),
                MASK_HIDDEN,
                { yPercent: 0, duration: DUR.long, stagger: 0.1 },
                "-=0.55"
            )
            .fromTo(
                q(".js-soft"),
                { opacity: 0, y: 22 },
                { opacity: 1, y: 0, duration: 0.85 },
                "-=0.95"
            )
            .fromTo(
                q(".js-field"),
                { opacity: 0, y: 26 },
                { opacity: 1, y: 0, duration: 0.9, stagger: 0.09 },
                "-=0.6"
            );
    });

    const revealFields = useCallback((formEl: HTMLFormElement | null) => {
        if (!formEl || !enteredRef.current || !motionEnabled()) return;
        gsap.fromTo(
            formEl.querySelectorAll(".js-field"),
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: EASE.out }
        );
    }, []);

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
            ref={scope}
            className="bg-gradient-to-b from-paper to-paper-3 pb-24 pt-[calc(var(--nav-h)+4rem)] md:pb-32 md:pt-[calc(var(--nav-h)+6rem)]"
        >
            <div className="shell mx-auto max-w-shell">
                <div className="js-eyebrow">
                    <MaskLine className="font-mono text-label uppercase text-ink-3">
                        05 / Contact — {personal.location} · {personal.timezone}
                    </MaskLine>
                </div>

                <h1 className="js-title mt-8 font-display font-extrabold tracking-[-0.04em] text-ink">
                    <MaskLine className="text-d4">Tell me what</MaskLine>
                    <MaskLine className="pl-[10%] font-serif text-d4 font-normal text-ink-2">
                        you need built
                    </MaskLine>
                </h1>

                <div className="mt-16 grid gap-16 md:mt-24 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-24">
                    {/* Direct channels */}
                    <div data-anim="fade" className="js-soft">
                        <p className="max-w-measure text-pretty text-lead text-ink-2">
                            A rough idea is enough to start. Tell me what you are trying to
                            do and I will tell you what it would take.
                        </p>

                        <dl className="mt-12 border-t border-rule">
                            {channels.map((channel) => (
                                <div
                                    key={channel.k}
                                    className="flex items-baseline justify-between gap-6 border-b border-rule py-4"
                                >
                                    <dt className="font-mono text-label uppercase text-ink-3">
                                        {channel.k}
                                    </dt>
                                    <dd className="min-w-0">
                                        <a
                                            href={channel.href}
                                            target={channel.href.startsWith("http") ? "_blank" : undefined}
                                            rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
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
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {status === "sent" ? (
                                <motion.div
                                    key="sent"
                                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: reduce ? 0.15 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="border-t border-rule pt-10"
                                    role="status"
                                >
                                    <motion.span
                                        className="inline-block"
                                        initial={reduce ? false : { scale: 2.2, rotate: -12, opacity: 0 }}
                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                        transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                    >
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
                                    </motion.span>
                                    <h2 className="mt-8 font-display text-d2 font-medium text-ink">
                                        Message sent.
                                    </h2>
                                    <p className="mt-4 max-w-measure text-body text-ink-2">
                                        It landed in my inbox. I read everything and reply from{" "}
                                        {personal.email}, usually within a day or two.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setStatus("idle")}
                                        className="link-rule mt-8 font-mono text-label uppercase text-ink"
                                    >
                                        Send another
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    ref={revealFields}
                                    onSubmit={submit}
                                    noValidate
                                    initial={false}
                                    exit={{ opacity: 0 }}
                                    className="grid gap-7"
                                >
                                    {fields.map((field) => (
                                        <div key={field.name} data-anim="fade" className="js-field">
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

                                    <div data-anim="fade" className="js-field">
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
                                            placeholder="A short description is fine — what it is, who it is for, and roughly when you need it."
                                            className="field mt-2.5 resize-none text-lead"
                                        />
                                    </div>

                                    <div data-anim="fade" className="js-field flex flex-wrap items-center gap-6">
                                        <button
                                            type="submit"
                                            disabled={status === "sending"}
                                            className="group inline-flex items-center gap-3 rounded border border-ink bg-ink px-8 py-4 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-ink disabled:opacity-50"
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
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
