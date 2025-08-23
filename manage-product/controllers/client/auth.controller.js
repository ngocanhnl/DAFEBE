const md5 = require("md5");
const User = require("../../models/user.model");
const path = require("path");
const { sendMail } = require("../../helper/sendmail");
const generate = require("../../helper/generate");

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

        if (!user.email_verified && !user.phone_verified) {
            return res.status(403).json({ success: false, message: "Tài khoản chưa xác thực. Vui lòng xác thực email hoặc số điện thoại." });
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


// [POST] /register
module.exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body || {};
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        const existed = await User.findOne({ email, deleted: false });
        if (existed) {
            return res.status(409).json({ success: false, message: "Email đã tồn tại" });
        }

        const emailToken = generate.generateRandomString(40);
        const user = await User.create({
            fullName,
            email,
            password: md5(password),
            phone,
            email_verification_token: emailToken,
            email_verified: false
        });

        const frontBase = process.env.FRONTEND_BASE_URL || ((req.hostname === 'localhost' || req.hostname === '127.0.0.1') ? 'http://localhost:3000' : `${req.protocol}://${req.get("host")}`);
        const verifyUrl = `${frontBase.replace(/\/$/, "")}/verify-email?token=${emailToken}`;
        sendMail(email, "Xác thực email", `<p>Chào ${fullName},</p><p>Vui lòng xác nhận email bằng cách bấm vào liên kết sau:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`);

        return res.status(201).json({ success: true, message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Register error", error: error.message });
    }
};

// [GET] /verify-email?token=...
module.exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query || {};
        if (!token) return res.status(400).json({ success: false, message: "Thiếu token" });

        const user = await User.findOne({ email_verification_token: token, deleted: false });
        if (!user) return res.status(400).json({ success: false, message: "Token không hợp lệ" });

        await User.updateOne({ _id: user._id }, { $set: { email_verified: true }, $unset: { email_verification_token: 1 } });
        const frontBase = process.env.FRONTEND_BASE_URL || ((req.hostname === 'localhost' || req.hostname === '127.0.0.1') ? 'http://localhost:3000' : `${req.protocol}://${req.get("host")}`);
        const loginUrl = `${frontBase.replace(/\/$/, "")}/login`;
        const accept = req.headers["accept"] || "";
        if (accept.includes("text/html")) {
            return res.send(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="1.5;url=${loginUrl}"><title>Xác thực</title><style>body{font-family:Arial;padding:2rem}</style></head><body><h2>Xác thực email thành công</h2><p>Bạn sẽ được chuyển đến trang đăng nhập...</p><p>Nếu không tự chuyển, <a href="${loginUrl}">bấm vào đây</a>.</p><script>setTimeout(function(){location.href='${loginUrl}'},1500);</script></body></html>`);
        }
        return res.json({ success: true, message: "Xác thực email thành công", redirect: loginUrl });
    } catch (error) {
        const frontBase = process.env.FRONTEND_BASE_URL || ((req.hostname === 'localhost' || req.hostname === '127.0.0.1') ? 'http://localhost:3000' : `${req.protocol}://${req.get("host")}`);
        const loginUrl = `${frontBase.replace(/\/$/, "")}/login`;
        const accept = req.headers["accept"] || "";
        if (accept.includes("text/html")) {
            return res.status(500).send(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="3;url=${loginUrl}"><title>Lỗi xác thực</title><style>body{font-family:Arial;padding:2rem;color:#b00}</style></head><body><h2>Lỗi xác thực</h2><p>${(error && error.message) || "Đã xảy ra lỗi."}</p><p>Sẽ chuyển về trang đăng nhập...</p><p>Nếu không tự chuyển, <a href="${loginUrl}">bấm vào đây</a>.</p><script>setTimeout(function(){location.href='${loginUrl}'},3000);</script></body></html>`);
        }
        return res.status(500).json({ success: false, message: "Verify email error", error: error.message });
    }
};

// [POST] /send-otp
module.exports.sendOtp = async (req, res) => {
    try {
        const { phone, email } = req.body || {};
        if (!phone && !email) return res.status(400).json({ success: false, message: "Thiếu số điện thoại hoặc email" });

        const otp = generate.generateRandomNumber(6);
        const expires = new Date(Date.now() + 5 * 60 * 1000);

        const user = await User.findOne({ $or: [ { phone }, { email } ], deleted: false });
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        await User.updateOne({ _id: user._id }, { $set: { phone_verification_otp: otp, otp_expires_at: expires } });

        if (email) {
            sendMail(email, "Mã OTP xác thực", `<p>Mã OTP của bạn là: <b>${otp}</b>. Hết hạn sau 5 phút.</p>`);
        }
        // Note: For SMS, integrate provider here

        return res.json({ success: true, message: "Đã gửi OTP" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Send OTP error", error: error.message });
    }
};

// [POST] /verify-otp
module.exports.verifyOtp = async (req, res) => {
    try {
        const { phone, email, otp } = req.body || {};
        if (!otp || (!phone && !email)) return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

        const user = await User.findOne({ $or: [ { phone }, { email } ], deleted: false });
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        if (!user.phone_verification_otp || !user.otp_expires_at) {
            return res.status(400).json({ success: false, message: "Chưa yêu cầu OTP" });
        }
        if (new Date(user.otp_expires_at).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP đã hết hạn" });
        }
        if (user.phone_verification_otp !== otp) {
            return res.status(400).json({ success: false, message: "OTP không đúng" });
        }

        await User.updateOne({ _id: user._id }, { $set: { phone_verified: true }, $unset: { phone_verification_otp: 1, otp_expires_at: 1 } });
        return res.json({ success: true, message: "Xác thực OTP thành công" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Verify OTP error", error: error.message });
    }
};

