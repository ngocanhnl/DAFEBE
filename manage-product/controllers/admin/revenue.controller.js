const Revenue = require("../../models/revenue.model");
const Enrollment = require("../../models/enrollment.model");
const Class = require("../../models/class.model");
const Course = require("../../models/course.model");
const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const User = require("../../models/user.model");
const systemConfig = require("../../config/system");

// [GET] /admin/revenue
module.exports.index = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      course_id,
      instructor_id,
      class_id,
      student_id,
      payment_method,
      status,
      group_by,
    } = req.query;

    const effectiveGroupBy = group_by || "daily";

    const filter = { deleted: false };
    if (start_date || end_date) {
      const dateFilter = {};
      if (start_date) dateFilter.$gte = new Date(start_date);
      if (end_date) dateFilter.$lte = new Date(end_date);
      filter.date = dateFilter;
    }
    if (course_id) filter.course_id = course_id;
    if (instructor_id) filter.instructor_id = instructor_id;
    if (class_id) filter.class_id = class_id;
    if (student_id) filter.student_id = student_id;
    if (payment_method) filter.payment_method = payment_method;
    if (status) filter.status = status;

    // Build aggregation per grouping
    const pipeline = [{ $match: filter }];
    const addSort = (sort) => pipeline.push({ $sort: sort });
    const pushGroup = (groupIdExpr) =>
      pipeline.push({
        $group: {
          _id: groupIdExpr,
          total_revenue: { $sum: "$net_amount" },
          enrollment_count: { $sum: 1 },
          avg_revenue: { $avg: "$net_amount" },
        },
      });

    if (effectiveGroupBy === "daily") {
      pushGroup({ $dateToString: { format: "%Y-%m-%d", date: "$date" } });
      addSort({ _id: 1 });
    } else if (effectiveGroupBy === "monthly") {
      pushGroup({ $dateToString: { format: "%Y-%m", date: "$date" } });
      addSort({ _id: 1 });
    } else if (effectiveGroupBy === "yearly") {
      pushGroup({ $dateToString: { format: "%Y", date: "$date" } });
      addSort({ _id: 1 });
    } else if (effectiveGroupBy === "course") {
      pushGroup("$course_id");
      addSort({ total_revenue: -1 });
    } else if (effectiveGroupBy === "instructor") {
      pushGroup("$instructor_id");
      addSort({ total_revenue: -1 });
    } else if (effectiveGroupBy === "class") {
      pushGroup("$class_id");
      addSort({ total_revenue: -1 });
    } else if (effectiveGroupBy === "payment_method") {
      pushGroup("$payment_method");
      addSort({ total_revenue: -1 });
    } else if (effectiveGroupBy === "status") {
      pushGroup("$status");
      addSort({ total_revenue: -1 });
    } else {
      // default fallback to daily
      pushGroup({ $dateToString: { format: "%Y-%m-%d", date: "$date" } });
      addSort({ _id: 1 });
    }

    const revenueAgg = await Revenue.aggregate(pipeline);

    // Prepare label maps
    const [courses, teacherRole, accounts] = await Promise.all([
      Course.find({ deleted: false }).select("_id title").lean(),
      Role.findOne({ title: "teacher" }).select("_id").lean(),
      Account.find({ deleted: false, status: "active" })
        .select("_id fullName role_id")
        .lean(),
    ]);

    const instructors = (teacherRole
      ? accounts.filter((a) => String(a.role_id) === String(teacherRole._id))
      : accounts
    ).map(({ _id, fullName }) => ({ _id, fullName }));

    const courseMap = new Map(courses.map((c) => [String(c._id), c.title]));
    const accountMap = new Map(accounts.map((a) => [String(a._id), a.fullName]));

    // Normalize data for view
    const revenueData = revenueAgg.map((it) => {
      let displayId = it._id;
      if (effectiveGroupBy === "course") displayId = courseMap.get(String(it._id)) || it._id;
      if (effectiveGroupBy === "instructor") displayId = accountMap.get(String(it._id)) || it._id;
      return {
        _id: displayId,
        enrollment_count: it.enrollment_count || 0,
        total_revenue: it.total_revenue || 0,
        avg_revenue: it.avg_revenue || 0,
      };
    });

    // Summary
    const totalRevenueAgg = await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$net_amount" } } },
    ]);
    const total_revenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;
    const total_enrollments = await Revenue.countDocuments(filter);
    const distinctCourses = await Revenue.distinct("course_id", filter);
    const summary = {
      total_revenue,
      total_enrollments,
      avg_revenue_per_enrollment: total_enrollments > 0 ? total_revenue / total_enrollments : 0,
      total_courses: distinctCourses.length,
    };

    // Chart data
    const chartData = {
      labels: revenueData.map((d) => d._id),
      data: revenueData.map((d) => d.total_revenue),
    };

    // Top performers
    const topCoursesAgg = await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: "$course_id", revenue: { $sum: "$net_amount" }, enrollment_count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);
    const topInstructorsAgg = await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: "$instructor_id", revenue: { $sum: "$net_amount" }, class_count: { $addToSet: "$class_id" } } },
      { $project: { revenue: 1, class_count: { $size: "$class_count" } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);
    const topPerformers = {
      courses: topCoursesAgg.map((c) => ({
        title: courseMap.get(String(c._id)) || c._id,
        enrollment_count: c.enrollment_count || 0,
        revenue: c.revenue || 0,
      })),
      instructors: topInstructorsAgg.map((i) => ({
        name: accountMap.get(String(i._id)) || i._id,
        class_count: i.class_count || 0,
        revenue: i.revenue || 0,
      })),
    };

    // Filter dropdown data
    const [classesList, studentsList, paymentMethods] = await Promise.all([
      Class.find({ deleted: false }).select("_id class_name").lean(),
      User.find({ deleted: false }).select("_id fullName").lean(),
      Revenue.distinct("payment_method", {}),
    ]);

    res.render("admin/pages/revenue/index", {
      pageTitle: "Thống kê doanh thu",
      revenueData,
      summary,
      courses,
      instructors,
      classes: classesList,
      students: studentsList,
      paymentMethods,
      query: req.query,
      chartData,
      topPerformers,
      group_by: effectiveGroupBy,
      pagination: null,
    });
  } catch (error) {
    console.error("Error loading revenue data:", error);
    req.flash("error", "Có lỗi xảy ra khi tải dữ liệu doanh thu");
    res.redirect("back");
  }
};

