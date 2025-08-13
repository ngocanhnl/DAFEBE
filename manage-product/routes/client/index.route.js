const coursesRoutes = require("./courses.route");
const cartRoutes = require("./cart.route");
const checkoutRoutes = require("./checkout.route");
const enrollmentsRoutes = require("./enrollments.route");
const userRoutes = require("./user.route");

module.exports = (app) => {
    const PATH_API = "/api";
    app.use(PATH_API, coursesRoutes);
    app.use(PATH_API, cartRoutes);
    app.use(PATH_API, checkoutRoutes);
    app.use(PATH_API, enrollmentsRoutes);
    app.use(PATH_API, userRoutes);
};


