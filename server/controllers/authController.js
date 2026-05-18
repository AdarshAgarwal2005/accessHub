const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const sendError = (res, status, message) => res.status(status).json({ message });
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const verificationEmail = (link) => ({
    text: `Verify your AccessHub account: ${link}`,
    html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2>Verify your AccessHub account</h2>
            <p>Click the button below to finish creating your account.</p>
            <p>
                <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">
                    Verify email
                </a>
            </p>
            <p>If the button does not work, open this link:</p>
            <p><a href="${link}">${link}</a></p>
        </div>
    `
});

const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    membershipStatus: user.membershipStatus,
    membershipExpiry: user.membershipExpiry,
    profileImage: user.profileImage,
    location: user.location
});

const signup = async (req, res) => {
    try {
        const { name, password } = req.body;
        const email = req.body.email?.trim().toLowerCase();
        if (!name || !email || !password) {
            return sendError(res, 400, "All fields are required");
        }

        const userExists = await User.findOne({ email });
        if (userExists?.isVerified) return sendError(res, 400, "User already exists");

        const verificationToken = crypto.randomBytes(32).toString("hex");

        if (userExists) {
            userExists.name = name;
            userExists.password = await bcrypt.hash(password, 10);
            userExists.verificationToken = verificationToken;
            await userExists.save();
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name,
                email,
                password: hashedPassword,
                verificationToken
            });
        }

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const verificationLink = `${clientUrl}/verify-email/${verificationToken}`;
        const emailBody = verificationEmail(verificationLink);
        await sendEmail(
            email,
            "Verify Your Email",
            emailBody.text,
            emailBody.html
        );

        res.status(201).json({ message: "Verification email sent" });
    }
    catch (error) {
        console.error("Signup error:", error.message);
        sendError(res, 500, "Signup failed. Please try again later.");
    }
};

const resendVerification = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        if (!email) return sendError(res, 400, "Email is required");

        const user = await User.findOne({ email });
        if (!user || user.isVerified) {
            return res.status(200).json({
                message: "If this email needs verification, a new link has been sent"
            });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.verificationToken = verificationToken;
        await user.save();

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const verificationLink = `${clientUrl}/verify-email/${verificationToken}`;
        const emailBody = verificationEmail(verificationLink);
        await sendEmail(
            email,
            "Verify Your Email",
            emailBody.text,
            emailBody.html
        );

        res.status(200).json({ message: "Verification email sent" });
    }
    catch (error) {
        console.error("Verification email error:", error.message);
        sendError(res, 500, "Could not send verification email. Please try again later.");
    }
};

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return sendError(res, 400, "Email and password are required");
        }

        const user = await User.findOne({ email });
        if (!user) return sendError(res, 400, "User not found");
        if (!user.isVerified) return sendError(res, 400, "Please verify your email first");

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) return sendError(res, 400, "Invalid credentials");

        res.status(200).json({
            user: publicUser(user),
            token: makeToken(user._id)
        });
    }
    catch (error) {
        sendError(res, 500, error.message);
    }
};

const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user) return sendError(res, 400, "This verification link is expired or already used");

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    }
    catch (error) {
        sendError(res, 500, error.message);
    }
};

const getMe = (req, res) => {
    res.status(200).json({ user: req.user });
};

module.exports = {
    signup,
    signin,
    resendVerification,
    verifyEmail,
    getMe
};
