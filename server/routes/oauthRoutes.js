const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

const ensureGoogleOAuthConfigured = (req, res, next) => {
    if (
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.SERVER_URL
    ) {
        next();
        return;
    }

    res.status(503).json({ message: "Google OAuth is not configured" });
};

router.get(
    "/google",
    ensureGoogleOAuthConfigured,
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

router.get(
    "/google/callback",
    ensureGoogleOAuthConfigured,

    passport.authenticate("google", {
        failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?oauth=failed`,
        session: true
    }),

    (req, res) => {

        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        res.redirect(`${clientUrl}/oauth-success?token=${token}`);
    }
);

router.get("/logout", (req, res, next) => {

    req.logout(function(err) {

        if (err) {
            return next(err);
        }

        req.session.destroy(() => {

            res.clearCookie("connect.sid");

            res.send("Logout Successful");
        });
    });
});

module.exports = router;
