const Cart = require("../../models/cart.model");
const ClassModel = require("../../models/class.model");

async function ensureCart(userId) {
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await Cart.create({ user_id: userId, courses: [] });
    }
    return cart;
}

module.exports.getCart = async (req, res) => {
    try {
        const userId = req.userClient._id.toString();
        const cart = await ensureCart(userId);
        // Enrich items with class info
        const detailed = [];
        for (const item of cart.courses) {
            const classDoc = await ClassModel.findById(item.course_id).select("class_name price discountPercentage start_date status");
            if (classDoc) {
                detailed.push({
                    class_id: classDoc._id,
                    class_name: classDoc.class_name,
                    price: classDoc.price,
                    discountPercentage: classDoc.discountPercentage,
                    start_date: classDoc.start_date,
                    status: classDoc.status,
                    quantity: item.quantity || 1
                });
            }
        }
        return res.json({ success: true, data: { items: detailed } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get cart", error: error.message });
    }
};

module.exports.addToCart = async (req, res) => {
    try {
        const userId = req.userClient._id.toString();
        const { class_id, quantity } = req.body;
        if (!class_id) return res.status(400).json({ success: false, message: "class_id is required" });
        const classDoc = await ClassModel.findOne({ _id: class_id, deleted: false });
        if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

        const cart = await ensureCart(userId);
        const idx = cart.courses.findIndex((i) => i.course_id === class_id);
        if (idx >= 0) {
            cart.courses[idx].quantity = (cart.courses[idx].quantity || 1) + (parseInt(quantity) || 1);
        } else {
            cart.courses.push({ course_id: class_id, quantity: parseInt(quantity) || 1 });
        }
        await cart.save();
        return res.json({ success: true, message: "Added to cart" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to add to cart", error: error.message });
    }
};

module.exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.userClient._id.toString();
        const { class_id } = req.params;
        const cart = await ensureCart(userId);
        cart.courses = cart.courses.filter((i) => i.course_id !== class_id);
        await cart.save();
        return res.json({ success: true, message: "Removed" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to remove item", error: error.message });
    }
};

module.exports.clearCart = async (req, res) => {
    try {
        const userId = req.userClient._id.toString();
        const cart = await ensureCart(userId);
        cart.courses = [];
        await cart.save();
        return res.json({ success: true, message: "Cleared" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to clear cart", error: error.message });
    }
};


