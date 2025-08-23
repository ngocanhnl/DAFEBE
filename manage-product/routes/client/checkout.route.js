const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/checkout.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");

router.get("/checkout/preview", requireUser, controller.preview);
router.post("/checkout/place-order", requireUser, controller.placeOrder);

router.get("/vnpay-return", controller.vnpayReturn); // Route mới cho vnpay-return

module.exports = router;


