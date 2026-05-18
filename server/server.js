const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

dotenv.config({ path: path.join(__dirname, ".env") });

connectDB();
require("./config/passport");
require("./cron/membershipCron");

const oauthRoutes = require("./routes/oauthRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

const normalizeOrigin = (value) => value?.replace(/\/$/, "");
const clientOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_ORIGINS || "").split(",")
]
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);
const allowedOrigins = new Set(clientOrigins.length ? clientOrigins : ["http://localhost:5173"]);
const allowedOriginSuffixes = clientOrigins
    .filter((origin) => origin.startsWith("https://*."))
    .map((origin) => origin.replace("https://*.", ""));

const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    return allowedOrigins.has(normalizedOrigin) ||
        allowedOriginSuffixes.some((suffix) => normalizedOrigin.endsWith(`.${suffix}`));
};

const corsOptions = {
    origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true
};

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors(corsOptions));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/auth", oauthRoutes);
app.use("/user", userRoutes);
app.use("/payment", paymentRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "not_connected",
        environment: process.env.NODE_ENV || "development",
        clientOrigins: [...allowedOrigins],
        services: {
            email: Boolean(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASS)),
            emailProvider: process.env.RESEND_API_KEY ? "resend" : "gmail",
            googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.SERVER_URL),
            razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            stripe: Boolean(process.env.STRIPE_SECRET_KEY),
            storj: Boolean(process.env.STORJ_ENDPOINT && process.env.STORJ_BUCKET && process.env.STORJ_ACCESS_KEY && process.env.STORJ_SECRET_KEY)
        }
    });
});

app.get("/", (req, res) => {
    res.send("Server Running");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
