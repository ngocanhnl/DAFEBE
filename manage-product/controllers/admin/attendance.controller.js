const Attendance = require("../../models/attendance.model");
const Class = require("../../models/class.model");
const Course = require("../../models/course.model");
const Enrollment = require("../../models/enrollment.model");
const Account = require("../../models/account.model");
const systemConfig = require("../../config/system");

// [GET] /admin/attendance
module.exports.index = async (req, res) => {
    try {
        console.log("res.locals.user",res.locals.user);
        const userId = res.locals.user._id;
        
        // Get classes assigned to this instructor
        const myClasses = await Class.find({ 
            instructor_id: userId,
            deleted: false,
            // status: "active"
        })
        .populate('course_id', 'title')
        .sort({ start_date: -1 });
        console.log("myClasses",myClasses);

        // Calculate enrollment count for each class
        const myClassesWithEnrollment = await Promise.all(myClasses.map(async (classItem) => {
            const enrollmentCount = await Enrollment.countDocuments({ 
                class_id: classItem._id, 
                status: "approved" 
            });
            
            return {
                ...classItem.toObject(),
                enrolled_count: enrollmentCount
            };
        }));
        // Get attendance statistics for the instructor
        const totalClasses = myClasses.length;
        const totalStudents = await Enrollment.countDocuments({
            class_id: { $in: myClasses.map(c => c._id) },
            status: "approved"
        });
        console.log("totalStudents",totalStudents);

        const recentAttendance = await Attendance.find({
            instructor_id: userId
        })
        .populate('class_id', 'class_code')
        .sort({ session_date: -1 })
        .limit(5);

        res.render("admin/pages/attendance/index", {
            pageTitle: "Quản lý điểm danh",
            myClasses: myClassesWithEnrollment,
            stats: {
                totalClasses: totalClasses,
                totalStudents: totalStudents
            },
            recentAttendance: recentAttendance
        });
    } catch (error) {
        console.error("Error loading attendance dashboard:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang điểm danh");
        res.redirect("back");
    }
};

// [GET] /admin/attendance/my-classes
module.exports.myClasses = async (req, res) => {
    try {
        const userId = res.locals.user._id;
        
        const myClasses = await Class.find({ 
            instructor_id: userId,
            deleted: false
        })
        .populate('course_id', 'title')
        .populate('instructor_id', 'fullName')
        .sort({ start_date: -1 });

        // Calculate enrollment count for each class
        const myClassesWithEnrollment = await Promise.all(myClasses.map(async (classItem) => {
            const enrollmentCount = await Enrollment.countDocuments({ 
                class_id: classItem._id, 
                status: "approved" 
            });
            
            return {
                ...classItem.toObject(),
                enrolled_count: enrollmentCount
            };
        }));

        res.render("admin/pages/attendance/my-classes", {
            pageTitle: "Lớp học của tôi",
            myClasses: myClassesWithEnrollment
        });
    } catch (error) {
        console.error("Error loading my classes:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách lớp học");
        res.redirect("back");
    }
};

