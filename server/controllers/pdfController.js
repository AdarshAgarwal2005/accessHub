const PDFDocument = require("pdfkit");

const User = require("../models/User");

const safeFileName = (name) => name.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();

const downloadProfilePDF = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const doc = new PDFDocument();
        const location = user.location || {};
        const coordinates = location.coordinates || {};

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFileName(user.name)}-profile.pdf"`
        );

        doc.pipe(res);
        doc.fontSize(22).text("User Profile", { align: "center" });
        doc.moveDown();

        [
            ["Name", user.name],
            ["Email", user.email],
            ["Role", user.role],
            ["Verified", user.isVerified],
            ["Membership", user.membership || "N/A"]
        ].forEach(([label, value]) => doc.fontSize(14).text(`${label}: ${value}`));

        doc.moveDown();
        doc.fontSize(18).text("Location");
        doc.moveDown(0.5);

        [
            ["Address", location.address || ""],
            ["City", location.city || ""],
            ["State", location.state || ""],
            ["Country", location.country || ""],
            ["Pincode", location.pincode || ""],
            ["Latitude", coordinates.latitude || 0],
            ["Longitude", coordinates.longitude || 0]
        ].forEach(([label, value]) => doc.fontSize(14).text(`${label}: ${value}`));

        doc.moveDown();
        doc.text(`Created At: ${user.createdAt}`);
        doc.end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    downloadProfilePDF
};
