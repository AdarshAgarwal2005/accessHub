const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

router.get(
    "/google/callback",

    passport.authenticate("google", {
        failureRedirect: "/login",
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
