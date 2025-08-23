const Enrollment = require("../../models/enrollment.model");
const Class = require("../../models/class.model");
const Account = require("../../models/account.model");
const Course = require("../../models/course.model");
const systemConfig = require("../../config/system");
const Role = require("../../models/role.model");

// [GET] /admin/enrollments/transfer-requests
module.exports.getTransferRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Lấy tất cả yêu cầu chuyển lớp
        const transferRequests = await Enrollment.find({
            "transfer_request.requested": true,
            deleted: false
        })
        .populate([
            { path: "student_id", select: "fullName email phone" },
            { path: "class_id", select: "class_name start_date end_date status course_id" },
            { path: "transfer_request.target_class_id", select: "class_name start_date end_date status instructor_id" },
            { path: "transfer_request.approved_by", select: "fullName" },
            { path: "transfer_request.teacher_approved_by", select: "fullName" }
        ])
        .sort({ "transfer_request.requested_date": -1 })
        .skip(skip)
        .limit(limit);

        const totalRequests = await Enrollment.countDocuments({
            "transfer_request.requested": true,
            deleted: false
        });

        const totalPages = Math.ceil(totalRequests / limit);

        // Lọc theo trạng thái nếu có
        let filteredRequests = transferRequests;
        if (req.query.status) {
            filteredRequests = transferRequests.filter(
                request => request.transfer_request.status === req.query.status
            );
        }

        res.render("admin/pages/enrollments/transfer-requests", {
            pageTitle: "Quản lý yêu cầu chuyển lớp",
            transferRequests: filteredRequests,
            pagination: {
                page: page,
                limit: limit,
                total: totalRequests,
                totalPages: totalPages
            },
            query: req.query
        });

    } catch (error) {
        console.error("Error fetching transfer requests:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách yêu cầu chuyển lớp");
        res.redirect("back");
    }
};

// [GET] /admin/enrollments/transfer-requests/:id
module.exports.getTransferRequestDetail = async (req, res) => {
    try {
        const enrollmentId = req.params.id;

        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            "transfer_request.requested": true,
            deleted: false
        })
        .populate([
            { path: "student_id", select: "fullName email phone" },
            { path: "class_id", select: "class_name start_date end_date status course_id instructor_id" },
            { path: "transfer_request.target_class_id", select: "class_name start_date end_date status instructor_id" },
            { path: "transfer_request.approved_by", select: "fullName" },
            { path: "transfer_request.teacher_approved_by", select: "fullName" }
        ]);

        if (!enrollment) {
            req.flash("error", "Không tìm thấy yêu cầu chuyển lớp");
            return res.redirect(`/${systemConfig.prefixAdmin}/enrollments/transfer-requests`);
        }

        // Lấy thông tin số học viên hiện tại của lớp đích
        const targetClassEnrollments = await Enrollment.countDocuments({
            class_id: enrollment.transfer_request.target_class_id._id,
            status: { $in: ["approved", "pending_teacher_approval"] },
            deleted: false
        });

        const targetClass = enrollment.transfer_request.target_class_id;
        const availableSlots = targetClass.max_students - targetClassEnrollments;

        res.render("admin/pages/enrollments/transfer-request-detail", {
            pageTitle: "Chi tiết yêu cầu chuyển lớp",
            enrollment: enrollment,
            availableSlots: availableSlots
        });

    } catch (error) {
        console.error("Error fetching transfer request detail:", error);
        req.flash("error", "Có lỗi xảy ra khi tải chi tiết yêu cầu chuyển lớp");
        res.redirect("back");
    }
};

