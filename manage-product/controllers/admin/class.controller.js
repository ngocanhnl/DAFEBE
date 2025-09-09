

const Class = require("../../models/class.model");
const Course = require("../../models/course.model");
const Account = require("../../models/account.model");
const Enrollment = require("../../models/enrollment.model");
const Role = require("../../models/role.model");
const systemConfig = require("../../config/system");
const deleteFileFromCloudinary = require("../../helper/deleteFileFromCloudinary");
const { default: mongoose } = require("mongoose");

// [GET] /admin/classes/:id/chat
module.exports.viewChat = async (req, res) => {
    try {
        const id = req.params.id;
        const classData = await Class.findById(id)
            .populate('course_id', 'title')
            .populate('instructor_id', 'fullName email');
        if (!classData) {
            req.flash('error', 'Không tìm thấy lớp học');
            return res.redirect('back');
        }
        res.render('admin/pages/classes/chat', {
            pageTitle: `Chat lớp - ${classData.class_name}`,
            classData
        });
    } catch (error) {
        console.error('Error viewChat:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('back');
    }
};

// [GET] /admin/classes
module.exports.index = async (req, res) => {
    try {
        // Build filter query
        const filterQuery = { deleted: false };
        
        if (req.query.course_id) {
            filterQuery.course_id = req.query.course_id;
        }
        
        if (req.query.status) {
            filterQuery.status = req.query.status;
        }
        const teacherRole = await Role.findOne({ title: "teacher" });

        if (teacherRole && res.locals.user.role_id.toString() === teacherRole._id.toString()) {
            filterQuery.instructor_id = res.locals.user._id;
        }
        console.log("User role_id:", res.locals.user.role_id.toString());
        console.log("Teacher role_id:", teacherRole._id.toString());


        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        
        const totalClasses = await Class.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalClasses / limit);
        

        const classes = await Class.find(filterQuery)
                                .populate({
                                    path: "course_id",
                                    select: "title" // chỉ lấy trường title của course
                                })
                                .populate({
                                    path: "instructor_id",
                                    select: "fullName" // chỉ lấy trường fullName của instructor
                                })
                                .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
                                .skip(skip)
                                .limit(limit);

        // Tính số học viên hiện tại cho mỗi lớp
        const classesWithEnrollment = await Promise.all(classes.map(async (classItem) => {
            const enrollmentCount = await Enrollment.countDocuments({ 
                class_id: classItem._id, 
                status: "approved" 
            });
            
            return {
                ...classItem.toObject(),
                current_students: enrollmentCount
            };
        }));

        const courses = await Course.find({ deleted: false, status: "active" });

        // Phân trang
       
        const pagination = {
            page: page,
            limit: limit,
            total: totalClasses,
            totalPages: totalPages
        };

        res.render("admin/pages/classes/index", {
            pageTitle: "Quản lý lớp học",
            classes: classesWithEnrollment,
            courses: courses,
            query: req.query,
            pagination: pagination
        });
    } catch (error) {
        console.error("Error fetching classes:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách lớp học");
        res.redirect("back");
    }
};

// [GET] /admin/classes/create
module.exports.create = async (req, res) => {
    try {
        const classId = req.params.id;
        // const classItem = await Class.findById(classId).lean();

        const courses = await Course.find({ deleted: false, status: "active" });
        const teacherRoleId = await Role.findOne({ title: "teacher" });
        console.log("Teacher Role ID:", teacherRoleId);
        const count = await Account.countDocuments({});
console.log("Total accounts in DB:", count);

        const instructors = await Account.find({ 
            deleted: false, 
            status: "active",
            role_id: teacherRoleId._id.toString()

        });
        console.log("Instructors:", instructors);

        const allAccounts = await Account.find({}, "fullName role_id status deleted");
        console.log("All Accounts:", allAccounts.map(a => ({
        fullName: a.fullName,
        role_id: a.role_id.toString(),
        status: a.status,
        deleted: a.deleted
        })));

console.log("Teacher Role ID:", teacherRoleId._id.toString());

        res.render("admin/pages/classes/create", {
            pageTitle: "Chỉnh sửa lớp học",
            // classItem,
            courses,
            instructors
        });
    } catch (error) {
        console.error("Error loading edit form:", error);
        req.flash("error", "Có lỗi xảy ra khi tải form chỉnh sửa lớp học");
        res.redirect("back");
    }
};



