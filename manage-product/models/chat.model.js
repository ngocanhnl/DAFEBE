const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    user_id: String,
    content: String,
    images: Array,
    room_chat_id: String,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
    },
    {timestamps:true}
    
    );

const Chat = mongoose.model("Chat",ChatSchema,"chats");

module.exports = Chat;