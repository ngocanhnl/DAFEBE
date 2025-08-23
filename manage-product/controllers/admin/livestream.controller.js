const Class = require("../../models/class.model");
const Course = require("../../models/course.model");
const Account = require("../../models/account.model");
const youtubeService = require("../../helper/youtubeService");
const systemConfig = require("../../config/system");

// [GET] /admin/livestream/auth/connect
module.exports.connectYouTube = async (req, res) => {
    try {
        const authUrl = youtubeService.generateAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error("Error generating auth URL:", error);
        req.flash("error", "Không thể tạo URL xác thực YouTube");
        res.redirect("back");
    }
};

// [GET] /oauth2callback
module.exports.oauthCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            req.flash("error", "Không nhận được mã xác thực từ YouTube");
            return res.redirect("/admin/livestream/manage");
        }

        await youtubeService.handleAuthCallback(code);
        req.flash("success", "Kết nối YouTube thành công!");
        res.redirect("/admin/livestream/manage");
    } catch (error) {
        console.error("Error handling OAuth callback:", error);
        req.flash("error", "Có lỗi xảy ra khi xác thực với YouTube");
        res.redirect("/admin/livestream/manage");
    }
};

// [GET] /admin/livestream/:classId
module.exports.viewLivestream = async (req, res) => {
    try {
        const classId = req.params.classId;
        const classData = await Class.findById(classId)
            .populate('course_id')
            .populate('instructor_id');

        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học");
            return res.redirect("/admin/classes");
        }

        res.render("admin/pages/livestream/view", {
            pageTitle: `Livestream - ${classData.class_name}`,
            classData: classData,
            youtubeConnected: youtubeService.isAuthenticated ? youtubeService.isAuthenticated() : false
        });
    } catch (error) {
        console.error("Error loading livestream view:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang livestream");
        res.redirect("back");
    }
};

// [POST] /admin/livestream/:classId/create
module.exports.createLivestream = async (req, res) => {
    console.log("createLivestream");
    try {
        const classId = req.params.classId;
        const { title, description, privacy } = req.body;

        const classData = await Class.findById(classId)
            .populate('course_id')
            .populate('instructor_id');

        if (!classData) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy lớp học" 
            });
        }

        // Cập nhật thông tin livestream
        classData.livestream.title = title || `${classData.class_name} - ${classData.course_id.title}`;
        classData.livestream.description = description || `Livestream cho lớp ${classData.class_name}`;
        classData.livestream.privacy = privacy || 'unlisted';

        // Tạo YouTube livestream
        const youtubeData = await youtubeService.createLiveStream(classData);

        // Cập nhật database
        classData.livestream.youtubeVideoId = youtubeData.broadcastId;
        classData.livestream.youtubeUrl = youtubeData.youtubeUrl;
        classData.livestream.streamKey = youtubeData.streamKey;
        classData.livestream.liveStartTime = new Date();

        await classData.save();

        res.json({
            success: true,
            message: "Tạo livestream thành công",
            data: {
                youtubeUrl: youtubeData.youtubeUrl,
                streamKey: youtubeData.streamKey,
                embedUrl: youtubeData.embedUrl
            }
        });
        console.log(youtubeData);
    } catch (error) {
        console.error("Error creating livestream:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi tạo livestream"
        });
    }
};

// [POST] /admin/livestream/:classId/start
module.exports.startLivestream = async (req, res) => {
    try {
        const classId = req.params.classId;
        const classData = await Class.findById(classId);

        if (!classData || !classData.livestream.youtubeVideoId) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy livestream"
            });
        }

        // Bắt đầu livestream trên YouTube
        await youtubeService.startLiveStream(classData.livestream.youtubeVideoId);

        // Cập nhật trạng thái
        classData.livestream.isLive = true;
        classData.livestream.liveStartTime = new Date();
        await classData.save();

        res.json({
            success: true,
            message: "Bắt đầu livestream thành công"
        });
    } catch (error) {
        console.error("Error starting livestream:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi bắt đầu livestream"
        });
    }
};

// [POST] /admin/livestream/:classId/stop
module.exports.stopLivestream = async (req, res) => {
    try {
        const classId = req.params.classId;
        const classData = await Class.findById(classId);

        if (!classData || !classData.livestream.youtubeVideoId) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy livestream"
            });
        }

        // Dừng livestream trên YouTube
        await youtubeService.stopLiveStream(classData.livestream.youtubeVideoId);

        // Cập nhật trạng thái
        classData.livestream.isLive = false;
        classData.livestream.liveEndTime = new Date();
        await classData.save();

        res.json({
            success: true,
            message: "Dừng livestream thành công"
        });
    } catch (error) {
        console.error("Error stopping livestream:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi dừng livestream"
        });
    }
};

// [GET] /admin/livestream/:classId/status
// module.exports.getLivestreamStatus = async (req, res) => {
//     try {
//         const classId = req.params.classId;
//         const classData = await Class.findById(classId);

//         if (!classData || !classData.livestream.youtubeVideoId) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Không tìm thấy livestream"
//             });
//         }

//         // Lấy thông tin từ YouTube
//         const youtubeInfo = await youtubeService.getLiveStreamInfo(classData.livestream.youtubeVideoId);

