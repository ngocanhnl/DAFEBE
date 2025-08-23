const Enrollment = require("../../models/enrollment.model");
const ClassModel = require("../../models/class.model");

module.exports.myEnrollments = async (req, res) => {
    try {
        const userId = req.userClient._id;
        const enrollments = await Enrollment.find({ student_id: userId, deleted: false })
            .populate({ path: "class_id", select: "class_name lessons start_date end_date status course_id" });
        return res.json({ success: true, data: enrollments });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to list enrollments", error: error.message });
    }
};

module.exports.classDetailWithLessons = async (req, res) => {
    try {
        const classId = req.params.classId;
        const enrollment = await Enrollment.findOne({ student_id: req.userClient._id, class_id: classId, deleted: false, status: { $in: ["approved", "completed"] } });
        if (!enrollment) return res.status(403).json({ success: false, message: "Not enrolled" });

        const classDoc = await ClassModel.findById(classId)
            .select("class_name description lessons start_date end_date schedule location status instructor_id")
            .populate({ path: "course_id", select: "title thumbnail" })
            .populate({ path: "instructor_id", select: "fullName email" });
        if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });
        return res.json({ success: true, data: classDoc });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get class detail", error: error.message });
    }
};

// Yêu cầu đổi lớp học
module.exports.requestClassTransfer = async (req, res) => {
    try {
        const { currentClassId, targetClassId, reason } = req.body;
        const studentId = req.userClient._id;

        // Kiểm tra enrollment hiện tại
        const currentEnrollment = await Enrollment.findOne({
            student_id: studentId,
            class_id: currentClassId,
            deleted: false,
            status: "approved"
        });

        if (!currentEnrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đăng ký lớp học hiện tại"
            });
        }

        // Kiểm tra lớp học hiện tại
        const currentClass = await ClassModel.findById(currentClassId);
        if (!currentClass) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học hiện tại"
            });
        }

        // Kiểm tra lớp học đích
        const targetClass = await ClassModel.findById(targetClassId);
        if (!targetClass) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học đích"
            });
        }

        // Kiểm tra xem lớp đích có cùng khóa học không
        if (currentClass.course_id.toString() !== targetClass.course_id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể chuyển đến lớp học cùng khóa học"
            });
        }

        // Kiểm tra xem lớp đích còn chỗ không
        const targetClassEnrollments = await Enrollment.countDocuments({
            class_id: targetClassId,
            status: { $in: ["approved", "pending_teacher_approval"] },
            deleted: false
        });

        if (targetClassEnrollments >= targetClass.max_students) {
            return res.status(400).json({
                success: false,
                message: "Lớp học đích đã đầy"
            });
        }

        // Kiểm tra xem đã có yêu cầu chuyển lớp chưa
        if (currentEnrollment.transfer_request.requested) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã có yêu cầu chuyển lớp đang chờ duyệt"
            });
        }

        // Xác định trạng thái dựa trên trạng thái lớp đích
        let transferStatus = "pending";
        if (targetClass.status === "ongoing") {
            transferStatus = "pending_teacher_approval";
        }

        // Cập nhật yêu cầu chuyển lớp
        await Enrollment.updateOne(
            { _id: currentEnrollment._id },
            {
                "transfer_request.requested": true,
                "transfer_request.requested_date": new Date(),
                "transfer_request.reason": reason,
                "transfer_request.target_class_id": targetClassId,
                "transfer_request.status": transferStatus
            }
        );

        return res.json({
            success: true,
            message: transferStatus === "pending_teacher_approval" 
                ? "Yêu cầu chuyển lớp đã được gửi. Lớp học đang diễn ra, cần giáo viên duyệt."
                : "Yêu cầu chuyển lớp đã được gửi thành công"
        });

    } catch (error) {
        console.error("Error requesting class transfer:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi gửi yêu cầu chuyển lớp",
            error: error.message
        });
    }
};

// Lấy danh sách lớp học có thể chuyển đến
module.exports.getAvailableClasses = async (req, res) => {
    try {
        const { currentClassId } = req.params;
        const studentId = req.userClient._id;

        // Kiểm tra enrollment hiện tại
        const currentEnrollment = await Enrollment.findOne({
            student_id: studentId,
            class_id: currentClassId,
            deleted: false,
            status: "approved"
        });

        if (!currentEnrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đăng ký lớp học hiện tại"
            });
        }

        // Lấy thông tin lớp học hiện tại
        const currentClass = await ClassModel.findById(currentClassId);
        if (!currentClass) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học hiện tại"
            });
        }

        // Tìm các lớp học cùng khóa học có thể chuyển đến
        const availableClasses = await ClassModel.find({
            _id: { $ne: currentClassId },
            course_id: currentClass.course_id,
            status: { $in: ["upcoming", "ongoing"] },
            deleted: false
        }).populate("instructor_id", "fullName");

        // Lọc các lớp còn chỗ
        const classesWithAvailability = await Promise.all(
            availableClasses.map(async (classItem) => {
                const enrollmentCount = await Enrollment.countDocuments({
                    class_id: classItem._id,
                    status: { $in: ["approved", "pending_teacher_approval"] },
                    deleted: false
                });

                return {
                    ...classItem.toObject(),
                    available_slots: classItem.max_students - enrollmentCount,
                    is_available: enrollmentCount < classItem.max_students
                };
            })
        );

        // Chỉ trả về các lớp còn chỗ
        const availableClassesFiltered = classesWithAvailability.filter(
            (classItem) => classItem.is_available
        );

        return res.json({
            success: true,
            data: availableClassesFiltered
        });

    } catch (error) {
        console.error("Error getting available classes:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy danh sách lớp học",
            error: error.message
        });
    }
};

// Hủy yêu cầu chuyển lớp
module.exports.cancelTransferRequest = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const studentId = req.userClient._id;

        // Kiểm tra enrollment
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            student_id: studentId,
            deleted: false
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đăng ký lớp học"
            });
        }

        if (!enrollment.transfer_request.requested) {
            return res.status(400).json({
                success: false,
                message: "Không có yêu cầu chuyển lớp nào đang chờ duyệt"
            });
        }

        if (enrollment.transfer_request.status !== "pending" && enrollment.transfer_request.status !== "pending_teacher_approval") {
            return res.status(400).json({
                success: false,
                message: "Không thể hủy yêu cầu đã được xử lý"
            });
        }

        // Hủy yêu cầu
        await Enrollment.updateOne(
            { _id: enrollmentId },
            {
                "transfer_request.requested": false,
                "transfer_request.requested_date": null,
                "transfer_request.reason": null,
                "transfer_request.target_class_id": null,
                "transfer_request.status": "pending"
            }
        );

        return res.json({
            success: true,
            message: "Đã hủy yêu cầu chuyển lớp thành công"
        });

    } catch (error) {
        console.error("Error canceling transfer request:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi hủy yêu cầu chuyển lớp",
            error: error.message
        });
    }
};

// Lấy thông tin yêu cầu chuyển lớp
module.exports.getTransferRequest = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const studentId = req.userClient._id;

        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            student_id: studentId,
            deleted: false
        }).populate([
            { path: "class_id", select: "class_name start_date end_date status" },
            { path: "transfer_request.target_class_id", select: "class_name start_date end_date status instructor_id" }
        ]);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đăng ký lớp học"
            });
        }

        return res.json({
            success: true,
            data: enrollment.transfer_request
        });

    } catch (error) {
        console.error("Error getting transfer request:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thông tin yêu cầu chuyển lớp",
            error: error.message
        });
    }
};


