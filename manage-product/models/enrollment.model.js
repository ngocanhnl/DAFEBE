const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // thay 'User' bằng tên model thực tế bạn đang dùng cho người dùng
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    enrollment_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'pending_teacher_approval'],
        default: 'pending'
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    amount_paid: Number,
    payment_date: Date,
    transfer_request: {
        requested: {
            type: Boolean,
            default: false
        },
        requested_date: Date,
        reason: String,
        target_class_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        }, // Lớp học muốn chuyển đến
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'pending_teacher_approval'],
            default: 'pending'
        },
        approved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account'
        }, // ID của admin/giáo viên duyệt
        approved_date: Date,
        teacher_approved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account'
        }, // ID của giáo viên duyệt cuối cùng
        teacher_approved_date: Date,
        notes: String,
        teacher_notes: String // Ghi chú của giáo viên
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const Enrollment = mongoose.model("Enrollment",enrollmentSchema,"enrollments");

module.exports = Enrollment; 