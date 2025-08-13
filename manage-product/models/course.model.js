const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);
const courseSchema = new mongoose.Schema({
    title: String,
    course_category_id:{
        type: String,
        default:""
    },
    description: String,
    content: String,
    price: Number,
    discountPercentage: Number,
    duration: Number, 
    level: String, // Beginner, Intermediate, Advanced
    language: String, // Ngôn ngữ giảng dạy
    instructor: String, // Giảng viên chính
    instructors: [String], // Danh sách giảng viên phụ trách
    instructor_history: [{
        instructor_id: String,
        assigned_date: Date,
        removed_date: Date,
        reason: String,
        assigned_by: String // ID của admin thay đổi
    }],
    thumbnail: String,
    video_intro: String, // Video giới thiệu
    status: String,
    position: Number,
    featured: String,
    slug:{
        type: String,
        slug: "title",
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        account_id: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    updatedBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ],
    deletedBy:{
        account_id: String,
        deletedAt: Date
    }, 
    });

const Course = mongoose.model("Course",courseSchema,"courses");

module.exports = Course; 