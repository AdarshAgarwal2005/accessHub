const express = require("express");

const router = express.Router();

const protect = require("../middlewares/authMiddleware");

const upload = require("../middlewares/uploadMiddleware");

const {
    updateProfile
} = require("../controllers/userController");

const {
    downloadProfilePDF
} = require("../controllers/pdfController");

router.get("/profile", protect, (req, res) => {

    res.json({
        message: "Protected Route",
        user: req.user
    });
});

router.put(
    "/profile",
    protect,
    upload.single("profileImage"),
    updateProfile
);

router.get(
    "/profile/pdf",
    protect,
    downloadProfilePDF
);

module.exports = router;
