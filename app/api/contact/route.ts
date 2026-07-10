import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "All fields are required." },
                { status: 400 }
            );
        }

        await resend.emails.send({
            from: "Portfolio Contact <onboarding@resend.dev>",
            to: "garcia.kean32@gmail.com",
            subject: `message from ${name}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #09090B;">Message sent from your Porfolio</h2>
          <hr style="border: 1px solid #E4E4E7;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #F4F4F5; padding: 16px; border-radius: 8px;">${message}</p>
          <hr style="border: 1px solid #E4E4E7;" />
          <p style="color: #6B7280; font-size: 12px;">Sent from your portfolio contact form</p>
        </div>
      `,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to send message." },
            { status: 500 }
        );
    }
}