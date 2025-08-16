// app/api/email/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type EmailPayload = {
    to: string[];
    subject: string;
    html?: string;
    text?: string;
};

function isEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
    try {
        // 1) Parse and validate body
        const { to, subject, html, text } = (await req.json()) as EmailPayload;

        if (!Array.isArray(to) || to.length === 0 || !subject?.trim()) {
            return NextResponse.json(
                { error: "Missing recipients or subject" },
                { status: 400 }
            );
        }

        const invalid = to.filter((e) => !isEmail(e));
        if (invalid.length) {
            return NextResponse.json(
                { error: `Invalid recipient(s): ${invalid.join(", ")}` },
                { status: 400 }
            );
        }

        // 2) Read env vars
        const { GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM } = process.env;

        if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !GMAIL_FROM) {
            return NextResponse.json(
                { error: "Missing Gmail environment variables" },
                { status: 500 }
            );
        }

        if (GMAIL_APP_PASSWORD.length !== 16) {
            return NextResponse.json(
                { error: "App password must be 16 characters (no spaces)" },
                { status: 500 }
            );
        }

        // 3) Configure transporter (Gmail → STARTTLS on 587)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
        });


        // 4) Send email
        const info = await transporter.sendMail({
            from: GMAIL_FROM,
            to: to.join(", "),
            subject,
            text: text || undefined,
            html: html || undefined,
        });

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
        console.error("Email error:", err); // full error in terminal
        return NextResponse.json(
            { error: err.message || "Failed to send email" },
            { status: 500 }
        );
    }

}
