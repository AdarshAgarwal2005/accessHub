const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    membershipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Membership"
    },

    stripeSessionId: String,

    razorpayOrderId: String,

    razorpayPaymentId: String,

    amount: Number,

    paymentStatus: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    }

},
{
    timestamps: true
});

module.exports =
    mongoose.model("Payment", paymentSchema);
