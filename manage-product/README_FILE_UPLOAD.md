# Hướng dẫn sử dụng tính năng Upload File cho Bài học

## Tổng quan
Tính năng này cho phép giáo viên upload file tài liệu (PDF, DOC, DOCX) cho từng bài học và học sinh có thể tải về để học tập.

## Các file đã được thêm/sửa đổi

### Backend (manage-product/)

#### 1. Helper files
- `helper/uploadFileToCloudinary.js` - Upload file lên Cloudinary
- `helper/deleteFileFromCloudinary.js` - Xóa file từ Cloudinary

#### 2. Middleware
- `middlewares/admin/uploadFile.middleware.js` - Xử lý upload file với validation

#### 3. Model
- `models/class.model.js` - Thêm trường `file` vào schema bài học

#### 4. Controller
- `controllers/admin/class.controller.js` - Cập nhật các hàm CRUD bài học

#### 5. Routes
- `routes/admin/class.route.js` - Thêm middleware upload cho các route bài học

#### 6. Views
- `views/admin/pages/classes/lessons-manage.pug` - Cập nhật giao diện quản lý bài học

### Frontend (DAFE/)

#### 1. Components
- `src/components/Learning.js` - Cập nhật hiển thị file tài liệu cho học sinh

## Cách sử dụng

### Cho Giáo viên (Admin)

1. **Truy cập quản lý bài học:**
   - Vào Admin Panel > Lớp học > Chọn lớp > Quản lý bài học

2. **Thêm bài học với file:**
   - Click "Thêm bài học"
   - Điền tên bài học (bắt buộc)
   - Điền nội dung (tùy chọn)
   - Điền link video (tùy chọn)
   - Chọn file tài liệu (PDF, DOC, DOCX) - tối đa 10MB
   - Click "Thêm"

3. **Sửa bài học:**
   - Click "Sửa" bên cạnh bài học
   - Có thể thay đổi file mới (file cũ sẽ bị xóa tự động)
   - Click "Lưu"

4. **Xóa file riêng lẻ:**
   - Click "Xóa file" bên cạnh file tài liệu
   - Xác nhận xóa

5. **Xóa bài học:**
   - Click "Xóa" bên cạnh bài học
   - File tài liệu sẽ bị xóa tự động

### Cho Học sinh

1. **Truy cập bài học:**
   - Đăng nhập vào hệ thống
   - Vào "Khóa học của tôi"
   - Chọn lớp học
   - Mở bài học muốn xem

2. **Tải file tài liệu:**
   - Trong mỗi bài học, nếu có file tài liệu sẽ hiển thị phần "Tài liệu bài học"
   - Click "Tải về" để download file

## Tính năng bảo mật

1. **Validation file:**
   - Chỉ chấp nhận file PDF, DOC, DOCX
   - Kích thước tối đa 10MB
   - Kiểm tra mimetype

2. **Quyền truy cập:**
   - Chỉ học sinh đã đăng ký và được duyệt mới có thể xem file
   - File được lưu trên Cloudinary với quyền truy cập công khai

3. **Xóa file tự động:**
   - Khi cập nhật file mới, file cũ sẽ bị xóa
   - Khi xóa bài học, file sẽ bị xóa
   - Có thể xóa file riêng lẻ

## Cấu hình Cloudinary

Đảm bảo các biến môi trường sau đã được cấu hình:
```
CLOUD_NAME=your_cloud_name
CLOUD_KEY=your_api_key
CLOUD_API_SECRET=your_api_secret
```

## Lưu ý

1. File được upload lên Cloudinary trong folder "lesson-files"
2. Tên file gốc được lưu để hiển thị cho người dùng
3. Khi xóa file, hệ thống sẽ xóa cả trên Cloudinary và trong database
4. Nếu upload file thất bại, sẽ hiển thị thông báo lỗi
5. Học sinh có thể tải file trực tiếp từ URL Cloudinary
