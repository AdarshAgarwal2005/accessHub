const nodemailer = require("nodemailer");

const EMAIL_TIMEOUT_MS = 15000;

const sendWithResend = async ({ to, subject, text, html }) => {
    const from = process.env.EMAIL_FROM || "AccessHub <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            text,
            html: html || text
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Resend email request failed");
    }
};

const sendWithGmail = async ({ to, subject, text, html }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email service is not configured");
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        family: 4,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: EMAIL_TIMEOUT_MS,
        greetingTimeout: EMAIL_TIMEOUT_MS,
        socketTimeout: EMAIL_TIMEOUT_MS
    });

    await transporter.sendMail({
        from: `"AccessHub" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html || text
    });
};

const sendEmail = async (email, subject, text, html) => {
    const provider = (process.env.EMAIL_PROVIDER || "auto").toLowerCase();

    if (provider === "gmail") {
        try {
            await sendWithGmail({ to: email, subject, text, html });
        }
        catch (error) {
            console.error("Gmail email failed:", {
                code: error.code,
                command: error.command,
                responseCode: error.responseCode,
                response: error.response,
                message: error.message
            });
            throw error;
        }
        return;
    }

    if (process.env.RESEND_API_KEY) {
        try {
            await sendWithResend({ to: email, subject, text, html });
            return;
        }
        catch (error) {
            if (provider === "resend") throw error;
            console.warn("Resend email failed, falling back to Gmail:", error.message);
        }
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email service is not configured");
    }

    await sendWithGmail({ to: email, subject, text, html });
};

module.exports = sendEmail;
