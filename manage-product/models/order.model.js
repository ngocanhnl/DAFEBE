const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        class_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        discountPercentage: {
            type: Number,
            default: 0
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    enrollmentList:[{
        enrollment_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Enrollment',
        },
    }],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled'],
        default: 'pending'
    },
    payment_method: {
        type: String,
        default: 'vnpay'
    },
    vnp_TxnRef: String, // Thêm field này để lưu mã giao dịch VNPay
    vnpay_transaction_id: String,
    vnpay_response_code: String,
    vnpay_secure_hash: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Order = mongoose.model("Order", OrderSchema, "orders");
module.exports = Order;