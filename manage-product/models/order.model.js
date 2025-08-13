// const mongoose = require("mongoose");

// const OrderSchema = new mongoose.Schema({
//     // user_id: String,
//     cart_id: String,
//     userInfo:{
//         fullName: String,
//         phone: String,
//         address: String
//     },
//     products:[{
//         product_id: String,
//         price: Number,
//         discountPercentage: Number,
//         quantity: Number
//     }]
//     },
//     {timestamps:true}
    
//     );

// const Order = mongoose.model("Order",OrderSchema,"orders");

// module.exports = Order;

// Commented out for course project - no longer needed
const mongoose = require("mongoose");
const Order = mongoose.model("Order", new mongoose.Schema({}), "orders");
module.exports = Order;