// [POST] /admin/classes/create
module.exports.createPost = async (req, res) => {
    console.log("req.body ",req.body)
    const coursePrice = await Course.findOne({_id: req.body.course_id});
    const finalPrice = coursePrice.price - (coursePrice.price * coursePrice.discountPercentage / 100);
    try {
        // Mapping day string -> number
        const dayMap = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };
        
        // Parse schedule fields from req.body
        const scheduleObj = {};
        Object.keys(req.body).forEach(key => {
          const match = key.match(/^schedule\[(\d+)\]\[(\w+)\]$/);
          if (match) {
            const idx = match[1];
            const field = match[2];
            if (!scheduleObj[idx]) scheduleObj[idx] = {};
            scheduleObj[idx][field] = req.body[key];
          }
        });
        
        const scheduleArray = [];
        Object.values(scheduleObj).forEach(item => {
          if (item.day && item.start && item.end) {
            scheduleArray.push({
              day_of_week: dayMap[item.day],
              start_time: item.start,
              end_time: item.end,
              room: item.room || ""
            });
          }
        });
        
        // Kiểm tra nếu không có schedule hợp lệ
        if (scheduleArray.length === 0) {
          req.flash("error", "Vui lòng nhập ít nhất một lịch học!");
          return res.redirect("back");
        }
        
        console.log("Processed schedule:", scheduleArray);
    
        const classData = {
          class_name: req.body.class_name,
          course_id: req.body.course_id,
          instructor_id: req.body.instructor_id,
          max_students: req.body.max_students,
          start_date: req.body.start_date,
          end_date: req.body.end_date,
          schedule: scheduleArray,
          location: req.body.location,
          description: req.body.description,
          price: finalPrice,
          status: req.body.status || "upcoming",
          instructor_history: [{
            instructor_id: req.body.instructor_id,
            assigned_date: new Date(),
            removed_date: null,
            reason: "Phân công giảng viên ban đầu",
            assigned_by: req.user ? req.user.id : null
          }]
        };
    
        const newClass = new Class(classData);
        await newClass.save();
    
        req.flash("success", "Tạo lớp học thành công");
        res.redirect(`/${systemConfig.prefixAdmin}/classes`);
      } catch (error) {
        console.error("Error creating class:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo lớp học");
        res.redirect("back");
      }
};
    
  

// [GET] /admin/classes/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const id = req.params.id;
        const classData = await Class.findOne({ _id: id, deleted: false })
            .populate('course_id')
            .populate('instructor_id', 'fullName email')
            .populate('instructor_history.instructor_id', 'fullName email')
            .populate('instructor_history.assigned_by', 'fullName email');
        
        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học");
            return res.redirect(`/${systemConfig.prefixAdmin}/classes`);
        }

        const courses = await Course.find({ deleted: false, status: "active" });
        const teacherRoleId = await Role.findOne({ title: "teacher" });
        const instructors = await Account.find({ 
            deleted: false, 
            status: "active",
            role_id: teacherRoleId._id
        });

        res.render("admin/pages/classes/edit", {
            pageTitle: "Chỉnh sửa lớp học",
            classItem: classData,
            courses: courses,
            instructors: instructors
        });
    } catch (error) {
        console.error("Error loading edit form:", error);
        req.flash("error", "Có lỗi xảy ra khi tải form chỉnh sửa");
        res.redirect("back");
    }
};

