# Tóm tắt chức năng & luồng hoạt động hệ thống DAFEBE

## 1. Quản lý khóa học
- Tạo, sửa, xóa, duyệt khóa học (admin)
- Học viên xem danh sách, chi tiết, đăng ký khóa học
- Lớp học liên kết với khóa học, quản lý lịch học, giáo viên, trạng thái

## 2. Đăng ký & thanh toán
- Học viên đăng ký lớp, thêm vào giỏ hàng, thanh toán
- Quản lý đơn hàng, trạng thái thanh toán

## 3. Livestream lớp học
- Giáo viên phát livestream từ trang quản lý (admin) qua WebRTC + socket.io
- Học viên xem livestream từ phía client

## 4. Chatbot tư vấn khóa học
- Chatbot tích hợp Gemini + Qdrant
- Học viên hỏi đáp về khóa học, chatbot trả lời thông minh dựa trên dữ liệu và AI
- Vector hóa dữ liệu khóa học, lưu vào Qdrant để tìm kiếm liên quan

## 5. Đánh giá & bình luận khóa học
- Học viên chỉ được đánh giá/bình luận các khóa học đã đăng ký (kiểm tra qua enrollment)
- Hiển thị danh sách đánh giá, mỗi học viên chỉ đánh giá 1 lần/khóa học

## 6. Chuyển lớp
- Học viên gửi yêu cầu chuyển lớp
- Luồng duyệt: Học viên gửi → admin duyệt (pending_admin_approval) → giáo viên duyệt (pending_teacher_approval) → hoàn tất
- Giao diện hiển thị nút duyệt cho admin/giáo viên theo trạng thái

## 7. Quản lý người dùng
- Đăng ký, đăng nhập, xác thực email, đổi mật khẩu
- Quản lý thông tin cá nhân, phân quyền (admin, giáo viên, học viên)

## 8. Tổng quan luồng hoạt động
- Học viên đăng ký tài khoản, đăng nhập
- Xem, đăng ký, thanh toán khóa học
- Tham gia lớp học, xem livestream, đánh giá khóa học
- Giao tiếp với chatbot để được tư vấn
- Gửi yêu cầu chuyển lớp nếu cần, chờ admin/giáo viên duyệt
- Admin quản lý toàn bộ hệ thống, duyệt các yêu cầu, thống kê

---

**Lưu ý:**
- Hệ thống sử dụng Node.js/Express cho backend, React cho frontend, MongoDB cho dữ liệu, Qdrant cho lưu vector, Gemini cho AI.
- Các API đều có xác thực, phân quyền rõ ràng.
- Có thể mở rộng thêm các chức năng khác theo nhu cầu.
