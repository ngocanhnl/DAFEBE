const User = require("../../models/user.model");

module.exports.requireUser = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const token = bearerToken || req.headers["x-client-token"] || req.query.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findOne({ tokenUser: token, deleted: false });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        req.userClient = user;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Auth error", error: error.message });
    }
};


