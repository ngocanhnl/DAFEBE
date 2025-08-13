const md5 = require("md5");
const User = require("../../models/user.model");
const path = require("path");

function buildAvatarUrl(req, avatar) {
    if (!avatar) return null;
    const base = `${req.protocol}://${req.get("host")}`;
    return `${base}/uploads/${avatar}`;
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email và mật khẩu là bắt buộc" });
        }

        const user = await User.findOne({ email, deleted: false });
        if (!user) {
            return res.status(401).json({ success: false, message: "Sai thông tin đăng nhập" });
        }

        // Accept either plain stored or md5 stored for flexibility
        const isMatch = user.password === password || user.password === md5(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Sai thông tin đăng nhập" });
        }

        return res.json({ success: true, token: user.tokenUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Login error", error: error.message });
    }
};

module.exports.me = async (req, res) => {
    try {
        const user = req.userClient;
        const email = user.email || "";
        const username = email.split("@")[0] || email;
        return res.json({
            success: true,
            data: {
                id: user._id,
                fullName: user.fullName || "",
                email,
                phone: user.phone || "",
                username,
                avatarUrl: buildAvatarUrl(req, user.avatar),
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get profile", error: error.message });
    }
};

module.exports.updateMe = async (req, res) => {
    try {
        const user = req.userClient;

        const up = {};
        if (req.body.fullName !== undefined) up.fullName = req.body.fullName;
        if (req.body.phone !== undefined) up.phone = req.body.phone;
        if (req.body.email !== undefined) up.email = req.body.email;
        if (req.file) {
            up.avatar = path.basename(req.file.filename);
        }

        await User.updateOne({ _id: user._id }, { $set: up });
        const refreshed = await User.findById(user._id);
        return res.status(201).json({
            success: true,
            data: {
                id: refreshed._id,
                fullName: refreshed.fullName || "",
                email: refreshed.email || "",
                phone: refreshed.phone || "",
                username: (refreshed.email || "").split("@")[0],
                avatarUrl: buildAvatarUrl(req, refreshed.avatar),
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
    }
};


