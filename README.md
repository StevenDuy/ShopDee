# 🚀 ShopDee - Hướng dẫn Cấu hình & Cài đặt Chi tiết

ShopDee là hệ thống Thương mại điện tử Full-Stack (Next.js + Laravel). Để dự án chạy được, bạn **bắt buộc** phải cấu hình 3 dịch vụ ngoại vi (Cloudinary, Pusher, Firebase). Hãy làm theo hướng dẫn từng bước dưới đây để lấy Key.

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

### 3. FIREBASE (AI & Theo dõi hành vi - Analytics)
Dùng để AI phân tích hành vi người dùng và theo dõi log hệ thống.

1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Nhấn **Add Project** -> Đặt tên: `ShopDee`.
3. Nhấn **Continue** (Giữ nguyên mặc định bật Google Analytics).
4. Sau khi tạo xong Project -> Nhấn vào biểu tượng **Web (</>)** để tạo ứng dụng web.
5. Copy đoạn mã cấu hình `firebaseConfig` bao gồm: `apiKey`, `authDomain`, `projectId`, v.v...
6. Lấy Key cho Backend: Nhấn vào bánh răng (Settings) -> **Project Settings** -> **Service accounts**.
7. Nhấn nút **Generate new private key**. Một file `.json` sẽ được tải về máy.
   - Đổi tên file này thành `firebase-credentials.json`.
   - Để file này vào thư mục: `backend/storage/`.

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
NEXT_PUBLIC_PUSHER_APP_KEY="DÁN_KEY_PUSHER_SAU_KHI_LẤY"
NEXT_PUBLIC_FIREBASE_API_KEY="DÁN_API_KEY_FIREBASE"
# ... các thông số khác
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
| **Firebase** | AI & Analytics | Thu thập dữ liệu hành vi (click, xem hàng) để AI của hệ thống có thể phân tích và đề xuất sản phẩm phù hợp. |
| **XAMPP / MySQL** | Lưu trữ cốt lõi | Nơi "nhớ" toàn bộ thông tin tài khoản, đơn hàng và sản phẩm của bạn. |

---
> [!IMPORTANT]
> **KIỂM TRA LỖI**:
> Nếu bạn thiếu bất kỳ Key nào hoặc cấu hình sai, hệ thống sẽ hiện một **Bản thông báo cảnh báo** ngay trên màn hình để bạn biết cần sửa ở đâu, thay vì bị lỗi trắng trang (Crash).

**ShopDee Team** - *Cùng nhau kiến tạo nền tảng chuyên nghiệp!* 🚀
