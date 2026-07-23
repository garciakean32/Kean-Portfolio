"use client";

import { useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { personal } from "@/lib/data";
import { ArrowRight } from "lucide-react";

const inputStyle = {
    borderColor: "var(--border)",
    color: "var(--fg)",
    background: "var(--surface)",
} as const;

export default function Contact() {
    const ref = useScrollReveal<HTMLElement>();
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.MouseEvent) => {
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

            if (res.ok) {
                setStatus("sent");
                setForm({ name: "", email: "", message: "" });
                setTimeout(() => setStatus("idle"), 4000);
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    return (
        <section
            id="contact"
            ref={ref}
            className="py-24 md:py-28 snap-start flex flex-col justify-center"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-6xl w-full mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16">
                    {/* Left */}
                    <div>
                        <p
                            className="text-sm tracking-widest uppercase font-medium mb-4"
                            style={{ color: "var(--accent)" }}
                        >
                            Get In Touch
                        </p>
                        <h2
                            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-6"
                            style={{ color: "var(--fg)" }}
                        >
                            Let&apos;s build something{" "}
                            <span style={{ color: "var(--accent)" }}>together</span>
                        </h2>
                        <p
                            className="text-base md:text-lg leading-relaxed mb-8"
                            style={{ color: "var(--muted)" }}
                        >
                            Whether you have a project in mind, a question, or just want to
                            say hi — my inbox is always open.
                        </p>
                        <a
                            href={`mailto:${personal.email}`}
                            className="inline-block font-medium text-sm md:text-base underline underline-offset-4 transition-colors duration-200 hover:text-[var(--accent)]"
                            style={{ color: "var(--fg)" }}
                        >
                            {personal.email}
                        </a>
                    </div>

                    {/* Right — Form */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-xs tracking-widest uppercase font-medium"
                                style={{ color: "var(--muted)" }}
                            >
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Your Name"
                                className="w-full px-5 py-3.5 text-sm border rounded-2xl outline-none transition-colors duration-200 focus:border-[var(--accent)]"
                                style={inputStyle}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-xs tracking-widest uppercase font-medium"
                                style={{ color: "var(--muted)" }}
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                className="w-full px-5 py-3.5 text-sm border rounded-2xl outline-none transition-colors duration-200 focus:border-[var(--accent)]"
                                style={inputStyle}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-xs tracking-widest uppercase font-medium"
                                style={{ color: "var(--muted)" }}
                            >
                                Message
                            </label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Tell me about your project..."
                                rows={5}
                                className="w-full px-5 py-3.5 text-sm border rounded-2xl outline-none transition-colors duration-200 focus:border-[var(--accent)] resize-none"
                                style={inputStyle}
                            />
                        </div>

                        {/* Error message */}
                        {status === "error" && (
                            <p className="text-sm" style={{ color: "#EF4444" }}>
                                Please fill in all fields and try again.
                            </p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={status === "sending"}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold transition-colors duration-200 mt-2 hover:opacity-90 disabled:opacity-50"
                            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
                        >
                            {status === "sending" ? (
                                "Sending..."
                            ) : status === "sent" ? (
                                "Message Sent! ✓"
                            ) : (
                                <>
                                    Send Message <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