// [GET] /admin/attendance/take-attendance/:classId
module.exports.takeAttendance = async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = res.locals.user._id;

        // Verify instructor owns this class
        const classData = await Class.findOne({ 
            _id: classId, 
            instructor_id: userId,
            deleted: false 
        })
        .populate('course_id', 'title duration');

        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học hoặc bạn không có quyền truy cập");
            return res.redirect(`/${systemConfig.prefixAdmin}/attendance`);
        }

        // Get enrolled students
        const enrollments = await Enrollment.find({
            class_id: classId,
            status: "approved"
        })
        .populate('student_id', 'fullName email phone avatar')
        .sort({ createdAt: -1 });

        // Compute session info based on course duration
        const totalSessions = (classData.course_id && classData.course_id.duration) ? classData.course_id.duration : 0;
        const attendanceRecords = await Attendance.find({ class_id: classId }).select('session_number').lean();
        const takenSessionNumbers = attendanceRecords
            .map(r => r.session_number)
            .filter(n => typeof n === 'number');
        let nextSessionNumber;
        if (totalSessions && totalSessions > 0) {
            nextSessionNumber = Math.min(totalSessions, (takenSessionNumbers.length || 0) + 1);
        } else {
            nextSessionNumber = (takenSessionNumbers.length || 0) + 1;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Map enrollments to students expected by the view
        const students = enrollments.map(e => ({
            _id: e.student_id?._id,
            fullName: e.student_id?.fullName,
            email: e.student_id?.email,
            avatar: e.student_id?.avatar || ''
        }));

        // Prepare lightweight class info for the view
        const classItem = {
            _id: classData._id,
            class_code: classData.class_name,
            course_title: classData.course_id?.title,
            schedule: (classData.schedule || []).map(s => `${s.start_time}-${s.end_time}`).join(', '),
            location: classData.location || ''
        };

        res.render("admin/pages/attendance/take-attendance", {
            pageTitle: "Điểm danh",
            classItem,
            students,
            today,
            totalSessions,
            takenSessionNumbers,
            nextSessionNumber
        });
    } catch (error) {
        console.error("Error loading take attendance form:", error);
        req.flash("error", "Có lỗi xảy ra khi tải form điểm danh");
        res.redirect("back");
    }
};

// [POST] /admin/attendance/take-attendance/:classId

module.exports.takeAttendancePost = async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = res.locals.user._id;
        const { session_date, session_number } = req.body;
        console.log("req.body",req.body);
        console.log("session_number",session_number);
        // Verify instructor owns this class
        const classData = await Class.findOne({ 
            _id: classId, 
            instructor_id: userId,
            deleted: false 
        });

        if (!classData) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không có quyền điểm danh cho lớp này" 
            });
        }

        // Validate session number against course duration
        const course = await Course.findOne({ _id: classData.course_id }).lean();
        const totalSessions = course?.duration || 0;
        const parsedSessionNumber = parseInt(session_number, 10);
        console.log("parsedSessionNumber",parsedSessionNumber);
        console.log("totalSessions",totalSessions);
        if (!parsedSessionNumber || parsedSessionNumber < 1 || (totalSessions && parsedSessionNumber > totalSessions)) {
            return res.status(400).json({ success: false, message: "Số buổi học không hợp lệ" });
        }

        // Upsert by class + session_number (allow editing previous sessions)
        const existingSession = await Attendance.findOne({ class_id: classId, session_number: parsedSessionNumber });

        // Normalize date
        const attendanceDate = new Date(session_date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Build attendance_data from form fields attendance[studentId] and note[studentId]
        const attendance_data = [];
        for (const [key, value] of Object.entries(req.body)) {
            const match = key.match(/^attendance\[(.+)\]$/);
            if (match) {
                const studentId = match[1];
                const status = value;
                const noteKey = `note[${studentId}]`;
                attendance_data.push({
                    student_id: studentId,
                    status: status,
                    notes: req.body[noteKey] || ''
                });
            }
        }
        console.log("attendance_data",attendance_data);

        // Create attendance record
        const attendanceRecord = {
            class_id: classId,
            course_id: classData.course_id,
            instructor_id: userId,
            session_date: attendanceDate,
            session_number: parsedSessionNumber,
            notes: req.body.notes || '',
            students: attendance_data,
            created_by: userId
        };

        let saved;
        if (existingSession) {
            await Attendance.updateOne(
                { _id: existingSession._id },
                attendanceRecord
            );
            saved = existingSession;
        } else {
            const newAttendance = new Attendance(attendanceRecord);
            saved = await newAttendance.save();
        }

        res.json({ success: true, message: "Lưu điểm danh thành công", attendance_id: saved._id });
    } catch (error) {
        console.error("Error taking attendance:", error);
        res.status(500).json({ 
            success: false, 
            message: "Có lỗi xảy ra khi điểm danh" 
        });
    }
};