//         res.json({
//             success: true,
//             data: {
//                 isLive: classData.livestream.isLive,
//                 youtubeUrl: classData.livestream.youtubeUrl,
//                 embedUrl: `https://www.youtube.com/embed/${classData.livestream.youtubeVideoId}`,
//                 viewCount: youtubeInfo?.statistics?.viewCount || 0,
//                 likeCount: youtubeInfo?.statistics?.likeCount || 0,
//                 status: youtubeInfo?.status?.lifeCycleStatus || 'unknown'
//             }
//         });
//     } catch (error) {
//         console.error("Error getting livestream status:", error);
//         res.status(500).json({
//             success: false,
//             message: "Có lỗi xảy ra khi lấy trạng thái livestream"
//         });
//     }
// };
module.exports.getLivestreamStatus = async (req, res) => {
    try {
        const classId = req.params.classId;
        const classData = await Class.findById(classId);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học"
            });
        }

        if (!classData.livestream || !classData.livestream.youtubeVideoId) {
            return res.json({
                success: true,
                data: {
                    isLive: false,
                    youtubeUrl: null,
                    embedUrl: null,
                    viewCount: 0,
                    likeCount: 0,
                    status: "not_created"
                }
            });
        }

        // Lấy thông tin từ YouTube
        const youtubeInfo = await youtubeService.getLiveStreamInfo(
            classData.livestream.youtubeVideoId
        );

        res.json({
            success: true,
            data: {
                isLive: classData.livestream.isLive,
                youtubeUrl: classData.livestream.youtubeUrl,
                embedUrl: `https://www.youtube.com/embed/${classData.livestream.youtubeVideoId}`,
                viewCount: youtubeInfo?.statistics?.viewCount || 0,
                likeCount: youtubeInfo?.statistics?.likeCount || 0,
                status: youtubeInfo?.status?.lifeCycleStatus || "unknown"
            }
        });
    } catch (error) {
        console.error("Error getting livestream status:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy trạng thái livestream"
        });
    }
};


// [POST] /admin/livestream/:classId/reset
module.exports.resetLivestream = async (req, res) => {
    try {
        const classId = req.params.classId;
        const classData = await Class.findById(classId);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học"
            });
        }

        if (!classData.livestream || !classData.livestream.youtubeVideoId) {
            return res.status(400).json({
                success: false,
                message: "Lớp học này chưa có livestream"
            });
        }

        // Xóa livestream trên YouTube nếu có
        try {
            if (classData.livestream.youtubeVideoId) {
                await youtubeService.deleteLiveBroadcastAndStream(classData.livestream.youtubeVideoId);
            }
        } catch (error) {
            console.error("Error deleting YouTube livestream:", error);
            // Không chặn reset nếu xóa YouTube thất bại
        }

        // Reset livestream data
        classData.livestream = {
            isLive: false,
            youtubeUrl: null,
            youtubeVideoId: null,
            liveStartTime: null,
            liveEndTime: null,
            streamKey: null,
            title: null,
            description: null,
            privacy: 'unlisted',
            chatEnabled: true,
            recordingEnabled: true
        };

        await classData.save();

        res.json({
            success: true,
            message: "Reset livestream thành công"
        });
    } catch (error) {
        console.error("Error resetting livestream:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi reset livestream"
        });
    }
};

// [GET] /admin/livestream/manage
module.exports.manageLivestreams = async (req, res) => {
    try {
        const classes = await Class.find({ 
            deleted: false,
            'livestream.youtubeVideoId': { $exists: true, $ne: null }
        })
        .populate('course_id')
        .populate('instructor_id')
        .sort({ 'livestream.liveStartTime': -1 });

        res.render("admin/pages/livestream/manage", {
            pageTitle: "Quản lý Livestream",
            classes: classes
        });
    } catch (error) {
        console.error("Error loading livestream management:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý livestream");
        res.redirect("back");
    }
};

// [GET] /admin/livestream/auth/connect
module.exports.connectYouTube = async (req, res) => {
    try {
        if (!youtubeService.generateAuthUrl) {
            throw new Error('YouTube service chưa hỗ trợ OAuth.');
        }
        const url = youtubeService.generateAuthUrl();
        return res.redirect(url);
    } catch (error) {
        console.error('Error generating YouTube auth URL:', error);
        req.flash('error', error.message || 'Không tạo được URL kết nối YouTube');
        return res.redirect('back');
    }
};

// [GET] /admin/livestream/auth/callback
module.exports.oauthCallback = async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            req.flash('error', 'Thiếu mã xác thực (code) từ YouTube');
            return res.redirect('back');
        }
        const tokens = await youtubeService.handleAuthCallback(code);
        // Hướng dẫn lưu refresh token vào ENV
        const refreshToken = tokens.refresh_token || youtubeService.oauth2Client?.credentials?.refresh_token;
        let message = 'Kết nối YouTube thành công.';
        if (refreshToken) {
            // message += ' Vui lòng thêm YOUTUBE_REFRESH_TOKEN vào file .env để giữ kết nối lâu dài.';
            // console.log('\n======== YOUTUBE TOKENS ========');
            // console.log('REFRESH TOKEN:', refreshToken);
            // console.log('ACCESS TOKEN:', tokens.access_token);
            // console.log('EXPIRES IN:', tokens.expiry_date);
            // console.log('================================\n');
        }
        req.flash('success', message);
        res.redirect('/admin/livestream/manage');
    } catch (error) {
        console.error('Error handling YouTube OAuth callback:', error);
        req.flash('error', error.message || 'Không thể kết nối YouTube');
        res.redirect('back');
    }
};
