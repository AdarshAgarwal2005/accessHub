const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema({

    planName: {
        type: String,
        enum: ["Free", "Silver", "Gold"],
        required: true
    },

    duration: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    }

});

module.exports =
    mongoose.model("Membership", membershipSchema);