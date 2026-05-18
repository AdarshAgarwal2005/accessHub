const express = require("express");

const router = express.Router();

const protect =
    require("../middlewares/authMiddleware");

const {
    signup,
    signin,
    verifyEmail,
    getMe
} = require("../controllers/authController");

router.post("/signup", signup);

router.post("/signin", signin);

router.get("/verify/:token", verifyEmail);

router.get(
    "/me",
    protect,
    getMe
);

module.exports = router;