// [GET] /admin/attendance/class/:classId/session/:sessionNumber
module.exports.getAttendanceBySession = async (req, res) => {
    try {
        const classId = req.params.classId;
        const sessionNumber = parseInt(req.params.sessionNumber, 10);
        const userId = res.locals.user._id;

        if (!sessionNumber || sessionNumber < 1) {
            return res.status(400).json({ success: false, message: "Số buổi học không hợp lệ" });
        }

        // Verify instructor owns this class
        const classData = await Class.findOne({ 
            _id: classId, 
            instructor_id: userId,
            deleted: false 
        }).select('_id');

        if (!classData) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập lớp này" });
        }

        const record = await Attendance.findOne({ class_id: classId, session_number: sessionNumber }).lean();
        if (!record) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: {
                session_number: record.session_number,
                session_date: record.session_date,
                notes: record.notes || '',
                students: record.students || [],
                attendance_data: record.students || []
            }
        });
    } catch (error) {
        console.error("Error getting attendance by session:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tải dữ liệu buổi học" });
    }
};

// [GET] /admin/attendance/attendance-history/:classId
module.exports.attendanceHistory = async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = res.locals.user._id;

        // Verify instructor owns this class
        const classData = await Class.findOne({ 
            _id: classId, 
            instructor_id: userId,
            deleted: false 
        })
        .populate('course_id', 'title');

        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học hoặc bạn không có quyền truy cập");
            return res.redirect(`/${systemConfig.prefixAdmin}/attendance`);
        }

        // Get attendance history
        const attendanceHistory = await Attendance.find({ class_id: classId, deleted: false })
          .populate('instructor_id', 'fullName')
          .sort({ session_number: 1, session_date: -1 })
          .lean();

        // Derive quick stats per session
        const historyWithStats = attendanceHistory.map(rec => {
          const students = Array.isArray(rec.students) ? rec.students : [];
          const present = students.filter(s => s.status === 'present').length;
          const absent = students.filter(s => s.status === 'absent').length;
          const late = students.filter(s => s.status === 'late').length;
          const total = students.length || 1;
          const rate = Math.round(((present + late) / total) * 100);
          return { ...rec, present_count: present, absent_count: absent, late_count: late, attendance_rate: rate };
        });

        // Get enrolled students for reference
        const enrollments = await Enrollment.find({
            class_id: classId,
            status: "approved"
        })
        .populate('student_id', 'fullName email')
        .sort({ createdAt: -1 });

        res.render("admin/pages/attendance/attendance-history", {
            pageTitle: "Lịch sử điểm danh",
            classData: classData,
            attendanceHistory: historyWithStats,
            enrollments: enrollments
        });
    } catch (error) {
        console.error("Error loading attendance history:", error);
        req.flash("error", "Có lỗi xảy ra khi tải lịch sử điểm danh");
        res.redirect("back");
    }
};

// [GET] /admin/attendance/edit-attendance/:id
module.exports.editAttendance = async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const userId = res.locals.user._id;

        const attendance = await Attendance.findOne({ 
            _id: attendanceId,
            instructor_id: userId
        })
        .populate('class_id')
        .populate('course_id', 'title');

        if (!attendance) {
            req.flash("error", "Không tìm thấy bản ghi điểm danh hoặc bạn không có quyền chỉnh sửa");
            return res.redirect(`/${systemConfig.prefixAdmin}/attendance`);
        }

        // Get enrolled students
        const enrollments = await Enrollment.find({
            class_id: attendance.class_id._id,
            status: "approved"
        })
        .populate('student_id', 'fullName email phone')
        .sort({ createdAt: -1 });

        res.render("admin/pages/attendance/edit-attendance", {
            pageTitle: "Chỉnh sửa điểm danh",
            attendance: attendance,
            enrollments: enrollments
        });
    } catch (error) {
        console.error("Error loading edit attendance form:", error);
        req.flash("error", "Có lỗi xảy ra khi tải form chỉnh sửa điểm danh");
        res.redirect("back");
    }
};

