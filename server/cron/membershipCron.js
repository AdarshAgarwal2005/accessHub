const cron = require("node-cron");

const User = require("../models/User");

cron.schedule("* * * * *", async () => {

    const now = new Date();

    await User.updateMany(
        {
            membershipExpiry: {
                $lt: now
            },

            membershipStatus: "active"
        },

        {
            membershipStatus: "expired",

            membership: null
        }
    );

    console.log("Membership cron executed");
});