# Hướng dẫn cài đặt và sửa lỗi

## Các lỗi đã được sửa:

### 1. Lỗi "Module not found: Can't resolve 'react-toastify'"
**Giải pháp:** Cài đặt react-toastify
```bash
cd DAFE
npm install react-toastify
```

### 2. Lỗi "export 'useAuth' was not found"
**Giải pháp:** Đã thêm useAuth hook vào Contexts.js và AuthProvider vào App.js

### 3. Các thay đổi đã thực hiện:

#### a) Cập nhật `src/configs/Contexts.js`:
- Thêm AuthContext và AuthProvider
- Thêm useAuth hook
- Quản lý authentication state

#### b) Cập nhật `src/App.js`:
- Thêm AuthProvider wrapper
- Thêm ToastContainer cho notifications
- Import CSS cho react-toastify

#### c) Cập nhật `src/components/ClassTransfer.js`:
- Loại bỏ useAuth import
- Sử dụng localStorage trực tiếp cho token

#### d) Cập nhật `package.json`:
- Thêm react-toastify dependency

## Các bước thực hiện:

### Bước 1: Cài đặt dependencies
```bash
cd DAFE
npm install
```

### Bước 2: Khởi động ứng dụng
```bash
npm start
```

## Kiểm tra hoạt động:

1. **Toast notifications**: Khi gửi yêu cầu chuyển lớp, sẽ hiển thị thông báo
2. **Authentication**: useAuth hook đã sẵn sàng sử dụng
3. **ClassTransfer component**: Có thể import và sử dụng trong Learning.js

## Lưu ý:

- Đảm bảo server backend đang chạy trên port 4000
- Token authentication được lưu trong localStorage
- Toast notifications sẽ hiển thị ở góc trên bên phải

## Troubleshooting:

Nếu vẫn gặp lỗi:
1. Xóa node_modules và package-lock.json
2. Chạy `npm install` lại
3. Khởi động lại development server