// [PATCH] /admin/classes/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        // Lấy thông tin lớp học hiện tại
        const currentClass = await Class.findOne({ _id: id, deleted: false });
        if (!currentClass) {
            req.flash("error", "Không tìm thấy lớp học");
            return res.redirect(`/${systemConfig.prefixAdmin}/classes`);
        }
        // Parse schedule fields from req.body (tương tự như createPost)
        const dayMap = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };
        const scheduleObj = {};
        Object.keys(req.body).forEach(key => {
          const match = key.match(/^schedule\[(\d+)\]\[(\w+)\]$/);
          if (match) {
            const idx = match[1];
            const field = match[2];
            if (!scheduleObj[idx]) scheduleObj[idx] = {};
            scheduleObj[idx][field] = req.body[key];
          }
        });
        const scheduleArray = [];
        Object.values(scheduleObj).forEach(item => {
          if (item.day && item.start && item.end) {
            scheduleArray.push({
              day_of_week: dayMap[item.day],
              start_time: item.start,
              end_time: item.end,
              room: item.room || ""
            });
          }
        });
        // Tạo object cập nhật
        const updateData = {
          class_name: req.body.class_name,
          course_id: req.body.course_id,
          instructor_id: req.body.instructor_id,
          max_students: req.body.max_students,
          start_date: req.body.start_date,
          end_date: req.body.end_date,
          schedule: scheduleArray,
          location: req.body.location,
          description: req.body.description,
          status: req.body.status || "upcoming"
        };
        // Kiểm tra xem có thay đổi instructor không
        const instructorChanged = currentClass.instructor_id.toString() !== req.body.instructor_id;
        // Cập nhật thông tin lớp học
        await Class.updateOne({ _id: id }, updateData);
        // Nếu có thay đổi instructor, cập nhật removed_date cho instructor cũ và thêm instructor mới vào history
        if (instructorChanged) {
            // Cập nhật removed_date cho instructor cũ (nếu có)
            await Class.updateOne(
                { _id: id, "instructor_history.instructor_id": currentClass.instructor_id },
                { $set: { "instructor_history.$.removed_date": new Date() } }
            );
            // Thêm instructor mới vào history
            const newHistoryEntry = {
                instructor_id: req.body.instructor_id,
                assigned_date: new Date(),
                removed_date: null,
                reason: "Thay đổi giảng viên",
                assigned_by: req.user ? req.user.id : null
            };
            await Class.updateOne(
                { _id: id },
                { $push: { instructor_history: newHistoryEntry } }
            );
            req.flash("success", "Cập nhật lớp học thành công và đã ghi nhận thay đổi giảng viên");
        } else {
            req.flash("success", "Cập nhật lớp học thành công");
        }
        res.redirect(`/${systemConfig.prefixAdmin}/classes`);
    } catch (error) {
        console.error("Error updating class:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật lớp học");
        res.redirect("back");
    }
};

// [GET] /admin/classes/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        const classData = await Class.findOne({ _id: id, deleted: false })
            .populate('course_id')
            .populate('instructor_id', 'fullName email')
            .populate('instructor_history.instructor_id', 'fullName email')
            .populate('instructor_history.assigned_by', 'fullName email');

        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học");
            return res.redirect(`/${systemConfig.prefixAdmin}/classes`);
        }

        // Get enrollment count
        const enrollmentCount = await Enrollment.countDocuments({ 
            class_id: id, 
            status: "approved" 
        });

        // Get recent enrollments
        const recentEnrollments = await Enrollment.find({ 
            class_id: id 
        })
        .populate('student_id', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(5);

        res.render("admin/pages/classes/detail", {
            pageTitle: "Chi tiết lớp học",
            classData: classData,
            enrollmentCount: enrollmentCount,
            recentEnrollments: recentEnrollments
        });
    } catch (error) {
        console.error("Error loading class details:", error);
        req.flash("error", "Có lỗi xảy ra khi tải chi tiết lớp học");
        res.redirect("back");
    }
};

// [GET] /admin/classes/:id/students
module.exports.viewStudents = async (req, res) => {
    try {
        const classId = req.params.id;
        const classData = await Class.findOne({ _id: classId, deleted: false })
            .populate('course_id', 'title');

        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học");
            return res.redirect(`/${systemConfig.prefixAdmin}/classes`);
        }

        // Lấy danh sách học viên đã được duyệt
        const approvedEnrollments = await Enrollment.find({ 
            class_id: classId,
            status: "approved"
        })
        .populate('student_id', 'fullName email phone')
        .sort({ createdAt: -1 });

        // Lấy danh sách học viên chờ giáo viên duyệt
        // const pendingTeacherApprovalEnrollments = await Enrollment.find({ 
        //     target_class_id: classId,
        //     status: "pending_teacher_approval"
        // })
        // .populate('student_id', 'fullName email phone')
        // .sort({ createdAt: -1 });

        const pendingTeacherApprovalEnrollments = await Enrollment.find({ 
            "transfer_request.target_class_id": classId,
            "transfer_request.status": "pending_teacher_approval"
          })
          .populate('student_id', 'fullName email phone')
          .sort({ createdAt: -1 });
          


        res.render("admin/pages/classes/students", {
            pageTitle: "Danh sách học viên",
            classData: classData,
            approvedEnrollments: approvedEnrollments,
            pendingTeacherApprovalEnrollments: pendingTeacherApprovalEnrollments
        });
    } catch (error) {
        console.error("Error loading students:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách học viên");
        res.redirect("back");
    }
};

