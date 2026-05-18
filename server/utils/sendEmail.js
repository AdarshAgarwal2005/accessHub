const nodemailer = require("nodemailer");

const EMAIL_TIMEOUT_MS = 15000;

const sendEmail = async (email, subject, text, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email service is not configured");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
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
        to: email,
        subject,
        text,
        html: html || text
    });
};

module.exports = sendEmail;
