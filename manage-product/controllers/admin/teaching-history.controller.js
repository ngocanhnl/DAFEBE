const Class = require("../../models/class.model");
const Course = require("../../models/course.model");
const Enrollment = require("../../models/enrollment.model");
const Attendance = require("../../models/attendance.model");
const Review = require("../../models/review.model");
const systemConfig = require("../../config/system");

// [GET] /admin/teaching-history
module.exports.index = async (req, res) => {
  try {
    const userId = res.locals.user._id;

    const { start_date, end_date, course_id } = req.query;

    const filter = {
      deleted: false,
      $or: [
        { instructor_id: userId },
        { "instructor_history.instructor_id": userId },
      ],
    };

    // Date range overlap: class overlaps requested range
    const range = {};
    if (start_date) {
      const s = new Date(start_date);
      s.setHours(0, 0, 0, 0);
      range.$gte = s;
    }
    if (end_date) {
      const e = new Date(end_date);
      e.setHours(23, 59, 59, 999);
      range.$lte = e;
    }
    if (range.$gte || range.$lte) {
      // Overlap condition: class.start_date <= end && class.end_date >= start
      const overlap = [];
      if (range.$lte) overlap.push({ start_date: { $lte: range.$lte } });
      if (range.$gte) overlap.push({ end_date: { $gte: range.$gte } });
      if (overlap.length) filter.$and = overlap;
    }

    if (course_id) {
      filter.course_id = course_id;
    }

    const classes = await Class.find(filter)
      .populate("course_id", "title")
      .sort({ end_date: -1, start_date: -1 })
      .lean();

    // Preload attendance counts per class for rate calculation
    const classIds = classes.map((c) => c._id);

    const [enrollCountsMap, attendanceRatesMap, reviewsMap] = await Promise.all([
      // Enrollment counts
      (async () => {
        const map = new Map();
        await Promise.all(
          classIds.map(async (cid) => {
            const count = await Enrollment.countDocuments({
              class_id: cid,
              status: "approved",
            });
            map.set(String(cid), count);
          })
        );
        return map;
      })(),

      // Average attendance rate per class across sessions
      (async () => {
        const map = new Map();
        await Promise.all(
          classIds.map(async (cid) => {
            const sessions = await Attendance.find({ class_id: cid })
              .select("students")
              .lean();
            if (!sessions || sessions.length === 0) return map.set(String(cid), null);
            let presentOrLate = 0;
            let total = 0;
            for (const s of sessions) {
              const students = Array.isArray(s.students) ? s.students : [];
              total += students.length;
              presentOrLate += students.filter(
                (st) => st.status === "present" || st.status === "late"
              ).length;
            }
            if (total === 0) return map.set(String(cid), null);
            const rate = Math.round((presentOrLate / total) * 100);
            map.set(String(cid), rate);
          })
        );
        return map;
      })(),

      // Average rating per class (approved reviews)
      (async () => {
        const map = new Map();
        await Promise.all(
          classIds.map(async (cid) => {
            const agg = await Review.aggregate([
              { $match: { class_id: String(cid), deleted: false, status: "approved" } },
              { $group: { _id: "$class_id", avg: { $avg: "$rating" }, cnt: { $sum: 1 } } },
            ]);
            if (agg.length === 0) return map.set(String(cid), null);
            map.set(String(cid), agg[0].avg);
          })
        );
        return map;
      })(),
    ]);

    const classesView = classes.map((cls) => {
      const scheduleStr = Array.isArray(cls.schedule)
        ? cls.schedule
            .map((s) => `${s.start_time || ""}-${s.end_time || ""}`)
            .filter(Boolean)
            .join(", ")
        : "";

      const enrolledCount = enrollCountsMap.get(String(cls._id)) || 0;
      const attendanceRate = attendanceRatesMap.get(String(cls._id));
      const avgRating = reviewsMap.get(String(cls._id));

      return {
        _id: cls._id,
        class_code: cls.class_name || "",
        course_id: cls.course_id?._id,
        course_title: cls.course_id?.title || "",
        start_date: cls.start_date,
        end_date: cls.end_date,
        schedule: scheduleStr,
        enrolled_count: enrolledCount,
        max_students: cls.max_students || 0,
        attendance_rate: attendanceRate,
        avg_rating: avgRating,
        location: cls.location || "",
      };
    });

    const summary = {
      total_classes: classesView.length,
      total_students: classesView.reduce((acc, c) => acc + (c.enrolled_count || 0), 0),
    };

    const rated = classesView.map((c) => c.attendance_rate).filter((v) => typeof v === "number");
    if (rated.length > 0) summary.avg_attendance = Math.round(rated.reduce((a, b) => a + b, 0) / rated.length);

    const ratingVals = classesView.map((c) => c.avg_rating).filter((v) => typeof v === "number");
    if (ratingVals.length > 0) summary.avg_rating = Math.round((ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length) * 10) / 10;

    const courses = await Course.find({ deleted: false })
      .select("_id title")
      .lean();

    res.render("admin/pages/teaching-history/index", {
      pageTitle: "Lịch sử giảng dạy",
      query: req.query,
      classes: classesView,
      courses,
      summary,
      chartData: null,
      recentReviews: null,
      insights: null,
    });
  } catch (error) {
    console.error("Error loading teaching history:", error);
    req.flash("error", "Có lỗi xảy ra khi tải lịch sử giảng dạy");
    res.redirect("/" + systemConfig.prefixAdmin + "/attendance");
  }
};

// [GET] /admin/teaching-history/export
module.exports.export = async (req, res) => {
  try {
    // Reuse index filter logic
    req.query = req.query || {};
    const userId = res.locals.user._id;
    const { start_date, end_date, course_id } = req.query;

    const filter = {
      deleted: false,
      $or: [
        { instructor_id: userId },
        { "instructor_history.instructor_id": userId },
      ],
    };

    const range = {};
    if (start_date) {
      const s = new Date(start_date);
      s.setHours(0, 0, 0, 0);
      range.$gte = s;
    }
    if (end_date) {
      const e = new Date(end_date);
      e.setHours(23, 59, 59, 999);
      range.$lte = e;
    }
    if (range.$gte || range.$lte) {
      const overlap = [];
      if (range.$lte) overlap.push({ start_date: { $lte: range.$lte } });
      if (range.$gte) overlap.push({ end_date: { $gte: range.$gte } });
      if (overlap.length) filter.$and = overlap;
    }
    if (course_id) filter.course_id = course_id;

    const classes = await Class.find(filter)
      .populate("course_id", "title")
      .sort({ end_date: -1 })
      .lean();

    const rows = [
      [
        "Class Name",
        "Course",
        "Start Date",
        "End Date",
        "Location",
        "Enrolled/Max",
      ],
    ];

    for (const cls of classes) {
      const enrolled = await Enrollment.countDocuments({ class_id: cls._id, status: "approved" });
      rows.push([
        cls.class_name || "",
        cls.course_id?.title || "",
        cls.start_date ? new Date(cls.start_date).toISOString().slice(0, 10) : "",
        cls.end_date ? new Date(cls.end_date).toISOString().slice(0, 10) : "",
        cls.location || "",
        `${enrolled}/${cls.max_students || 0}`,
      ]);
    }

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=teaching-history.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting teaching history:", error);
    res.status(500).send("Xuất dữ liệu thất bại");
  }
};

// [GET] /admin/teaching-history/:id -> redirect to class detail for now
module.exports.detail = async (req, res) => {
  const id = req.params.id;
  res.redirect(`/${systemConfig.prefixAdmin}/classes/detail/${id}`);
};