// [POST] /admin/classes/:id/approve-student/:enrollmentId
module.exports.approveStudent = async (req, res) => {
    try {
        const classId = req.params.id;
        const enrollmentId = req.params.enrollmentId;
        const { teacher_notes } = req.body;

        // Kiểm tra lớp học
        const classData = await Class.findOne({ _id: classId, deleted: false });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học"
            });
        }

        // Kiểm tra quyền (chỉ giáo viên phụ trách mới được duyệt)
        if (classData.instructor_id.toString() !== res.locals.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền duyệt học viên cho lớp này"
            });
        }

        // Kiểm tra enrollment
        //http://localhost:4000/admin/classes/6891a20832d7ea6449076303/approve-student/68a152ca74950daef78abd27
        // const enrollment = await Enrollment.findOne({
        //     _id: enrollmentId,
        //     class_id: classId,
        //     status: "pending_teacher_approval",
        //     deleted: false
        // });

        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
           
      
           
        });
        

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đăng ký hợp lệ"
            });
        }

        // Kiểm tra xem lớp còn chỗ không
        const currentEnrollments = await Enrollment.countDocuments({
            class_id: classId,
            status: "approved",
            deleted: false
        });

        if (currentEnrollments >= classData.max_students) {
            return res.status(400).json({
                success: false,
                message: "Lớp học đã đầy"
            });
        }

        // Duyệt học viên
        await Enrollment.updateOne(
            { _id: enrollmentId },
            {
                status: "approved",
                class_id: classId,
                 "transfer_request.status": "teacher_approval",
                "transfer_request.teacher_approved_by": res.locals.user._id,
                "transfer_request.teacher_approved_date": new Date(),
                "transfer_request.teacher_notes": teacher_notes || ""
            }
        );

        return res.json({
            success: true,
            message: "Đã duyệt học viên thành công"
        });

    } catch (error) {
        console.error("Error approving student:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi duyệt học viên",
            error: error.message
        });
    }
};

// [POST] /admin/classes/:id/reject-student/:enrollmentId
module.exports.rejectStudent = async (req, res) => {
    try {
        const classId = req.params.id;
        const enrollmentId = req.params.enrollmentId;
        const { teacher_notes } = req.body;

        // Kiểm tra lớp học
        const classData = await Class.findOne({ _id: classId, deleted: false });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học"
            });
        }

        // Kiểm tra quyền (chỉ giáo viên phụ trách mới được từ chối)
        if (classData.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền từ chối học viên cho lớp này"
            });
        }

        // Kiểm tra enrollment
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            class_id: classId,
            status: "pending_teacher_approval",
            deleted: false
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đăng ký hợp lệ"
            });
        }

        // Từ chối học viên
        await Enrollment.updateOne(
            { _id: enrollmentId },
            {
                status: "rejected",
                "transfer_request.teacher_approved_by": req.user._id,
                "transfer_request.teacher_approved_date": new Date(),
                "transfer_request.teacher_notes": teacher_notes || ""
            }
        );

        return res.json({
            success: true,
            message: "Đã từ chối học viên"
        });

    } catch (error) {
        console.error("Error rejecting student:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi từ chối học viên",
            error: error.message
        });
    }
};

