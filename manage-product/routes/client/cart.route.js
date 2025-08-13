const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/cart.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");

router.get("/cart", requireUser, controller.getCart);
router.post("/cart", requireUser, controller.addToCart);
router.delete("/cart/:class_id", requireUser, controller.removeFromCart);
router.delete("/cart", requireUser, controller.clearCart);

module.exports = router;


