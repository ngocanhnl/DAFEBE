const mongoose = require("mongoose");

const revenueSchema = new mongoose.Schema({
    date: Date,
    course_id: String,
    class_id: String,
    instructor_id: String,
    enrollment_id: String,
    student_id: String,
    amount: Number,
    discount_amount: Number,
    net_amount: Number,
    payment_method: String,
    transaction_id: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    notes: String,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const Revenue = mongoose.model("Revenue",revenueSchema,"revenues");

module.exports = Revenue; 