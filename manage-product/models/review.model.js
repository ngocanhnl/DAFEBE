const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    course_id: String,
    student_id: String,
    class_id: String, // Nếu đánh giá cho lớp cụ thể
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: String,
    images: [String], // URLs của hình ảnh đính kèm
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approved_by: String, // ID của admin duyệt
    approved_date: Date,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const Review = mongoose.model("Review",reviewSchema,"reviews");

module.exports = Review; 