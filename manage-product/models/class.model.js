const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course", // tên model khóa học bạn đã tạo bằng mongoose.model("Course", ...)
        required: true
      },
      instructor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account", // hoặc "Instructor" nếu bạn đặt tên model như vậy
        required: true
      },
    class_name: String,
    start_date: Date,
    end_date: Date,
    
    schedule: [{
        day_of_week: Number, // 0-6 (Chủ nhật - Thứ 7)
        start_time: String, // Format: "HH:MM"
        end_time: String,
        room: String
    }],
    max_students: Number,
    current_students: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    price: Number,
    discountPercentage: Number,
    description: String,
    location: String,
    instructor_history: [{
        instructor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account"
        },
        assigned_date: Date,
        removed_date: Date,
        reason: String,
        assigned_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account"
        }
    }],
    // Thêm trường lessons
    lessons: [{
        lesson_name: { type: String, required: true },
        content: { type: String },
        video_url: { type: String }
    }],
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const Class = mongoose.model("Class",classSchema,"classes");

module.exports = Class; 