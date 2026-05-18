const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const sendError = (res, status, message) => res.status(status).json({ message });
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

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
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return sendError(res, 400, "All fields are required");
        }

        const userExists = await User.findOne({ email });
        if (userExists) return sendError(res, 400, "User already exists");

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword,
            verificationToken
        });

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        await sendEmail(
            email,
            "Verify Your Email",
            `Click here to verify your email: ${clientUrl}/verify-email/${verificationToken}`
        );

        res.status(201).json({ message: "Verification email sent" });
    }
    catch (error) {
        sendError(res, 500, error.message);
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
    verifyEmail,
    getMe
};
