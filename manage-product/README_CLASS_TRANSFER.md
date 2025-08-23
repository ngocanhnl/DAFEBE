# Chức năng Yêu cầu Chuyển Lớp Học

## Tổng quan
Chức năng này cho phép học viên yêu cầu chuyển từ lớp học hiện tại sang lớp học khác cùng khóa học, với quy trình duyệt từ quản trị viên và giáo viên.

## Tính năng chính

### 1. Phía Học viên (Frontend React)
- **Xem danh sách lớp học có thể chuyển đến**: Hiển thị các lớp cùng khóa học còn chỗ trống
- **Gửi yêu cầu chuyển lớp**: Nhập lý do và chọn lớp đích
- **Theo dõi trạng thái yêu cầu**: Xem yêu cầu đang chờ duyệt, đã duyệt, hoặc bị từ chối
- **Hủy yêu cầu**: Có thể hủy yêu cầu đang chờ duyệt

### 2. Phía Quản trị viên (Backend Admin)
- **Quản lý yêu cầu chuyển lớp**: Xem danh sách tất cả yêu cầu
- **Duyệt/từ chối yêu cầu**: Xử lý yêu cầu với ghi chú
- **Phân quyền duyệt**: 
  - Khóa học chưa bắt đầu: Chỉ cần admin duyệt
  - Khóa học đang diễn ra: Cần giáo viên phụ trách duyệt

## Cấu trúc Database

### Model Enrollment (đã có sẵn)
```javascript
transfer_request: {
    requested: Boolean,
    requested_date: Date,
    reason: String,
    target_class_id: ObjectId,
    status: ['pending', 'approved', 'rejected'],
    approved_by: ObjectId,
    approved_date: Date,
    notes: String
}
```

## API Endpoints

### Client APIs (Học viên)
```
POST /api/enrollments/transfer-request
- Body: { currentClassId, targetClassId, reason }

GET /api/enrollments/available-classes/:currentClassId
- Trả về danh sách lớp có thể chuyển đến

DELETE /api/enrollments/transfer-request/:enrollmentId
- Hủy yêu cầu chuyển lớp

GET /api/enrollments/transfer-request/:enrollmentId
- Lấy thông tin yêu cầu chuyển lớp
```

### Admin APIs (Quản trị viên)
```
GET /admin/enrollments/transfer-requests
- Danh sách yêu cầu chuyển lớp

GET /admin/enrollments/transfer-requests/:id
- Chi tiết yêu cầu chuyển lớp

POST /admin/enrollments/transfer-requests/:id/approve
- Duyệt yêu cầu chuyển lớp

POST /admin/enrollments/transfer-requests/:id/reject
- Từ chối yêu cầu chuyển lớp
```

## Quy trình hoạt động

### 1. Học viên gửi yêu cầu
1. Học viên vào trang "Khóa học của tôi"
2. Chọn lớp học muốn chuyển
3. Nhấn "Chuyển lớp" → Hiển thị form yêu cầu
4. Chọn lớp đích và nhập lý do
5. Gửi yêu cầu → Trạng thái "Chờ duyệt"

### 2. Quản trị viên xử lý
1. Admin vào "Quản lý yêu cầu chuyển lớp"
2. Xem danh sách yêu cầu chờ duyệt
3. Click "Chi tiết" để xem thông tin đầy đủ
4. Duyệt hoặc từ chối với ghi chú

### 3. Phân quyền duyệt
- **Khóa học chưa bắt đầu**: Admin có thể duyệt trực tiếp
- **Khóa học đang diễn ra**: 
  - Chỉ giáo viên phụ trách lớp hiện tại hoặc lớp đích mới có thể duyệt
  - Admin không thể duyệt trực tiếp

## Validation Rules

### Khi gửi yêu cầu
- Học viên phải đã đăng ký và được duyệt vào lớp hiện tại
- Lớp đích phải cùng khóa học với lớp hiện tại
- Lớp đích phải còn chỗ trống
- Học viên chưa có yêu cầu chuyển lớp đang chờ duyệt

### Khi duyệt yêu cầu
- Yêu cầu phải ở trạng thái "pending"
- Lớp đích vẫn phải còn chỗ trống
- Người duyệt phải có quyền (admin hoặc giáo viên phụ trách)

## Components React

### ClassTransfer.js
Component chính cho chức năng chuyển lớp:
- Hiển thị form yêu cầu chuyển lớp
- Quản lý trạng thái yêu cầu
- Xử lý API calls

### Learning.js (đã cập nhật)
- Tích hợp component ClassTransfer
- Hiển thị nút "Chuyển lớp" cho các enrollment đã duyệt

## Views Admin (Pug)

### transfer-requests.pug
- Danh sách yêu cầu chuyển lớp
- Filter theo trạng thái
- Pagination

### transfer-request-detail.pug
- Chi tiết yêu cầu chuyển lớp
- Form duyệt/từ chối
- Hiển thị thông tin học viên và lớp học

## Cài đặt và sử dụng

### 1. Backend
- Các file đã được tạo sẵn
- Routes đã được thêm vào index.route.js
- Không cần cài đặt thêm

### 2. Frontend
- Component ClassTransfer.js đã được tạo
- Learning.js đã được cập nhật
- Apis.js đã được cập nhật với endpoints mới

### 3. Database
- Model Enrollment đã có sẵn cấu trúc transfer_request
- Không cần migration

## Lưu ý quan trọng

1. **Bảo mật**: Tất cả API đều yêu cầu authentication
2. **Validation**: Kiểm tra kỹ lưỡng trước khi cho phép chuyển lớp
3. **Audit trail**: Ghi lại người duyệt và thời gian duyệt
4. **User experience**: Hiển thị thông báo rõ ràng cho học viên
5. **Performance**: Sử dụng pagination cho danh sách yêu cầu

## Troubleshooting

### Lỗi thường gặp
1. **"Lớp học đích đã đầy"**: Kiểm tra lại số lượng học viên hiện tại
2. **"Không có quyền duyệt"**: Kiểm tra role và quyền của người dùng
3. **"Đã có yêu cầu chờ duyệt"**: Học viên chỉ có thể có 1 yêu cầu tại một thời điểm

### Debug
- Kiểm tra logs server để xem lỗi chi tiết
- Sử dụng browser dev tools để debug frontend
- Kiểm tra database để xem trạng thái enrollment