// [PATCH] /admin/classes/:id/change-instructor
module.exports.changeInstructor = async (req, res) => {
    try {
        const classId = req.params.id;
        const { new_instructor_id, reason } = req.body;

        const classData = await Class.findOne({ _id: classId, deleted: false });
        if (!classData) {
            return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });
        }

        // Add to instructor history
        const historyEntry = {
            instructor_id: classData.instructor_id,
            assigned_date: classData.createdAt,
            removed_date: new Date(),
            reason: reason || "Thay đổi giảng viên",
            assigned_by: req.user.id
        };

        await Class.updateOne(
            { _id: classId },
            { 
                instructor_id: new_instructor_id,
                $push: { instructor_history: historyEntry }
            }
        );

        res.json({ success: true, message: "Thay đổi giảng viên thành công" });
    } catch (error) {
        console.error("Error changing instructor:", error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra khi thay đổi giảng viên" });
    }
};

// [PATCH] /admin/classes/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;

        await Class.updateOne({ _id: id }, { status: status });

        req.flash("success", "Cập nhật trạng thái thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error changing status:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật trạng thái");
        res.redirect("back");
    }
};

// [PATCH] /admin/classes/change-multi
module.exports.changeMulti = async (req, res) => {
    try {
        const { type, ids } = req.body;

        switch (type) {
            case "active":
                await Class.updateMany(
                    { _id: { $in: ids } },
                    { status: "active" }
                );
                req.flash("success", "Kích hoạt thành công các lớp học đã chọn");
                break;
            case "inactive":
                await Class.updateMany(
                    { _id: { $in: ids } },
                    { status: "inactive" }
                );
                req.flash("success", "Vô hiệu hóa thành công các lớp học đã chọn");
                break;
            case "delete":
                await Class.updateMany(
                    { _id: { $in: ids } },
                    { 
                        deleted: true,
                        deletedAt: new Date()
                    }
                );
                req.flash("success", "Xóa thành công các lớp học đã chọn");
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

// [DELETE] /admin/classes/delete/:id
module.exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        await Class.updateOne(
            { _id: id },
            { 
                deleted: true,
                deletedAt: new Date()
            }
        );

        req.flash("success", "Xóa lớp học thành công");
        return res.status(200).json({ message: "Xóa lớp học thành công" });
        // res.redirect("back");
    } catch (error) {
        console.error("Error deleting class:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa lớp học");
        return res.status(500).json({ message: "Có lỗi xảy ra khi xóa lớp học" });
        // res.redirect("back");
    }
}; 

// [GET] /admin/classes/:id/lessons/manage
module.exports.manageLessons = async (req, res) => {
    try {
        const classId = req.params.id;
        const classData = await Class.findById(classId);
        if (!classData) {
            req.flash("error", "Không tìm thấy lớp học");
            return res.redirect("/admin/classes");
        }
        console.log("Class Data:", classData);
        res.render("admin/pages/classes/lessons-manage", {
            pageTitle: "Quản lý bài học",
            classData
        });
    } catch (error) {
        req.flash("error", "Có lỗi xảy ra khi tải danh sách bài học");
        res.redirect("/admin/classes");
    }
};
module.exports.addLesson = async (req, res) => {
  try {
    const classId = req.params.id;
    const { lesson_name, content, video_url } = req.body;

    if (!lesson_name) {
      req.flash("error", "Tên bài học là bắt buộc");
      return res.redirect("back");
    }

    // Lấy file từ middleware
    let fileData = req.lessonFile || null;
    console.log("Uploaded file data:", fileData);

    await Class.updateOne(
      { _id: classId },
      {
        $push: {
          lessons: { lesson_name, content, video_url, file: fileData },
        },
      }
    );

    req.flash("success", "Thêm bài học thành công");
    res.redirect("back");
  } catch (error) {
    console.error("Error adding lesson:", error);
    req.flash("error", "Có lỗi xảy ra khi thêm bài học");
    res.redirect("back");
  }
};

// module.exports.addLesson = async (req, res) => {
//     try {
//       const classId = req.params.id;
//       const { lesson_name, content, video_url, lesson_file  } = req.body;
  
//       if (!lesson_name) {
//         req.flash("error", "Tên bài học là bắt buộc");
//         return res.redirect("back");
//       }

//       let fileData = lesson_file || null;
//     //   if (req.file) {
//     //     // Nếu bạn upload Cloudinary thì ở đây gọi cloudinary.uploader.upload_stream
//     //     fileData = {
//     //       url: `/uploads/${req.file.filename}`, // hoặc link Cloudinary
//     //       original_name: req.file.originalname,
//     //       size: req.file.size,
//     //       format: req.file.mimetype,
//     //     };
//     //   }
  
//       await Class.updateOne(
//         { _id: classId },
//         {
//           $push: {
//             lessons: { lesson_name, content, video_url, file: fileData },
//           },
//         }
//       );
  
//       req.flash("success", "Thêm bài học thành công");
//       res.redirect("back");
//     } catch (error) {
//       console.error("Error adding lesson:", error);
//       req.flash("error", "Có lỗi xảy ra khi thêm bài học");
//       res.redirect("back");
//     }
//   };

// [POST] /admin/classes/:id/lessons/:lessonIndex/edit
module.exports.editLesson = async (req, res) => {
    try {
        const classId = req.params.id;
        const lessonIndex = req.params.lessonIndex;
        const { lesson_name, content, video_url } = req.body;
        if (!lesson_name) {
            req.flash("error", "Tên bài học là bắt buộc");
            return res.redirect("back");
        }
        const classData = await Class.findById(classId);
        if (!classData || !classData.lessons[lessonIndex]) {
            req.flash("error", "Không tìm thấy bài học");
            return res.redirect("back");
        }
        
        // Xử lý file upload
        if (req.body.file) {
            // Xóa file cũ nếu có
            if (classData.lessons[lessonIndex].file && classData.lessons[lessonIndex].file.public_id) {
                try {
                    await deleteFileFromCloudinary(classData.lessons[lessonIndex].file.public_id);
                } catch (error) {
                    console.error('Error deleting old file:', error);
                }
            }
            
            classData.lessons[lessonIndex].file = {
                url: req.body.file.url,
                public_id: req.body.file.public_id,
                format: req.body.file.format,
                size: req.body.file.size,
                original_name: req.body.file.original_name || 'uploaded_file'
            };
        }
        
        classData.lessons[lessonIndex].lesson_name = lesson_name;
        classData.lessons[lessonIndex].content = content;
        classData.lessons[lessonIndex].video_url = video_url;
        await classData.save();
        req.flash("success", "Cập nhật bài học thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error editing lesson:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật bài học");
        res.redirect("back");
    }
};

// [POST] /admin/classes/:id/lessons/:lessonIndex/delete
module.exports.deleteLesson = async (req, res) => {
    try {
        const classId = req.params.id;
        const lessonIndex = req.params.lessonIndex;
        const classData = await Class.findById(classId);
        if (!classData || !classData.lessons[lessonIndex]) {
            req.flash("error", "Không tìm thấy bài học");
            return res.redirect("back");
        }
        
        // Xóa file nếu có
        if (classData.lessons[lessonIndex].file && classData.lessons[lessonIndex].file.public_id) {
            try {
                await deleteFileFromCloudinary(classData.lessons[lessonIndex].file.public_id);
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        }
        
        classData.lessons.splice(lessonIndex, 1);
        await classData.save();
        req.flash("success", "Xóa bài học thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error deleting lesson:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa bài học");
        res.redirect("back");
    }
}; 

// [POST] /admin/classes/:id/lessons/:lessonIndex/delete-file
module.exports.deleteLessonFile = async (req, res) => {
    try {
        const classId = req.params.id;
        const lessonIndex = req.params.lessonIndex;
        const classData = await Class.findById(classId);
        if (!classData || !classData.lessons[lessonIndex]) {
            req.flash("error", "Không tìm thấy bài học");
            return res.redirect("back");
        }
        
        // Xóa file nếu có
        if (classData.lessons[lessonIndex].file && classData.lessons[lessonIndex].file.public_id) {
            try {
                await deleteFileFromCloudinary(classData.lessons[lessonIndex].file.public_id);
                classData.lessons[lessonIndex].file = null;
                await classData.save();
                req.flash("success", "Xóa file thành công");
            } catch (error) {
                console.error('Error deleting file:', error);
                req.flash("error", "Có lỗi xảy ra khi xóa file");
            }
        } else {
            req.flash("error", "Không có file để xóa");
        }
        
        res.redirect("back");
    } catch (error) {
        console.error("Error deleting lesson file:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa file");
        res.redirect("back");
    }
}; 