// [POST] /admin/enrollments/transfer-requests/:id/approve
module.exports.approveTransferRequest = async (req, res) => {
    try {
        const enrollmentId = req.params.id;
        const { notes } = req.body;

        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            "transfer_request.requested": true,
            "transfer_request.status": "pending",
            deleted: false
        })
        .populate([
            { path: "class_id", select: "status instructor_id" },
            { path: "transfer_request.target_class_id", select: "status instructor_id" }
        ]);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu chuyển lớp hợp lệ"
            });
        }

        const currentClass = enrollment.class_id;
        const targetClass = enrollment.transfer_request.target_class_id;

        // Kiểm tra xem lớp đích còn chỗ không
        const targetClassEnrollments = await Enrollment.countDocuments({
            class_id: targetClass._id,
            status: { $in: ["approved", "pending_teacher_approval"] },
            deleted: false
        });

        if (targetClassEnrollments >= targetClass.max_students) {
            return res.status(400).json({
                success: false,
                message: "Lớp học đích đã đầy"
            });
        }

        // Xác định trạng thái tiếp theo dựa trên trạng thái lớp đích
        let nextStatus = "approved";
        if (targetClass.status === "ongoing") {
            nextStatus = "pending_teacher_approval";
        }

        // Cập nhật yêu cầu chuyển lớp
        await Enrollment.updateOne(
            { _id: enrollmentId },
            {
                "transfer_request.status": nextStatus,
                "transfer_request.approved_by": res.locals.user._id,
                "transfer_request.approved_date": new Date(),
                "transfer_request.notes": notes || ""
            }
        );

        // Nếu lớp đích đang diễn ra, tạo enrollment mới với trạng thái pending_teacher_approval
        if (targetClass.status === "ongoing") {
            // Kiểm tra xem đã có enrollment cho lớp đích chưa
            const existingEnrollment = await Enrollment.findOne({
                student_id: enrollment.student_id,
                class_id: targetClass._id,
                deleted: false
            });

            if (!existingEnrollment) {
                // Tạo enrollment mới cho lớp đích
                await Enrollment.create({
                    student_id: enrollment.student_id,
                    class_id: targetClass._id,
                    status: "pending_teacher_approval",
                    payment_status: enrollment.payment_status,
                    amount_paid: enrollment.amount_paid,
                    enrollment_date: new Date()
                });
            }
        } else {
            // Nếu lớp chưa bắt đầu, chuyển enrollment trực tiếp
            await Enrollment.updateOne(
                { _id: enrollmentId },
                {
                    class_id: targetClass._id,
                    status: "approved"
                }
            );
        }

        return res.json({
            success: true,
            message: nextStatus === "pending_teacher_approval" 
                ? "Đã duyệt yêu cầu chuyển lớp. Học viên cần được giáo viên duyệt để vào lớp."
                : "Đã duyệt yêu cầu chuyển lớp thành công"
        });

    } catch (error) {
        console.error("Error approving transfer request:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi duyệt yêu cầu chuyển lớp",
            error: error.message
        });
    }
};

// [POST] /admin/enrollments/transfer-requests/:id/reject
module.exports.rejectTransferRequest = async (req, res) => {
    try {
        const enrollmentId = req.params.id;
        const { notes } = req.body;

        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            "transfer_request.requested": true,
            "transfer_request.status": "pending",
            deleted: false
        })
        .populate([
            { path: "class_id", select: "status instructor_id" },
            { path: "transfer_request.target_class_id", select: "status instructor_id" }
        ]);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu chuyển lớp hợp lệ"
            });
        }

        // Từ chối yêu cầu
        await Enrollment.updateOne(
            { _id: enrollmentId },
            {
                "transfer_request.status": "rejected",
                "transfer_request.approved_by": req.user._id,
                "transfer_request.approved_date": new Date(),
                "transfer_request.notes": notes || ""
            }
        );

        return res.json({
            success: true,
            message: "Đã từ chối yêu cầu chuyển lớp"
        });

    } catch (error) {
        console.error("Error rejecting transfer request:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi từ chối yêu cầu chuyển lớp",
            error: error.message
        });
    }
};

// [GET] /admin/enrollments
module.exports.index = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const filterQuery = { deleted: false };
        
        if (req.query.status) {
            filterQuery.status = req.query.status;
        }

        if (req.query.class_id) {
            filterQuery.class_id = req.query.class_id;
        }

        const totalEnrollments = await Enrollment.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalEnrollments / limit);

        const enrollments = await Enrollment.find(filterQuery)
            .populate([
                { path: "student_id", select: "fullName email phone" },
                { path: "class_id", select: "class_name start_date end_date status course_id" }
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const classes = await Class.find({ deleted: false, status: { $in: ["upcoming", "ongoing"] } });

        res.render("admin/pages/enrollments/index", {
            pageTitle: "Quản lý đăng ký khóa học",
            enrollments: enrollments,
            classes: classes,
            pagination: {
                page: page,
                limit: limit,
                total: totalEnrollments,
                totalPages: totalPages
            },
            query: req.query
        });

    } catch (error) {
        console.error("Error fetching enrollments:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách đăng ký");
        res.redirect("back");
    }
};

