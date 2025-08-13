const mongoose = require("mongoose");
const generate = require("../helper/generate");
const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    avatar: String,
    tokenUser:{
        type: String,
        default: generate.generateRandomString(30)
    },
    phone: String,
    friendList: [
        {
          user_id: String,
          room_chat_id: String
        }
    ],
    statusOnline: String,
    acceptFriends: Array,
    requestFriends: Array,
    status: {
        type: String,
        default: "active"
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    },
    {timestamps:true}
    
    );

const User = mongoose.model("User",userSchema,"users");

module.exports = User;