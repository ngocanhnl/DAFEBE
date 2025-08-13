const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class", 
        required: true
      },
    session_date: Date,
    instructor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account", // tên model khóa học bạn đã tạo bằng mongoose.model("Course", ...)
        required: true
      }, // ID của giáo viên điểm danh
    students: [{
        student_id: String,
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'excused'],
            default: 'absent'
        },
        check_in_time: Date,
        notes: String
    }],
    session_number: Number, // Số buổi học thứ mấy
    session_topic: String, // Chủ đề buổi học
    notes: String, // Ghi chú của giáo viên
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const Attendance = mongoose.model("Attendance",attendanceSchema,"attendances");

module.exports = Attendance; 