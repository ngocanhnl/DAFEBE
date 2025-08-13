const systemConfig = require("../../config/system");
const dashboardRoutes = require("./dashboard.route");
const courseRoutes = require("./course.route");
const courseCategoryRoutes = require("./course-category.route");
const roleRoutes = require("./role.route");
const accountRoutes = require("./account.route");
const authRoutes = require("./auth.route");
const myAccountRoutes = require("./myAccount.route");
const settingRoutes = require("./setting.route");
const classRoutes = require("./class.route");
const enrollmentRoutes = require("./enrollment.route");
const attendanceRoutes = require("./attendance.route");
const revenueRoutes = require("./revenue.route");
const teachingHistoryRoutes = require("./teaching-history.route");


const authMiddleware = require("../../middlewares/admin/auth.middleware");
const authController = require("../../controllers/admin/auth.controller");

module.exports = (app)=>{
    const PATH_ADMIN = "/" + systemConfig.prefixAdmin;

    app.get(PATH_ADMIN, authController.login)

    app.use(PATH_ADMIN + "/dashboard", authMiddleware.requireAuth,dashboardRoutes);

    app.use(PATH_ADMIN + "/courses",authMiddleware.requireAuth,courseRoutes);

    app.use(PATH_ADMIN + "/courses-category",authMiddleware.requireAuth,courseCategoryRoutes);

    app.use(PATH_ADMIN + "/classes",authMiddleware.requireAuth,classRoutes);

    app.use(PATH_ADMIN + "/enrollments",authMiddleware.requireAuth,enrollmentRoutes);

    app.use(PATH_ADMIN + "/attendance",authMiddleware.requireAuth,attendanceRoutes);

    app.use(PATH_ADMIN + "/revenue",authMiddleware.requireAuth,revenueRoutes);

    app.use(PATH_ADMIN + "/roles",authMiddleware.requireAuth,roleRoutes);

    app.use(PATH_ADMIN + "/accounts",authMiddleware.requireAuth,accountRoutes);

    app.use(PATH_ADMIN + "/auth",authRoutes);

    app.use(PATH_ADMIN + "/my-account", authMiddleware.requireAuth, myAccountRoutes);

    app.use(PATH_ADMIN + "/settings", authMiddleware.requireAuth, settingRoutes);

    app.use(PATH_ADMIN + "/teaching-history", authMiddleware.requireAuth, teachingHistoryRoutes);

}