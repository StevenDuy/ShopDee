# ShopDee - Hệ thống Thương mại Điện tử (Next.js & Laravel)

Chào mừng bạn đến với dự án **ShopDee**. Đây là một nền tảng thương mại điện tử hiện đại, tích hợp tính năng Chat Realtime, Quản lý sản phẩm nâng cao và lưu trữ đám mây 100%.

---

## 🛠 Yêu cầu hệ thống

- **PHP >= 8.2**
- **Composer**
- **Node.js** (Bản LTS) & **npm**
- **TiDB Cloud** (Cơ sở dữ liệu miễn phí)
- **Cloudinary** (Lưu trữ hình ảnh/video miễn phí)
- **Pusher** (Chat Realtime miễn phí)

---

## 🚀 Hướng dẫn Cài đặt & Cấu hình (Toàn diện)

### Bước 1: Cấu hình Backend (Laravel)

1. Di chuyển vào thư mục `backend`.
2. Chạy lệnh cài đặt thư viện: `composer install`. (Dự án sử dụng `cloudinary-labs/cloudinary-laravel`).
3. Tạo file cấu hình: Copy `.env.example` thành `.env`.
4. **Cơ sở dữ liệu (TiDB Cloud):**
   - Đăng ký tại [tidbcloud.com](https://tidbcloud.com/).
   - Điền các thông số `DB_HOST`, `DB_PORT=4000`, `DB_USERNAME`, `DB_PASSWORD` vào `.env`.
   - Bật `MYSQL_ATTR_SSL_CA=true`.
5. **Lưu trữ hình ảnh (Cloudinary):**
   - Đăng ký tại [cloudinary.com](https://cloudinary.com/).
   - Lấy `Cloud Name`, `API Key`, `API Secret` điền vào `.env`.
6. **Chat Realtime (Pusher):**
   - Đăng ký tại [pusher.com](https://pusher.com/).
   - Điền thông tin vào các biến `PUSHER_...` trong `.env`.
7. **Firebase (Dành cho Chat):**
   - Tải file JSON từ Firebase Console -> Service Accounts.
   - Đổi tên thành `firebase-credentials.json` và bỏ vào `backend/storage/`.
8. Khởi tạo ứng dụng:
   ```bash
   php artisan key:generate
   php artisan migrate:fresh --seed
   ```

### Bước 2: Cấu hình Frontend (Next.js)

1. Di chuyển vào thư mục `frontend`.
2. Chạy lệnh cài đặt: `npm install`.
3. Tạo file cấu hình: Copy `.env.example` thành `.env.local`.
4. **Cấu hình biến môi trường:**
   - Điền thông tin Firebase Web App (API Key, Project ID,...) để tính năng Chat hoạt động.
   - Điền App Key của **Pusher** (cùng app với Backend).
5. Chạy ứng dụng: `npm run dev`.

---

## 🛠 Xử lý lỗi thường gặp (Troubleshooting)

### 1. Lỗi không upload được ảnh
- **Cách sửa:** Kiểm tra xem bạn đã điền đúng `CLOUDINARY_URL` hoặc các mã API của Cloudinary trong file `.env` chưa. Cloudinary giúp ảnh của bạn hiển thị trên toàn thế giới mà không cần lưu ở máy cá nhân.

### 2. Lỗi kết nối TiDB Cloud (Port 4000)
- **Hiện tượng:** Không chạy được lệnh migrate.
- **Cách sửa:** Đảm bảo bạn đang dùng Port `4000` thay vì `3306`. Kiểm tra xem mật khẩu TiDB đã đúng chưa (mật khẩu này khác với mật khẩu tài khoản TiDB).

### 3. Lỗi Chat không hoạt động
- **Cách sửa:** Kiểm tra cả 2 nơi: `.env` của Backend (đã cấu hình Firebase credentials chưa?) và `.env.local` của Frontend (đã điền Firebase Config chưa?). Cần có file `backend/storage/firebase-credentials.json` thì Backend mới khởi tạo được Firebase.

---

## 📝 Lưu ý quan trọng
- Dự án này đã được cấu hình chọn lọc để **hoàn toàn miễn phí**. Bạn không cần nhập thẻ tín dụng vào bất kỳ dịch vụ nào (TiDB, Cloudinary, Pusher, Firebase).
- Tuyệt đối không đưa các file chứa mã bí mật lên GitHub.

---
**ShopDee Team - Chúc bạn có một trải nghiệm code vui vẻ!**
