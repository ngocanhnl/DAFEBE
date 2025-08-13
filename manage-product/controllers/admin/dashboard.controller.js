const CourseCategory = require("../../models/course-category.model");
const Course = require("../../models/course.model");
const Account = require("../../models/account.model");
const User = require("../../models/user.model");


//[GET] /admin/dashboard
module.exports.dashboard = async (req, res) => {
    const statistic = {
      categoryCourse: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      course: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      account: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      user: {
        total: 0,
        active: 0,
        inactive: 0,
      },
    };
  
    statistic.categoryCourse.total = await CourseCategory.count({
      deleted: false
    });
  
    statistic.categoryCourse.active = await CourseCategory.count({
      status: "active",
      deleted: false
    });
  
    statistic.categoryCourse.inactive = await CourseCategory.count({
      status: "inactive",
      deleted: false
    });

    statistic.course.total = await Course.count({
      deleted: false
    });
  
    statistic.course.active = await Course.count({
      status: "active",
      deleted: false
    });
  
    statistic.course.inactive = await Course.count({
      status: "inactive",
      deleted: false
    });

    statistic.account.total = await Account.count({
      deleted: false
    });
  
    statistic.account.active = await Account.count({
      status: "active",
      deleted: false
    });
  
    statistic.account.inactive = await Account.count({
      status: "inactive",
      deleted: false
    });

    statistic.user.total = await User.count({
      deleted: false
    });
  
    statistic.user.active = await User.count({
      status: "active",
      deleted: false
    });
  
    statistic.user.inactive = await User.count({
      status: "inactive",
      deleted: false
    });
    
    res.render("admin/pages/dashboard/index", {
        
        pageTitle: "Tổng quan",
        statistic: statistic  
    });
}