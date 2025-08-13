const Enrollment = require("../../models/enrollment.model");
const ClassModel = require("../../models/class.model");

module.exports.myEnrollments = async (req, res) => {
    try {
        const userId = req.userClient._id;
        const enrollments = await Enrollment.find({ student_id: userId, deleted: false })
            .populate({ path: "class_id", select: "class_name lessons start_date end_date status course_id" });
        return res.json({ success: true, data: enrollments });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to list enrollments", error: error.message });
    }
};

module.exports.classDetailWithLessons = async (req, res) => {
    try {
        const classId = req.params.classId;
        const enrollment = await Enrollment.findOne({ student_id: req.userClient._id, class_id: classId, deleted: false, status: { $in: ["approved", "completed"] } });
        if (!enrollment) return res.status(403).json({ success: false, message: "Not enrolled" });

        const classDoc = await ClassModel.findById(classId)
            .select("class_name description lessons start_date end_date schedule location status")
            .populate({ path: "course_id", select: "title thumbnail" });
        if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });
        return res.json({ success: true, data: classDoc });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get class detail", error: error.message });
    }
};