// [GET] /admin/revenue/statistics
module.exports.statistics = async (req, res) => {
    try {
        const { period } = req.query; // monthly, yearly
        const currentDate = new Date();
        
        let startDate;
        if (period === 'yearly') {
            startDate = new Date(currentDate.getFullYear(), 0, 1);
        } else {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        }

        // Revenue trend
        const revenueTrend = await Revenue.aggregate([
            {
                $match: {
                    date: { $gte: startDate },
                    deleted: false
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    revenue: { $sum: "$net_amount" },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Top courses
        const topCourses = await Revenue.aggregate([
            {
                $match: {
                    date: { $gte: startDate },
                    deleted: false
                }
            },
            {
                $group: {
                    _id: "$course_id",
                    revenue: { $sum: "$net_amount" },
                    enrollments: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        // Top instructors
        const topInstructors = await Revenue.aggregate([
            {
                $match: {
                    date: { $gte: startDate },
                    deleted: false
                }
            },
            {
                $group: {
                    _id: "$instructor_id",
                    revenue: { $sum: "$net_amount" },
                    enrollments: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "accounts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "instructor"
                }
            },
            { $unwind: "$instructor" },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        res.render("admin/pages/revenue/statistics", {
            pageTitle: "Thống kê chi tiết",
            revenueTrend: revenueTrend,
            topCourses: topCourses,
            topInstructors: topInstructors,
            period: period || 'monthly'
        });
    } catch (error) {
        console.error("Error generating statistics:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo thống kê");
        res.redirect("back");
    }
};

// [GET] /admin/revenue/export
module.exports.exportData = async (req, res) => {
    try {
        const { start_date, end_date, course_id, instructor_id } = req.query;

        let filter = { deleted: false };
        
        if (start_date && end_date) {
            filter.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }
        
        if (course_id) filter.course_id = course_id;
        if (instructor_id) filter.instructor_id = instructor_id;

        const revenueData = await Revenue.find(filter)
            .populate('course_id', 'title')
            .populate('instructor_id', 'fullName')
            .populate('student_id', 'fullName email')
            .populate('class_id', 'class_code')
            .sort({ date: -1 });

        // Generate CSV data
        const csvData = revenueData.map(item => ({
            Date: item.date.toLocaleDateString('vi-VN'),
            Course: item.course_id?.title || 'N/A',
            Instructor: item.instructor_id?.fullName || 'N/A',
            Student: item.student_id?.fullName || 'N/A',
            Class: item.class_id?.class_code || 'N/A',
            Amount: item.amount,
            Discount: item.discount_amount,
            Net_Amount: item.net_amount,
            Payment_Method: item.payment_method,
            Status: item.status
        }));

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=revenue_data.csv');

        // Convert to CSV
        const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        res.send(csv);
    } catch (error) {
        console.error("Error exporting revenue data:", error);
        req.flash("error", "Có lỗi xảy ra khi xuất dữ liệu");
        res.redirect("back");
    }
};

// [GET] /admin/revenue/by-course
module.exports.byCourse = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let filter = { deleted: false };
        
        if (start_date && end_date) {
            filter.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        const courseRevenue = await Revenue.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$course_id",
                    total_revenue: { $sum: "$net_amount" },
                    total_enrollments: { $sum: 1 },
                    avg_amount: { $avg: "$net_amount" }
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },
            { $sort: { total_revenue: -1 } }
        ]);

        res.render("admin/pages/revenue/by-course", {
            pageTitle: "Doanh thu theo khóa học",
            courseRevenue: courseRevenue,
            filters: req.query
        });
    } catch (error) {
        console.error("Error loading course revenue:", error);
        req.flash("error", "Có lỗi xảy ra khi tải doanh thu theo khóa học");
        res.redirect("back");
    }
};

// [GET] /admin/revenue/by-instructor
module.exports.byInstructor = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let filter = { deleted: false };
        
        if (start_date && end_date) {
            filter.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        const instructorRevenue = await Revenue.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$instructor_id",
                    total_revenue: { $sum: "$net_amount" },
                    total_enrollments: { $sum: 1 },
                    avg_amount: { $avg: "$net_amount" }
                }
            },
            {
                $lookup: {
                    from: "accounts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "instructor"
                }
            },
            { $unwind: "$instructor" },
            { $sort: { total_revenue: -1 } }
        ]);

        res.render("admin/pages/revenue/by-instructor", {
            pageTitle: "Doanh thu theo giảng viên",
            instructorRevenue: instructorRevenue,
            filters: req.query
        });
    } catch (error) {
        console.error("Error loading instructor revenue:", error);
        req.flash("error", "Có lỗi xảy ra khi tải doanh thu theo giảng viên");
        res.redirect("back");
    }
};

// [GET] /admin/revenue/by-period
module.exports.byPeriod = async (req, res) => {
    try {
        const { period } = req.query; // daily, monthly, yearly
        const currentDate = new Date();
        
        let startDate;
        if (period === 'yearly') {
            startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
        } else if (period === 'monthly') {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
        } else {
            startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        }

        const periodRevenue = await Revenue.aggregate([
            {
                $match: {
                    date: { $gte: startDate },
                    deleted: false
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" }
                    },
                    revenue: { $sum: "$net_amount" },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        res.render("admin/pages/revenue/by-period", {
            pageTitle: "Doanh thu theo thời gian",
            periodRevenue: periodRevenue,
            period: period || 'monthly'
        });
    } catch (error) {
        console.error("Error loading period revenue:", error);
        req.flash("error", "Có lỗi xảy ra khi tải doanh thu theo thời gian");
        res.redirect("back");
    }
};

// [GET] /admin/revenue/top-courses
module.exports.topCourses = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topCourses = await Revenue.aggregate([
            { $match: { deleted: false } },
            {
                $group: {
                    _id: "$course_id",
                    total_revenue: { $sum: "$net_amount" },
                    total_enrollments: { $sum: 1 },
                    avg_amount: { $avg: "$net_amount" }
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },
            { $sort: { total_revenue: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.render("admin/pages/revenue/top-courses", {
            pageTitle: "Top khóa học",
            topCourses: topCourses,
            limit: limit
        });
    } catch (error) {
        console.error("Error loading top courses:", error);
        req.flash("error", "Có lỗi xảy ra khi tải top khóa học");
        res.redirect("back");
    }
};

// [GET] /admin/revenue/top-instructors
module.exports.topInstructors = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topInstructors = await Revenue.aggregate([
            { $match: { deleted: false } },
            {
                $group: {
                    _id: "$instructor_id",
                    total_revenue: { $sum: "$net_amount" },
                    total_enrollments: { $sum: 1 },
                    avg_amount: { $avg: "$net_amount" }
                }
            },
            {
                $lookup: {
                    from: "accounts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "instructor"
                }
            },
            { $unwind: "$instructor" },
            { $sort: { total_revenue: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.render("admin/pages/revenue/top-instructors", {
            pageTitle: "Top giảng viên",
            topInstructors: topInstructors,
            limit: limit
        });
    } catch (error) {
        console.error("Error loading top instructors:", error);
        req.flash("error", "Có lỗi xảy ra khi tải top giảng viên");
        res.redirect("back");
    }
}; 

// [GET] /admin/revenue/enrollment-stats
module.exports.enrollmentStats = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      course_id,
      class_id,
      status,
      payment_status,
      group_by,
    } = req.query;

    const effectiveGroupBy = group_by || "monthly";

    const filter = { deleted: false };
    if (start_date || end_date) {
      const dateFilter = {};
      if (start_date) dateFilter.$gte = new Date(start_date);
      if (end_date) dateFilter.$lte = new Date(end_date);
      filter.enrollment_date = dateFilter;
    }
    if (class_id) filter.class_id = class_id;
    if (status) filter.status = status;
    if (payment_status) filter.payment_status = payment_status;

    let classIdsByCourse = null;
    if (course_id) {
      const cls = await Class.find({ deleted: false, course_id }).select("_id");
      classIdsByCourse = cls.map((c) => c._id);
      filter.class_id = { $in: classIdsByCourse };
    }

    const pipeline = [{ $match: filter }];

    const paidSumExpr = {
      $sum: {
        $cond: [{ $eq: ["$payment_status", "paid"] }, { $ifNull: ["$amount_paid", 0] }, 0],
      },
    };
    const paidCountExpr = {
      $sum: { $cond: [{ $eq: ["$payment_status", "paid"] }, 1, 0] },
    };

    if (effectiveGroupBy === "monthly") {
      pipeline.push({
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$enrollment_date" } },
          student_count: { $sum: 1 },
          paid_student_count: paidCountExpr,
          paid_revenue: paidSumExpr,
        },
      });
      pipeline.push({ $sort: { _id: 1 } });
    } else if (effectiveGroupBy === "yearly") {
      pipeline.push({
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$enrollment_date" } },
          student_count: { $sum: 1 },
          paid_student_count: paidCountExpr,
          paid_revenue: paidSumExpr,
        },
      });
      pipeline.push({ $sort: { _id: 1 } });
    } else if (effectiveGroupBy === "class") {
      pipeline.push({
        $group: {
          _id: "$class_id",
          student_count: { $sum: 1 },
          paid_student_count: paidCountExpr,
          paid_revenue: paidSumExpr,
        },
      });
      pipeline.push({ $sort: { paid_revenue: -1 } });
    } else if (effectiveGroupBy === "course") {
      pipeline.push(
        {
          $lookup: {
            from: "classes",
            localField: "class_id",
            foreignField: "_id",
            as: "cls",
          },
        },
        { $unwind: "$cls" },
        { $match: { "cls.deleted": { $ne: true } } },
        {
          $group: {
            _id: "$cls.course_id",
            student_count: { $sum: 1 },
            paid_student_count: paidCountExpr,
            paid_revenue: paidSumExpr,
          },
        },
        { $sort: { paid_revenue: -1 } }
      );
    } else if (effectiveGroupBy === "status") {
      pipeline.push({
        $group: {
          _id: "$status",
          student_count: { $sum: 1 },
          paid_student_count: paidCountExpr,
          paid_revenue: paidSumExpr,
        },
      });
      pipeline.push({ $sort: { student_count: -1 } });
    } else {
      // default monthly
      pipeline.push({
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$enrollment_date" } },
          student_count: { $sum: 1 },
          paid_student_count: paidCountExpr,
          paid_revenue: paidSumExpr,
        },
      });
      pipeline.push({ $sort: { _id: 1 } });
    }

    const agg = await Enrollment.aggregate(pipeline);

    // Label mapping
    const [courses, classes] = await Promise.all([
      Course.find({ deleted: false }).select("_id title").lean(),
      Class.find({ deleted: false }).select("_id class_name").lean(),
    ]);
    const courseMap = new Map(courses.map((c) => [String(c._id), c.title]));
    const classMap = new Map(classes.map((c) => [String(c._id), c.class_name]));

    const data = agg.map((it) => {
      let label = it._id;
      if (effectiveGroupBy === "course") label = courseMap.get(String(it._id)) || it._id;
      if (effectiveGroupBy === "class") label = classMap.get(String(it._id)) || it._id;
      return {
        _id: label,
        student_count: it.student_count || 0,
        paid_student_count: it.paid_student_count || 0,
        paid_revenue: it.paid_revenue || 0,
      };
    });

    // Summary
    const total_students = data.reduce((a, b) => a + (b.student_count || 0), 0);
    const total_paid_students = data.reduce((a, b) => a + (b.paid_student_count || 0), 0);
    const total_revenue = data.reduce((a, b) => a + (b.paid_revenue || 0), 0);

    // Options for filters
    const paymentMethods = await Enrollment.distinct("payment_method");

    res.render("admin/pages/revenue/enrollment", {
      pageTitle: "Thống kê",
      query: req.query,
      data,
      courses,
      classes,
      paymentMethods,
      summary: {
        total_students,
        total_paid_students,
        total_revenue,
      },
      chartData: {
        labels: data.map((d) => d._id),
        students: data.map((d) => d.student_count),
        paidStudents: data.map((d) => d.paid_student_count),
        revenue: data.map((d) => d.paid_revenue),
      },
      group_by: effectiveGroupBy,
    });
  } catch (error) {
    console.error("Error loading enrollment stats:", error);
    req.flash("error", "Có lỗi xảy ra khi tải thống kê ghi danh");
    res.redirect("back");
  }
};