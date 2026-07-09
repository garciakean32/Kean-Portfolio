"use client";

import { useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { personal } from "@/lib/data";
import { Send } from "lucide-react";

export default function Contact() {
    const ref = useScrollReveal<HTMLElement>();
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sent, setSent] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.MouseEvent) => {
        e.preventDefault();
        // TODO: wire up to your email service (Resend, EmailJS, etc.)
        setSent(true);
        setForm({ name: "", email: "", message: "" });
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <section
            id="contact"
            ref={ref}
            className="py-32"
            style={{ background: "var(--surface)" }}
        >
            <div className="max-w-6xl mx-auto px-6">
                {/* Section label */}
                <p
                    className="font-mono text-sm tracking-widest uppercase mb-16"
                    style={{ color: "var(--accent)" }}
                >
                    Get In Touch
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Left */}
                    <div>
                        <h2
                            className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6"
                            style={{ color: "var(--fg)" }}
                        >
                            Let's build something
                            <span style={{ fontStyle: "italic", fontWeight: 400 }}>
                                {" "}together.
                            </span>
                        </h2>
                        <p
                            className="text-lg leading-relaxed mb-8"
                            style={{ color: "var(--muted)" }}
                        >
                            Whether you have a project in mind, a question, or just want to
                            say hi — my inbox is always open.
                        </p>
                        <a
                            href={`mailto:${personal.email}`}
                            className="font-mono text-sm underline underline-offset-4 transition-colors duration-200"
                            style={{ color: "var(--fg)" }}
                        >
                            {personal.email}
                        </a>
                    </div>

                    {/* Right — Form */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label
                                className="font-mono text-xs tracking-widest uppercase"
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
                                className="w-full px-4 py-3 text-sm border rounded-lg bg-transparent outline-none transition-colors duration-200 focus:border-[var(--fg)]"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--fg)",
                                    background: "var(--bg)",
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label
                                className="font-mono text-xs tracking-widest uppercase"
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
                                className="w-full px-4 py-3 text-sm border rounded-lg bg-transparent outline-none transition-colors duration-200 focus:border-[var(--fg)]"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--fg)",
                                    background: "var(--bg)",
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label
                                className="font-mono text-xs tracking-widest uppercase"
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
                                className="w-full px-4 py-3 font-mono text-sm border bg-transparent outline-none transition-colors duration-200 focus:border-[var(--fg)] resize-none"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--fg)",
                                    background: "var(--bg)",
                                }}
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 font-mono text-sm font-medium transition-all duration-300 mt-2"
                            style={{ background: "var(--fg)", color: "var(--bg)" }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = "0.85";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = "1";
                            }}
                        >
                            {sent ? "Message Sent!" : (
                                <>
                                    Send Message <Send size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section >
    );
}