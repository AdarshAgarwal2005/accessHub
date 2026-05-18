const checkMembership = (req, res, next) => {
    const isActive = req.user.membershipStatus === "active";
    const isExpired = req.user.membershipExpiry &&
        new Date(req.user.membershipExpiry) < new Date();

    if (!isActive || isExpired) {
        return res.status(403).json({ message: "Membership expired" });
    }

    next();
};

module.exports = checkMembership;