// [GET] /admin/attendance/view/:id
module.exports.viewAttendance = async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const userId = res.locals.user._id;

        const attendance = await Attendance.findOne({ 
            _id: attendanceId,
            instructor_id: userId,
            deleted: false
        })
        .populate('class_id')
        .lean();

        if (!attendance) {
            req.flash("error", "Không tìm thấy bản ghi điểm danh hoặc bạn không có quyền xem");
            return res.redirect(`/${systemConfig.prefixAdmin}/attendance`);
        }

        // Fetch class and course info
        const classData = await Class.findOne({ _id: attendance.class_id._id })
          .populate('course_id', 'title duration')
          .populate('instructor_id', 'fullName')
          .lean();

        // Fetch enrolled students for details
        const enrollments = await Enrollment.find({
            class_id: attendance.class_id._id,
            status: "approved"
        })
        .populate('student_id', 'fullName email phone avatar')
        .lean();

        const studentMap = new Map();
        enrollments.forEach(e => {
            if (e.student_id) studentMap.set(String(e.student_id._id), e.student_id);
        });

        const detailedStudents = (attendance.students || []).map(s => {
            const info = studentMap.get(String(s.student_id)) || {};
            return {
                student_id: s.student_id,
                fullName: info.fullName || 'Không rõ',
                email: info.email || '',
                phone: info.phone || '',
                avatar: info.avatar || '',
                status: s.status || 'absent',
                notes: s.notes || ''
            };
        });

        const presentCount = detailedStudents.filter(d => d.status === 'present').length;
        const absentCount = detailedStudents.filter(d => d.status === 'absent').length;
        const lateCount = detailedStudents.filter(d => d.status === 'late').length;
        const total = detailedStudents.length || 1;
        const attendanceRate = Math.round(((presentCount + lateCount) / total) * 100);

        res.render("admin/pages/attendance/view-attendance", {
            pageTitle: `Chi tiết điểm danh - Buổi ${attendance.session_number || ''}`,
            classData,
            attendance,
            students: detailedStudents,
            stats: {
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                rate: attendanceRate
            }
        });
    } catch (error) {
        console.error("Error loading attendance detail:", error);
        req.flash("error", "Có lỗi xảy ra khi tải chi tiết điểm danh");
        res.redirect("back");
    }
};

// [PATCH] /admin/attendance/edit-attendance/:id
module.exports.editAttendancePatch = async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const userId = res.locals.user._id;
        const { attendance_data, notes } = req.body;

        const attendance = await Attendance.findOne({ 
            _id: attendanceId,
            instructor_id: userId
        });

        if (!attendance) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không có quyền chỉnh sửa điểm danh này" 
            });
        }

        await Attendance.updateOne(
            { _id: attendanceId },
            { 
                attendance_data: attendance_data,
                notes: notes,
                updated_at: new Date(),
                updated_by: userId
            }
        );

        res.json({ 
            success: true, 
            message: "Cập nhật điểm danh thành công" 
        });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ 
            success: false, 
            message: "Có lỗi xảy ra khi cập nhật điểm danh" 
        });
    }
};

// [DELETE] /admin/attendance/delete-attendance/:id
module.exports.deleteAttendance = async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const userId = res.locals.user._id;

        const attendance = await Attendance.findOne({ 
            _id: attendanceId,
            instructor_id: userId
        });

        if (!attendance) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không có quyền xóa điểm danh này" 
            });
        }

        await Attendance.deleteOne({ _id: attendanceId });

        res.json({ 
            success: true, 
            message: "Xóa điểm danh thành công" 
        });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        res.status(500).json({ 
            success: false, 
            message: "Có lỗi xảy ra khi xóa điểm danh" 
        });
    }
};

// [GET] /admin/attendance/class/:classId/students
module.exports.viewClassStudents = async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = res.locals.user._id;

        // Verify instructor owns this class
        const classData = await Class.findOne({ 
            _id: classId, 
            instructor_id: userId,
            deleted: false 
        })
        .populate('course_id', 'title');

        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học hoặc bạn không có quyền truy cập");
            return res.redirect(`/${systemConfig.prefixAdmin}/attendance`);
        }

        // Get enrolled students
        const enrollments = await Enrollment.find({
            class_id: classId,
            status: "approved"
        })
        .populate('student_id', 'fullName email phone address')
        .sort({ createdAt: -1 });

        res.render("admin/pages/attendance/class-students", {
            pageTitle: "Danh sách học viên",
            classData: classData,
            enrollments: enrollments
        });
    } catch (error) {
        console.error("Error loading class students:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách học viên");
        res.redirect("back");
    }
}; 