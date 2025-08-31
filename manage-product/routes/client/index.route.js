const coursesRoutes = require("./courses.route");
const cartRoutes = require("./cart.route");
const checkoutRoutes = require("./checkout.route");
const enrollmentsRoutes = require("./enrollments.route");
const userRoutes = require("./user.route");
const livestreamRoutes = require("./livestream.route");
const authController = require("../../controllers/client/auth.controller");
const chatbotRoute = require("./chatbot.route");
const reviewRoute = require("./review.route");
const authMiddleware = require("../../middlewares/client/auth.middleware");

module.exports = (app) => {
    const PATH_API = "/api";
    // Direct verification link without /api prefix for email clicks
    app.get("/verify-email", authController.verifyEmail);
    app.use(PATH_API, coursesRoutes);
    app.use(PATH_API, cartRoutes);
    app.use(PATH_API, checkoutRoutes);
    app.use(PATH_API, enrollmentsRoutes);
    app.use(PATH_API, userRoutes);
    app.use(PATH_API + "/livestream", livestreamRoutes);
    app.use(PATH_API + "/chatbot", chatbotRoute);
    app.use(PATH_API + "/review",reviewRoute);
};


