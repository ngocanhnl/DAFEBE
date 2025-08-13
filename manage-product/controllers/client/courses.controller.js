const Course = require("../../models/course.model");
const CourseCategory = require("../../models/course-category.model");
const ClassModel = require("../../models/class.model");

function buildPagination(page, limit, total) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { page, limit, total, totalPages };
}

module.exports.listCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(50, parseInt(req.query.limit) || 12);
        const skip = (page - 1) * limit;

        const find = { deleted: false, status: "active" };
        if (req.query.keyword) {
            find.title = { $regex: req.query.keyword, $options: "i" };
        }
        if (req.query.category_id) {
            find.course_category_id = req.query.category_id;
        }

        const [total, courses] = await Promise.all([
            Course.countDocuments(find),
            Course.find(find).sort({ position: -1, createdAt: -1 }).skip(skip).limit(limit)
        ]);

        return res.json({ success: true, data: courses, pagination: buildPagination(page, limit, total) });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to list courses", error: error.message });
    }
};

module.exports.getCourseDetail = async (req, res) => {
    try {
        const slugOrId = req.params.id;
        const find = slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId };
        const course = await Course.findOne({ ...find, deleted: false, status: { $ne: "inactive" } });
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const classes = await ClassModel.find({ course_id: course._id, deleted: false, status: { $in: ["upcoming", "ongoing", "completed"] } })
            .select("class_name start_date end_date schedule max_students current_students status price discountPercentage location");

        return res.json({ success: true, data: { course, classes } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get course detail", error: error.message });
    }
};

module.exports.listCategories = async (req, res) => {
    try {
        const categories = await CourseCategory.find({ deleted: false, status: "active" }).sort({ position: 1 });
        return res.json({ success: true, data: categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to list categories", error: error.message });
    }
};

module.exports.listClassesByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const classes = await ClassModel.find({ course_id: courseId, deleted: false })
            .select("class_name start_date end_date schedule max_students current_students status price discountPercentage location lessons")
            .sort({ start_date: 1 });
        return res.json({ success: true, data: classes });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to list classes", error: error.message });
    }
};


