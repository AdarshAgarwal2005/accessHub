const crypto = require("crypto");

const Membership = require("../models/Membership");
const Payment = require("../models/Payment");
const User = require("../models/User");

const PLANS = {
    Free: { duration: 0, price: 0 },
    Silver: { duration: 30, price: 499 },
    Gold: { duration: 90, price: 999 }
};

const sendError = (res, status, message) => res.status(status).json({ message });

const planFromRequest = (body) => {
    const name = String(body.planName || "").trim().toLowerCase();
    const byName = Object.keys(PLANS).find((plan) => plan.toLowerCase() === name);
    if (byName) return byName;

    const byId = [
        ["Free", process.env.VITE_FREE_PLAN_ID],
        ["Silver", process.env.VITE_SILVER_PLAN_ID],
        ["Gold", process.env.VITE_GOLD_PLAN_ID]
    ].find(([, id]) => id === body.membershipId)?.[0];
    if (byId) return byId;

    return Object.keys(PLANS).find((plan) => {
        return PLANS[plan].price === Number(body.price) &&
            PLANS[plan].duration === Number(body.duration);
    });
};

const getMembership = async (body) => {
    const planName = planFromRequest(body);
    if (!planName) return null;

    const plan = PLANS[planName];
    let membership = null;

    if (/^[0-9a-fA-F]{24}$/.test(body.membershipId || "")) {
        membership = await Membership.findById(body.membershipId);
    }

    membership = membership || await Membership.findOne({ planName });
    membership = membership || new Membership({ planName });

    membership.planName = planName;
    membership.duration = plan.duration;
    membership.price = plan.price;
    await membership.save();

    return membership;
};

const getExpiryDate = (days) => {
    if (!days) return null;

    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

const activateMembership = async (userId, membership) => {
    await User.findByIdAndUpdate(userId, {
        membership: membership._id,
        membershipStatus: "active",
        membershipExpiry: getExpiryDate(membership.duration)
    });
};

const createCheckoutSession = async (req, res) => {
    try {
        const stripe = require("../config/stripe");
        const membership = await getMembership(req.body);

        if (!membership) return sendError(res, 404, "Plan not found");

        if (membership.price <= 0) {
            await activateMembership(req.user._id, membership);
            return res.status(200).json({
                message: "Free membership activated",
                url: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard`
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [{
                price_data: {
                    currency: "inr",
                    product_data: { name: membership.planName },
                    unit_amount: membership.price * 100
                },
                quantity: 1
            }],
            success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment-cancel`
        });

        await Payment.create({
            userId: req.user._id,
            membershipId: membership._id,
            stripeSessionId: session.id,
            amount: membership.price
        });

        res.status(200).json({ url: session.url });
    }
    catch (error) {
        sendError(res, 500, error.message);
    }
};

const createRazorpayOrder = async (req, res) => {
    try {
        const membership = await getMembership(req.body);
        if (!membership) return sendError(res, 404, "Plan not found");

        if (membership.price <= 0) {
            await activateMembership(req.user._id, membership);
            return res.status(200).json({
                message: "Free membership activated",
                free: true
            });
        }

        const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            return sendError(res, 500, "Razorpay test keys are not configured");
        }

        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
        const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: membership.price * 100,
                currency: "INR",
                receipt: `membership_${Date.now()}`
            })
        });

        const order = await orderResponse.json();
        if (!orderResponse.ok) {
            return sendError(
                res,
                orderResponse.status,
                order.error?.description || "Could not create Razorpay order"
            );
        }

        await Payment.create({
            userId: req.user._id,
            membershipId: membership._id,
            razorpayOrderId: order.id,
            amount: membership.price
        });

        res.status(200).json({
            keyId: RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            planName: membership.planName,
            user: {
                name: req.user.name,
                email: req.user.email
            }
        });
    }
    catch (error) {
        sendError(res, 500, error.message);
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const { RAZORPAY_KEY_SECRET } = process.env;

        if (!RAZORPAY_KEY_SECRET) {
            return sendError(res, 500, "Razorpay secret is not configured");
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return sendError(res, 400, "Missing Razorpay payment details");
        }

        const expectedSignature = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return sendError(res, 400, "Payment signature verification failed");
        }

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) return sendError(res, 404, "Payment record not found");

        const membership = await Membership.findById(payment.membershipId);
        if (!membership) return sendError(res, 404, "Plan not found");

        payment.razorpayPaymentId = razorpay_payment_id;
        payment.paymentStatus = "success";
        await payment.save();
        await activateMembership(payment.userId, membership);

        res.status(200).json({ message: "Payment successful" });
    }
    catch (error) {
        sendError(res, 500, error.message);
    }
};

const verifyPayment = async (req, res) => {
    try {
        const stripe = require("../config/stripe");
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return sendError(res, 400, "Payment not completed");
        }

        const payment = await Payment.findOne({ stripeSessionId: sessionId });
        if (!payment) return sendError(res, 404, "Payment record not found");

        const membership = await Membership.findById(payment.membershipId);
        if (!membership) return sendError(res, 404, "Plan not found");

        payment.paymentStatus = "success";
        await payment.save();
        await activateMembership(payment.userId, membership);

        res.status(200).json({ message: "Payment successful" });
    }
    catch (error) {
        sendError(res, 500, error.message);
    }
};

module.exports = {
    createCheckoutSession,
    createRazorpayOrder,
    verifyRazorpayPayment,
    verifyPayment
};
