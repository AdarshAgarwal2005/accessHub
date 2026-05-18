const express = require("express");

const router = express.Router();

const protect =
    require("../middlewares/authMiddleware");

const {
    signup,
    signin,
    resendVerification,
    verifyEmail,
    getMe
} = require("../controllers/authController");

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/resend-verification", resendVerification);

router.get("/verify/:token", verifyEmail);

router.get(
    "/me",
    protect,
    getMe
);

module.exports = router;