// [GET] /admin/enrollments/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        const enrollment = await Enrollment.findOne({ _id: id, deleted: false })
            .populate('student_id', 'fullName email phone address')
            .populate({
                path: 'class_id',
                populate: {
                    path: 'course_id',
                    select: 'title description'
                }
            })
            .populate('instructor_id', 'fullName email');

        if (!enrollment) {
            req.flash("error", "Không tìm thấy đăng ký");
            return res.redirect(`/${systemConfig.prefixAdmin}/enrollments`);
        }

        res.render("admin/pages/enrollments/detail", {
            pageTitle: "Chi tiết đăng ký",
            enrollment: enrollment
        });
    } catch (error) {
        console.error("Error loading enrollment details:", error);
        req.flash("error", "Có lỗi xảy ra khi tải chi tiết đăng ký");
        res.redirect("back");
    }
};

// [PATCH] /admin/enrollments/approve/:id
module.exports.approveEnrollment = async (req, res) => {
    try {
        const id = req.params.id;
        const enrollment = await Enrollment.findOne({ _id: id, deleted: false });
        
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đăng ký" });
        }

        if (enrollment.status !== "pending") {
            return res.status(400).json({ success: false, message: "Đăng ký này không thể duyệt" });
        }

        // Check class capacity
        const classData = await Class.findOne({ _id: enrollment.class_id });
        const currentEnrollments = await Enrollment.countDocuments({ 
            class_id: enrollment.class_id, 
            status: "approved" 
        });

        if (currentEnrollments >= classData.max_students) {
            return res.status(400).json({ 
                success: false, 
                message: "Lớp học đã đầy, không thể thêm học viên" 
            });
        }

        await Enrollment.updateOne(
            { _id: id },
            { 
                status: "approved",
                approved_at: new Date(),
                approved_by: req.user.id
            }
        );

        res.json({ success: true, message: "Duyệt đăng ký thành công" });
    } catch (error) {
        console.error("Error approving enrollment:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi duyệt đăng ký" });
    }
};

// [PATCH] /admin/enrollments/reject/:id
module.exports.rejectEnrollment = async (req, res) => {
    try {
        const id = req.params.id;
        const { reason } = req.body;

        const enrollment = await Enrollment.findOne({ _id: id, deleted: false });
        
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đăng ký" });
        }

        if (enrollment.status !== "pending") {
            return res.status(400).json({ success: false, message: "Đăng ký này không thể từ chối" });
        }

        await Enrollment.updateOne(
            { _id: id },
            { 
                status: "rejected",
                rejected_at: new Date(),
                rejected_by: req.user.id,
                rejection_reason: reason
            }
        );

        res.json({ success: true, message: "Từ chối đăng ký thành công" });
    } catch (error) {
        console.error("Error rejecting enrollment:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi từ chối đăng ký" });
    }
};

// [PATCH] /admin/enrollments/approve-transfer/:id
module.exports.approveTransfer = async (req, res) => {
    try {
        const id = req.params.id;
        const enrollment = await Enrollment.findOne({ _id: id, deleted: false });
        
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đăng ký" });
        }

        if (!enrollment.transfer_request || enrollment.transfer_request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Không có yêu cầu chuyển lớp hợp lệ" });
        }

        // Check if target class has capacity
        const targetClass = await Class.findOne({ _id: enrollment.transfer_request.target_class_id });
        const currentEnrollments = await Enrollment.countDocuments({ 
            class_id: enrollment.transfer_request.target_class_id, 
            status: "approved" 
        });

        if (currentEnrollments >= targetClass.max_students) {
            return res.status(400).json({ 
                success: false, 
                message: "Lớp học đích đã đầy, không thể chuyển học viên" 
            });
        }

        // Update enrollment with new class
        await Enrollment.updateOne(
            { _id: id },
            { 
                class_id: enrollment.transfer_request.target_class_id,
                "transfer_request.status": "approved",
                "transfer_request.approved_at": new Date(),
                "transfer_request.approved_by": req.user.id
            }
        );

        res.json({ success: true, message: "Duyệt chuyển lớp thành công" });
    } catch (error) {
        console.error("Error approving transfer:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi duyệt chuyển lớp" });
    }
};

