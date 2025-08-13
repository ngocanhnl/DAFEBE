const Order = require("../../models/order.model");
const Cart = require("../../models/cart.model");
const ClassModel = require("../../models/class.model");
const Enrollment = require("../../models/enrollment.model");

async function buildOrderFromCart(cart) {
    const items = [];
    let total = 0;
    for (const item of cart.courses) {
        const classDoc = await ClassModel.findById(item.course_id);
        if (!classDoc) continue;
        const price = classDoc.price || 0;
        const discount = classDoc.discountPercentage || 0;
        const finalPrice = Math.round(price * (1 - discount / 100));
        const qty = item.quantity || 1;
        total += finalPrice * qty;
        items.push({ class_id: classDoc._id, price, discountPercentage: discount, quantity: qty });
    }
    return { items, total };
}

module.exports.preview = async (req, res) => {
    try {
        const userId = req.userClient._id.toString();
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart || cart.courses.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        const summary = await buildOrderFromCart(cart);
        return res.json({ success: true, data: summary });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to preview order", error: error.message });
    }
};

module.exports.placeOrder = async (req, res) => {
    try {
        const user = req.userClient;
        const cart = await Cart.findOne({ user_id: user._id.toString() });
        if (!cart || cart.courses.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        const { items, total } = await buildOrderFromCart(cart);

        const orderDoc = await Order.create({
            user_id: user._id,
            items,
            total,
            status: "paid",
            createdAt: new Date(),
        });

        // Enroll user to classes (mark paid)
        for (const it of items) {
            await Enrollment.create({
                student_id: user._id,
                class_id: it.class_id,
                status: "approved",
                payment_status: "paid",
                amount_paid: Math.round(it.price * (1 - (it.discountPercentage || 0) / 100)) * (it.quantity || 1),
                payment_date: new Date(),
            });
        }

        // Clear cart
        cart.courses = [];
        await cart.save();

        return res.json({ success: true, message: "Payment successful", data: { order_id: orderDoc._id } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to place order", error: error.message });
    }
};


