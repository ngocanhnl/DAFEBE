
const mongoose = require("mongoose");
const axios = require("axios");
const Course = require("../models/course.model");
const { v4: uuidv4 } = require("uuid");
const CourseCategory = require("../models/course-category.model");
const Class = require("../models/class.model");
const Account = require("../models/account.model");
// ================== CONFIG ==================
const MONGO_URI = "mongodb://localhost:27017/products-test"; // chỉnh lại DB nếu khác
const QDRANT_API_URL =
  "https://17287bcd-e993-4bf8-b129-b587d76d47c8.eu-central-1-0.aws.cloud.qdrant.io"; // endpoint Qdrant Cloud
const QDRANT_COLLECTION = "chatbot_vectors"; // tên collection trong Qdrant
const QDRANT_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LWyQxpLjxPQoQITJfMW78hirBFKsYbuvPJjZ-RNE22I"; // 🔑 thay bằng key Qdrant của bạn

const GEMINI_API_KEY = "AIzaSyDzX5cVtr1g--VOPTBbuysgNBJAeiMiTwM"; // 🔑 thay bằng key Gemini của bạn

// ================== Xóa toàn bộ dữ liệu cũ trong Qdrant ==================
async function resetCollection() {
  try {
    // Xóa collection cũ nếu tồn tại
    await axios.delete(`${QDRANT_API_URL}/collections/${QDRANT_COLLECTION}`, {
      headers: { "api-key": QDRANT_API_KEY }
    });
    console.log("🗑 Đã xóa collection cũ");

    // Tạo lại collection mới
    await axios.put(
      `${QDRANT_API_URL}/collections/${QDRANT_COLLECTION}`,
      {
        vectors: { size: 768, distance: "Cosine" }
      },
      { headers: { "api-key": QDRANT_API_KEY } }
    );
    console.log("✅ Collection mới đã được tạo");
  } catch (err) {
    console.error("❌ Lỗi reset collection:", err.response?.data || err.message);
  }
}

// ================== Hàm gọi embedding từ Gemini ==================
async function embedText(text) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        model: "models/text-embedding-004",
        content: { parts: [{ text }] }
      }
    );
    return res.data.embedding?.values || [];
  } catch (err) {
    console.error("❌ Lỗi embedding:", err.response?.data || err.message);
    return [];
  }
}

// ================== Đồng bộ dữ liệu lên Qdrant ==================
async function syncCoursesToQdrant() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected MongoDB");

    // Reset collection (xóa và tạo mới)
    await resetCollection();

    // Lấy tất cả class kèm thông tin course và instructor
    const classes = await Class.find({ deleted: false })
      .populate("course_id")
      .populate("instructor_id");

    console.log(`📚 Tìm thấy ${classes.length} lớp học`);

    for (const cls of classes) {
      const course = cls.course_id;
      if (!course) continue;

      const category = await CourseCategory.findById(course.course_category_id);
      const instructor = cls.instructor_id;
      const mergedDescription = [
        course.description,
        cls.description
      ].filter(Boolean).join(" "); // chỉ lấy phần nào có dữ liệu, nối cách nhau 1 dấu cách


      // Tạo description phong phú
      const description = `
        Khóa học: ${course.title}
        Danh mục: ${category ? category.title : "Chưa rõ"}
        Giá: ${cls.price || course.price || "Chưa có"}
        Mã lớp: ${cls._id}
        Tên lớp: ${cls.class_name}
        Thời gian: từ ${cls.start_date?.toLocaleDateString() || "?"} đến ${cls.end_date?.toLocaleDateString() || "?"}
        Lịch học: ${(cls.schedule || []).map(s => `Thứ ${s.day_of_week}, ${s.start_time}-${s.end_time} tại ${s.room}`).join("; ") || "Chưa cập nhật"}
        Số học viên hiện tại: ${cls.current_students}/${cls.max_students}
        Giáo viên: ${instructor ? instructor.full_name : "Chưa rõ"}
        Mô tả: ${mergedDescription || "Không có mô tả"}
      `;
//Mô tả: ${course.description || cls.description || "Không có mô tả"}
      const vector = await embedText(description);
      if (!vector.length) continue;

      const payload = {
        mongo_class_id: cls._id.toString(),
        mongo_course_id: course._id.toString(),
        title: course.title,
        class_name: cls.class_name,
        description: course.description,
        category: category ? category.title : null,
        price: cls.price || course.price,
        schedule: cls.schedule,
        instructor_name: instructor ? instructor.full_name : null,
        current_students: cls.current_students,
        max_students: cls.max_students,
        start_date: cls.start_date,
        end_date: cls.end_date
      };

      await axios.put(
        `${QDRANT_API_URL}/collections/${QDRANT_COLLECTION}/points`,
        { points: [{ id: uuidv4(), vector, payload }] },
        { headers: { "api-key": QDRANT_API_KEY } }
      );

      console.log(`✅ Đã đồng bộ lớp: ${cls.class_name} (${course.title})`);
    }
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

if (require.main === module) {
  syncCoursesToQdrant();
}

module.exports = { syncCoursesToQdrant };


