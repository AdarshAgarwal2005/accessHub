const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
    },

    profileImage: {
        type: String,
        default: ""
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Membership"
    },

    membershipStatus: {
    type: String,
    enum: ["active", "expired", "none"],
    default: "none"
    },

    membershipExpiry: {
    type: Date,
    default: null
},

    location: {

        address: {
            type: String,
            default: ""
        },

        city: {
            type: String,
            default: ""
        },

        state: {
            type: String,
            default: ""
        },

        country: {
            type: String,
            default: ""
        },

        pincode: {
            type: String,
            default: ""
        },

        coordinates: {

            latitude: {
                type: Number
            },

            longitude: {
                type: Number
            }
        }
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verificationToken: {
        type: String
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);