const Review = require('../../models/review.model');
const Enrollment = require('../../models/enrollment.model');

// Lấy đánh giá cho 1 khóa học
exports.listByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log("Course ID:", courseId);
    const reviews = await Review
                            .find({ course_id: courseId, deleted: false, status: 'approved' })
                            .populate('student_id', 'fullName')
                            .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Học viên gửi đánh giá
exports.create = async (req, res) => {
  try {
    const { course_id, rating, comment, images } = req.body;
    console.log(req.body);
    const student_id = req.userClient?._id || req.body.student_id; // req.user nếu có xác thực
    console.log("Student ID:", req.userClient);
    if (!course_id || !student_id || !rating) return res.status(400).json({ success: false, error: 'Thiếu thông tin' });


  // Kiểm tra học viên đã đăng ký lớp nào thuộc khóa học này chưa
  // 1. Lấy danh sách class_id thuộc course_id
  const Class = require('../../models/class.model');
  const classes = await Class.find({ course_id: course_id, deleted: false }).select('_id');
  const classIds = classes.map(c => c._id);
  if (!classIds.length) return res.status(403).json({ success: false, error: 'Khóa học này chưa có lớp nào.' });

  // 2. Kiểm tra enrollment
  const enrolled = await Enrollment.findOne({ student_id, class_id: { $in: classIds } });
  if (!enrolled) return res.status(403).json({ success: false, error: 'Bạn chưa đăng ký khóa học này' });

    // Kiểm tra đã đánh giá chưa (1 học viên chỉ đánh giá 1 lần)
    const existed = await Review.findOne({ course_id, student_id, deleted: false });
    if (existed) return res.status(409).json({ success: false, error: 'Bạn đã đánh giá khóa học này' });

    const review = await Review.create({ course_id, student_id, rating, comment, images });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
