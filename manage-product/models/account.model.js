const mongoose = require("mongoose");
const generate = require("../helper/generate");
const accountSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    avatar: String,
    token:{
        type: String,
        default: generate.generateRandomString(30)
    },
    phone: String,
    role_id: String,
    status: String,
    email_verified: {
        type: Boolean,
        default: false
    },
    phone_verified: {
        type: Boolean,
        default: false
    },
    email_verification_token: String,
    phone_verification_otp: String,
    otp_expires_at: Date,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const Account = mongoose.model("Account",accountSchema,"accounts");

module.exports = Account;