// [PATCH] /admin/enrollments/reject-transfer/:id
module.exports.rejectTransfer = async (req, res) => {
    try {
        const id = req.params.id;
        const { reason } = req.body;

        const enrollment = await Enrollment.findOne({ _id: id, deleted: false });
        
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đăng ký" });
        }

        if (!enrollment.transfer_request || enrollment.transfer_request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Không có yêu cầu chuyển lớp hợp lệ" });
        }

        await Enrollment.updateOne(
            { _id: id },
            { 
                "transfer_request.status": "rejected",
                "transfer_request.rejected_at": new Date(),
                "transfer_request.rejected_by": req.user.id,
                "transfer_request.rejection_reason": reason
            }
        );

        res.json({ success: true, message: "Từ chối chuyển lớp thành công" });
    } catch (error) {
        console.error("Error rejecting transfer:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi từ chối chuyển lớp" });
    }
};

// [GET] /admin/enrollments/transfer-requests
module.exports.viewTransferRequests = async (req, res) => {
    try {
        const transferRequests = await Enrollment.find({ 
            deleted: false,
            "transfer_request.status": "pending"
        })
        .populate('student_id', 'fullName email phone')
        .populate('class_id', 'class_code')
        .populate('transfer_request.target_class_id', 'class_code')
        .populate({
            path: 'class_id',
            populate: {
                path: 'course_id',
                select: 'title'
            }
        })
        .populate({
            path: 'transfer_request.target_class_id',
            populate: {
                path: 'course_id',
                select: 'title'
            }
        })
        .sort({ createdAt: -1 });

        res.render("admin/pages/enrollments/transfer-requests", {
            pageTitle: "Yêu cầu chuyển lớp",
            transferRequests: transferRequests
        });
    } catch (error) {
        console.error("Error loading transfer requests:", error);
        req.flash("error", "Có lỗi xảy ra khi tải yêu cầu chuyển lớp");
        res.redirect("back");
    }
};

// [PATCH] /admin/enrollments/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;

        await Enrollment.updateOne({ _id: id }, { status: status });

        req.flash("success", "Cập nhật trạng thái thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error changing status:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật trạng thái");
        res.redirect("back");
    }
};

// [PATCH] /admin/enrollments/change-multi
module.exports.changeMulti = async (req, res) => {
    try {
        const { type, ids } = req.body;

        switch (type) {
            case "approve":
                await Enrollment.updateMany(
                    { _id: { $in: ids } },
                    { 
                        status: "approved",
                        approved_at: new Date(),
                        approved_by: req.user.id
                    }
                );
                req.flash("success", "Duyệt thành công các đăng ký đã chọn");
                break;
            case "reject":
                await Enrollment.updateMany(
                    { _id: { $in: ids } },
                    { 
                        status: "rejected",
                        rejected_at: new Date(),
                        rejected_by: req.user.id
                    }
                );
                req.flash("success", "Từ chối thành công các đăng ký đã chọn");
                break;
            case "delete":
                await Enrollment.updateMany(
                    { _id: { $in: ids } },
                    { 
                        deleted: true,
                        deletedAt: new Date()
                    }
                );
                req.flash("success", "Xóa thành công các đăng ký đã chọn");
                break;
            default:
                req.flash("error", "Hành động không hợp lệ");
        }

        res.redirect("back");
    } catch (error) {
        console.error("Error in multi action:", error);
        req.flash("error", "Có lỗi xảy ra khi thực hiện hành động");
        res.redirect("back");
    }
};

// [DELETE] /admin/enrollments/delete/:id
module.exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        await Enrollment.updateOne(
            { _id: id },
            { 
                deleted: true,
                deletedAt: new Date()
            }
        );

        req.flash("success", "Xóa đăng ký thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error deleting enrollment:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa đăng ký");
        res.redirect("back");
    }
};

