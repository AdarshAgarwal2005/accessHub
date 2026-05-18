const express = require("express");

const router = express.Router();

const protect =
    require("../middlewares/authMiddleware");

const {
    createCheckoutSession,
    createRazorpayOrder,
    verifyRazorpayPayment,
    verifyPayment
} = require("../controllers/paymentController");

router.post(
    "/create-checkout-session",
    protect,
    createCheckoutSession
);

router.post(
    "/razorpay/create-order",
    protect,
    createRazorpayOrder
);

router.post(
    "/razorpay/verify",
    protect,
    verifyRazorpayPayment
);

router.post(
    "/verify-payment",
    protect,
    verifyPayment
);

module.exports = router;
