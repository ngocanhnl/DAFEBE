# Chức năng Yêu cầu Chuyển Lớp Học (Đã Cập Nhật)

## Tổng quan
Chức năng này cho phép học viên yêu cầu chuyển từ lớp học hiện tại sang lớp học khác cùng khóa học, với quy trình duyệt 2 bước: Admin duyệt yêu cầu, sau đó giáo viên duyệt học viên vào lớp (nếu lớp đang diễn ra).

## Quy trình mới (2 bước duyệt)

### Bước 1: Admin duyệt yêu cầu chuyển lớp
- **Lớp chưa bắt đầu**: Admin duyệt → Học viên được chuyển trực tiếp
- **Lớp đang diễn ra**: Admin duyệt → Học viên chờ giáo viên duyệt (trạng thái `pending_teacher_approval`)

### Bước 2: Giáo viên duyệt học viên vào lớp (chỉ cho lớp đang diễn ra)
- Giáo viên vào trang "Danh sách học viên" của lớp
- Thấy danh sách học viên chờ duyệt
- Duyệt hoặc từ chối với ghi chú

## Các trạng thái mới

### Trạng thái transfer_request:
- `pending`: Chờ admin duyệt
- `pending_teacher_approval`: Đã được admin duyệt, chờ giáo viên duyệt
- `approved`: Đã được duyệt hoàn toàn
- `rejected`: Bị từ chối

### Trạng thái enrollment:
- `pending_teacher_approval`: Học viên chờ giáo viên duyệt vào lớp

## Tính năng chính

### 1. Phía Học viên (Frontend React)
- **Hiển thị trạng thái mới**: `pending_teacher_approval`
- **Thông báo rõ ràng**: Giải thích quy trình 2 bước duyệt
- **Hiển thị trạng thái lớp**: "Đang diễn ra" trong danh sách lớp có thể chuyển đến

### 2. Phía Admin (Backend Admin)
- **Duyệt yêu cầu chuyển lớp**: Xử lý bước 1
- **Tự động tạo enrollment**: Nếu lớp đang diễn ra, tạo enrollment mới với trạng thái `pending_teacher_approval`
- **Quản lý yêu cầu**: Xem danh sách theo trạng thái mới

### 3. Phía Giáo viên (Backend Admin)
- **Xem học viên chờ duyệt**: Trong trang danh sách học viên của lớp
- **Duyệt/từ chối học viên**: Với ghi chú
- **Phân quyền**: Chỉ giáo viên phụ trách mới được duyệt

## Cấu trúc Database đã cập nhật

### Model Enrollment
```javascript
status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'pending_teacher_approval'],
    default: 'pending'
},
transfer_request: {
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'pending_teacher_approval'],
        default: 'pending'
    },
    approved_by: { type: ObjectId, ref: 'Account' },
    teacher_approved_by: { type: ObjectId, ref: 'Account' },
    teacher_approved_date: Date,
    teacher_notes: String
}
```

## API Endpoints mới

### Admin APIs
```
POST /admin/classes/:id/approve-student/:enrollmentId
- Duyệt học viên vào lớp (giáo viên)

POST /admin/classes/:id/reject-student/:enrollmentId  
- Từ chối học viên vào lớp (giáo viên)
```

## Quy trình hoạt động chi tiết

### 1. Học viên gửi yêu cầu chuyển lớp
1. Chọn lớp đích và nhập lý do
2. Hệ thống kiểm tra trạng thái lớp đích:
   - **Lớp chưa bắt đầu**: Trạng thái `pending`
   - **Lớp đang diễn ra**: Trạng thái `pending_teacher_approval`

### 2. Admin duyệt yêu cầu
1. Admin vào "Quản lý yêu cầu chuyển lớp"
2. Duyệt yêu cầu → Cập nhật trạng thái
3. **Nếu lớp đang diễn ra**: Tạo enrollment mới với trạng thái `pending_teacher_approval`

### 3. Giáo viên duyệt học viên (chỉ cho lớp đang diễn ra)
1. Giáo viên vào "Danh sách học viên" của lớp
2. Thấy danh sách học viên chờ duyệt
3. Duyệt hoặc từ chối với ghi chú
4. Cập nhật trạng thái enrollment thành `approved` hoặc `rejected`

## Views Admin đã cập nhật

### 1. transfer-requests.pug
- Thêm filter "Chờ giáo viên duyệt"
- Hiển thị người duyệt và thời gian duyệt
- Hiển thị trạng thái `pending_teacher_approval`

### 2. transfer-request-detail.pug
- Hiển thị thông tin giáo viên duyệt
- Thông báo hướng dẫn cho admin
- Hiển thị ghi chú của giáo viên

### 3. students.pug (danh sách học viên)
- Chia thành 2 phần: Học viên đã duyệt và Học viên chờ duyệt
- Nút duyệt/từ chối cho học viên chờ duyệt
- Modal nhập ghi chú

## Components React đã cập nhật

### ClassTransfer.js
- Hiển thị trạng thái `pending_teacher_approval`
- Thông báo rõ ràng về quy trình 2 bước
- Hiển thị trạng thái lớp trong danh sách

## Validation Rules

### Khi gửi yêu cầu
- Học viên phải đã đăng ký và được duyệt vào lớp hiện tại
- Lớp đích phải cùng khóa học với lớp hiện tại
- Lớp đích phải còn chỗ (bao gồm cả học viên chờ duyệt)
- Học viên chưa có yêu cầu chuyển lớp đang chờ duyệt

### Khi admin duyệt
- Yêu cầu phải ở trạng thái "pending"
- Lớp đích vẫn phải còn chỗ

### Khi giáo viên duyệt
- Enrollment phải ở trạng thái "pending_teacher_approval"
- Chỉ giáo viên phụ trách mới được duyệt
- Lớp vẫn phải còn chỗ

## Lưu ý quan trọng

1. **Phân quyền rõ ràng**: Admin duyệt yêu cầu, giáo viên duyệt học viên
2. **Trạng thái mới**: `pending_teacher_approval` cho cả transfer_request và enrollment
3. **Tự động tạo enrollment**: Khi admin duyệt yêu cầu chuyển đến lớp đang diễn ra
4. **Ghi chú riêng biệt**: Admin notes và teacher notes
5. **UI/UX tốt**: Thông báo rõ ràng cho học viên về quy trình

## Troubleshooting

### Lỗi thường gặp
1. **"Bạn không có quyền duyệt"**: Kiểm tra xem có phải giáo viên phụ trách không
2. **"Lớp học đã đầy"**: Kiểm tra lại số lượng học viên hiện tại và chờ duyệt
3. **"Không tìm thấy yêu cầu đăng ký hợp lệ"**: Kiểm tra trạng thái enrollment

### Debug
- Kiểm tra trạng thái `pending_teacher_approval` trong database
- Xem logs để kiểm tra quy trình tạo enrollment
- Kiểm tra quyền giáo viên trong class.instructor_id