// [GET] /admin/enrollments/create
module.exports.create = async (req, res) => {
    try {

        const role = await Role.findOne({ deleted: false, title: "Student" });
        console.log("role", role);

        // Get all accounts that could be students (not admin/teacher roles)
        const students = await Account.find({ 
            deleted: false,
            role_id: role._id
        }).select('fullName email phone role_id');
        
        const classes = await Class.find({ deleted: false })
            .populate('course_id', 'title')
            .populate('instructor_id', 'fullName')
            .select('class_name class_code course_id instructor_id price');

        res.render("admin/pages/enrollments/create", {
            pageTitle: "Thêm mới đăng ký",
            students: students,
            classes: classes
        });
    } catch (error) {
        console.error("Error loading create enrollment page:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang thêm mới đăng ký");
        res.redirect("back");
    }
};

// [POST] /admin/enrollments/create
module.exports.store = async (req, res) => {
    try {
        const { student_id, class_id, amount_paid, payment_status, status } = req.body;

        // Validate required fields
        if (!student_id || !class_id) {
            req.flash("error", "Vui lòng chọn học viên và lớp học");
            return res.redirect("back");
        }

        // Check if student is already enrolled in this class
        const existingEnrollment = await Enrollment.findOne({
            student_id: student_id,
            class_id: class_id,
            deleted: false
        });

        if (existingEnrollment) {
            req.flash("error", "Học viên đã đăng ký lớp học này");
            return res.redirect("back");
        }

        // Check class capacity if status is approved
        if (status === "approved") {
            const classData = await Class.findOne({ _id: class_id });
            const currentEnrollments = await Enrollment.countDocuments({ 
                class_id: class_id, 
                status: "approved",
                deleted: false
            });

            if (currentEnrollments >= classData.max_students) {
                req.flash("error", "Lớp học đã đầy, không thể thêm học viên");
                return res.redirect("back");
            }
        }

        // Get class data for course_id and price
        const classData = await Class.findOne({ _id: class_id });

        // Create new enrollment
        const enrollmentData = {
            student_id: student_id,
            class_id: class_id,
            status: status || "approved",
            payment_status: payment_status || "paid",
            amount_paid: amount_paid || classData.price,
            payment_date: payment_status === "paid" ? new Date() : null
        };

        // Add approval info if status is approved
        if (status === "approved") {
            enrollmentData.approved_at = new Date();
            enrollmentData.approved_by = res.locals.user.id;
        }

        await Enrollment.create(enrollmentData);

        req.flash("success", "Thêm mới đăng ký thành công");
        res.redirect(`/${systemConfig.prefixAdmin}/enrollments`);
    } catch (error) {
        console.error("Error creating enrollment:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo đăng ký");
        res.redirect("back");
    }
};

// [GET] /admin/enrollments/class-info/:id
module.exports.getClassInfo = async (req, res) => {
    try {
        const classId = req.params.id;
        const classData = await Class.findOne({ _id: classId, deleted: false })
            .populate('course_id', 'title')
            .populate('instructor_id', 'fullName');

        if (!classData) {
            return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });
        }

        // Get current enrollment count
        const currentEnrollments = await Enrollment.countDocuments({ 
            class_id: classId, 
            status: "approved",
            deleted: false
        });

        res.json({
            success: true,
            data: {
                class_name: classData.class_name || classData.class_code,
                course_title: classData.course_id.title,
                instructor_name: classData.instructor_id.fullName,
                price: classData.price,
                max_students: classData.max_students,
                current_students: currentEnrollments,
                available_slots: classData.max_students - currentEnrollments
            }
        });
    } catch (error) {
        console.error("Error getting class info:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi lấy thông tin lớp học" });
    }
};

// [GET] /admin/enrollments/check-enrollment
module.exports.checkEnrollment = async (req, res) => {
    try {
        const { student_id, class_id } = req.query;

        if (!student_id || !class_id) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin học viên hoặc lớp học" });
        }

        const existingEnrollment = await Enrollment.findOne({
            student_id: student_id,
            class_id: class_id,
            deleted: false
        });

        res.json({
            success: true,
            exists: !!existingEnrollment,
            enrollment: existingEnrollment ? {
                status: existingEnrollment.status,
                enrollment_date: existingEnrollment.enrollment_date
            } : null
        });
    } catch (error) {
        console.error("Error checking enrollment:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi kiểm tra đăng ký" });
    }
}; 