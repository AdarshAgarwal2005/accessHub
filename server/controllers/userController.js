const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs/promises");
const path = require("path");

const storj = require("../config/storj");
const User = require("../models/User");

const hasStorjConfig = () => (
    process.env.STORJ_ENDPOINT &&
    process.env.STORJ_BUCKET &&
    process.env.STORJ_ACCESS_KEY &&
    process.env.STORJ_SECRET_KEY
);

const safeFileName = (originalName) => {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    return `${Date.now()}-${base}${ext}`;
};

const saveImageLocally = async (req, fileName) => {
    const uploadDir = path.join(__dirname, "..", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), req.file.buffer);
    return `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
};

const uploadImage = async (req) => {
    const fileName = safeFileName(req.file.originalname);

    if (!hasStorjConfig()) return saveImageLocally(req, fileName);

    try {
        await storj.send(new PutObjectCommand({
            Bucket: process.env.STORJ_BUCKET,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        return `${process.env.STORJ_ENDPOINT}/${process.env.STORJ_BUCKET}/${fileName}`;
    }
    catch (error) {
        console.warn(`Storj upload failed, using local upload instead: ${error.message}`);
        return saveImageLocally(req, fileName);
    }
};

const updateProfile = async (req, res) => {
    try {
        const imageUrl = req.file ? await uploadImage(req) : req.body.profileImage;
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                profileImage: imageUrl,
                location: {
                    address: req.body.address,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country,
                    pincode: req.body.pincode,
                    coordinates: {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude
                    }
                }
            },
            { new: true }
        );

        res.status(200).json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    updateProfile
};
