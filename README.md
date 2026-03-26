# 🚀 ShopDee - Hướng dẫn Cấu hình & Cài đặt Chi tiết

ShopDee là hệ thống Thương mại điện tử Full-Stack (Next.js + Laravel). Để dự án chạy được, bạn **bắt buộc** phải cấu hình các dịch vụ ngoại vi (Cloudinary, Pusher, Google Auth). Hãy làm theo hướng dẫn từng bước dưới đây để lấy Key.

---

## 🛠️ PHẦN 1: HƯỚNG DẪN LẤY API KEY (TỪNG BƯỚC)

### 1. CLOUDINARY (Xử lý & Nén ảnh)
Dùng để upload ảnh sản phẩm, banner và nén ảnh tự động giúp web mượt hơn.

1. Truy cập [Cloudinary.com](https://cloudinary.com/) -> Nhấn **Sign Up for Free**.
2. Sau khi đăng nhập, bạn sẽ thấy giao diện **Dashboard**.
3. Hãy tìm mục **Product Environment Settings** (ở góc trái dưới) -> Chọn **API Keys**.
4. Tại đây bạn sẽ thấy 3 thông số quan trọng:
   - **Cloud Name**: Tên định danh của bạn.
   - **API Key**: Mã định danh API.
   - **API Secret**: (Nhấn nút con mắt để hiện) - Mã bảo mật.
5. Copy 3 thông số này vào file `.env` của Backend.

### 2. PUSHER (Chat Realtime)
Dùng để đẩy thông báo tin nhắn ngay lập tức mà không cần load lại trang.

1. Truy cập [Pusher.com](https://pusher.com/) -> Chọn **Get Started Free**.
2. Tạo một app mới: Nhấn **Create app**.
   - **Name your app**: `ShopDee`.
   - **Select a cluster**: Chọn `ap1 (Asia Pacific)`.
3. Sau khi tạo xong, chọn mục **App Keys** ở menu bên trái.
4. Copy các giá trị: `app_id`, `key`, `secret`, `cluster` vào file `.env` (cả Backend và Frontend).


### 3. GMAIL (Gửi email xác thực)
Dùng để gửi mã xác nhận, thông báo đơn hàng hoặc khôi phục mật khẩu.

1. Truy cập [Google App Passwords](https://myaccount.google.com/apppasswords).
2. **Bật Xác minh 2 lớp** (nếu chưa có).
3. Ô **Chọn ứng dụng**: Chọn `Thư` (Mail).
4. Ô **Chọn thiết bị**: Chọn `Khác (Tên tùy chỉnh)` -> Nhập `ShopDee`.
5. Nhấn **Tạo**. Copy dải **mã 16 ký tự** hiện ra (đây là mật khẩu để dán vào `.env`).

### 4. GOOGLE AUTH (Đăng nhập Google)
Dùng để cho phép người dùng đăng nhập nhanh bằng tài khoản Google.

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới.
3. Tìm kiếm **APIs & Services** -> **OAuth consent screen**. Cấu hình App Name và Email hỗ trợ.
4. Vào mục **Credentials** -> **Create Credentials** -> **OAuth client ID**.
   - **Application type**: Chọn `Web application`.
   - **Authorized redirect URIs**: Thêm `http://localhost:8000/api/auth/google/callback`.
5. Nhấn **Create**. Bạn sẽ nhận được `Client ID` và `Client Secret`.
6. Copy các giá trị này vào file `.env` của Backend và Frontend.

---

## ⚙️ PHẦN 2: CẤU HÌNH HỆ THỐNG

### 1. Cơ sở dữ liệu (XAMPP)
- Mở XAMPP -> Start Apache & MySQL.
- Vào `phpMyAdmin` -> Tạo database tên `shopdee`.
- Mở `backend/.env` và sửa:
  ```env
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=shopdee
  DB_USERNAME=root
  DB_PASSWORD=
  ```

### 2. Cấu hình Frontend
Mở `frontend/.env.local` và điền đầy đủ các Key bạn vừa lấy ở Phần 1:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_PUSHER_APP_KEY="DÁN_KEY_PUSHER"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="DÁN_CLIENT_ID_GOOGLE"
```

### 3. Cấu hình Email (Backend)
Mở `backend/.env` và điền thông tin Gmail của bạn:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME="email_cua_ban@gmail.com"
MAIL_PASSWORD="ma_16_ky_tu_vừa_tạo"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="email_cua_ban@gmail.com"

# Cấu hình Google Login (Backend)
GOOGLE_CLIENT_ID="DÁN_CLIENT_ID"
GOOGLE_CLIENT_SECRET="DÁN_CLIENT_SECRET"
GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback
```

---

## 🚀 PHẦN 3: KHỞI CHẠY DỰ ÁN

**Chạy Backend (Laravel):**
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Chạy Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
```

---

## 📘 PHẦN 4: GIẢI THÍCH CHỨC NĂNG CÔNG CỤ

Tại sao ShopDee lại cần nhiều công cụ như vậy? Đây là vai trò của chúng:

| Công cụ | Chức năng chính | Tại sao hệ thống cần nó? |
| :--- | :--- | :--- |
| **Cloudinary** | Quản lý & Tối ưu ảnh | Tự động hạ độ phân giải ảnh cho các máy yếu, giúp web không bị giật lag khi có nhiều ảnh sản phẩm. |
| **Pusher** | Truyền tin Realtime | Đảm bảo khi người dùng gửi tin nhắn, hệ thống sẽ đẩy tin đó đi ngay lập tức (như Facebook Messenger). |
| **Google Auth** | Đăng nhập an toàn | Cho phép người dùng đăng nhập bằng 1 cú click, tăng tỷ lệ chuyển đổi khách hàng. |
| **XAMPP / MySQL** | Lưu trữ cốt lõi | Nơi "nhớ" toàn bộ thông tin tài khoản, đơn hàng và sản phẩm của bạn. |

---
> [!IMPORTANT]
> **KIỂM TRA LỖI**:
> Nếu bạn thiếu bất kỳ Key nào hoặc cấu hình sai, hệ thống sẽ hiện một **Bản thông báo cảnh báo** ngay trên màn hình để bạn biết cần sửa ở đâu, thay vì bị lỗi trắng trang (Crash).

**ShopDee Team** - *Cùng nhau kiến tạo nền tảng chuyên nghiệp!* 🚀
