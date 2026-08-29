import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Caps, so the endpoint cannot be used to post an essay into an inbox. */
const LIMITS = { name: 120, email: 200, message: 5000 } as const;

/** Anything typed into the form is text, and lands in the email as text. */
const escape = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const field = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const name = field(body.name, LIMITS.name);
        const email = field(body.email, LIMITS.email);
        const message = field(body.message, LIMITS.message);

        // Shape only — an address is proved by replying to it, not by a regex.
        if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "All fields are required." },
                { status: 400 }
            );
        }

        await resend.emails.send({
            from: "Portfolio Contact <onboarding@resend.dev>",
            to: "garcia.kean32@gmail.com",
            // So hitting reply answers the person who wrote in.
            replyTo: email,
            subject: `message from ${name}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #09090B;">Message sent from your Porfolio</h2>
          <hr style="border: 1px solid #E4E4E7;" />
          <p><strong>Name:</strong> ${escape(name)}</p>
          <p><strong>Email:</strong> ${escape(email)}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #F4F4F5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${escape(
              message
          )}</p>
          <hr style="border: 1px solid #E4E4E7;" />
          <p style="color: #6B7280; font-size: 12px;">Sent from your portfolio contact form</p>
        </div>
      `,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Failed to send message." },
            { status: 500 }
        );
    }
}
