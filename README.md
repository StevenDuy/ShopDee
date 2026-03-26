# 🚀 ShopDee - Hướng dẫn Cài đặt Siêu Chi Tiết (Cầm tay chỉ việc)

Chào mừng bạn đến với ShopDee! Bản hướng dẫn này được thiết kế để giúp bất kỳ ai, kể cả người chưa biết về lập trình, cũng có thể cài đặt và chạy hệ thống thành công 100%.

---

## 📋 GIAI ĐOẠN 1: CHUẨN BỊ CÔNG CỤ (LÀM 1 LẦN DUY NHẤT)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt 3 công cụ sau:
1. **XAMPP**: Để chạy cơ sở dữ liệu (Database). [Tải tại đây](https://www.apachefriends.org/download.html).
2. **Node.js**: Để chạy giao diện (Frontend). [Tải bản LTS tại đây](https://nodejs.org/).
3. **Composer**: Để chạy mã nguồn (Backend). [Tải tại đây](https://getcomposer.org/).

---

## 🛠️ GIAI ĐOẠN 2: LẤY CÁC KHÓA API (QUAN TRỌNG NHẤT)

Hệ thống yêu cầu bạn phải có các "chìa khóa" kết nối sau đây. Bạn hãy copy chúng ra một file nháp (Notepad) để tí nữa dán vào cấu hình.

### 1. CLOUDINARY (Để lưu ảnh sản phẩm)
1. Vào [Cloudinary](https://cloudinary.com/) -> Đăng ký tài khoản miễn phí.
2. Tại màn hình Dashboard, bạn sẽ thấy: **Cloud Name**, **API Key**, **API Secret**. Hãy lưu lại 3 thông số này.

### 2. PUSHER (Để nhắn tin realtime)
1. Vào [Pusher](https://pusher.com/) -> Đăng ký tài khoản.
2. Nhấn nút **Create App** (Tạo ứng dụng mới).
   - Đặt tên app: `ShopDee`.
   - Chọn Cluster: `ap1 (Asia Pacific)`.
3. Sau khi tạo, chọn menu **App Keys** ở bên trái. Lưu lại: `app_id`, `key`, `secret`, `cluster`.

### 3. GMAIL APP PASSWORD (Để gửi email tự động)
1. Vào [Tài khoản Google của bạn](https://myaccount.google.com/apppasswords).
2. Đăng nhập và tạo một mật khẩu ứng dụng cho "ShopDee".
3. Google sẽ cấp cho bạn một **mã 16 ký tự**. Đây chính là mật khẩu email ứng dụng của bạn.

### 4. GOOGLE AUTH (Đăng nhập bằng nút Google)
1. Vào [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo 1 Project mới -> Mục **OAuth consent screen** chọn `External` và điền tên app.
3. Mục **Credentials** -> Chọn **Create Credentials** -> **OAuth client ID**.
   - Chọn **Web Application**.
   - **QUAN TRỌNG:** Ở ô **Authorized redirect URIs**, hãy nhập: `http://localhost:8000/api/auth/google/callback`. (Nếu sau này bạn dùng Cloudflare, hãy thay `http://localhost:8000` bằng link Cloudflare của bạn).
4. Lưu lại **Client ID** và **Client Secret**.

---

## ⚙️ GIAI ĐOẠN 3: CẤU HÌNH HỆ THỐNG

### Bước 1: Mở thư mục dự án
Mở thư mục `ShopDee` trên máy tính của bạn. Bạn sẽ thấy 2 thư mục con là `backend` và `frontend`.

### Bước 2: Cấu hình Backend (Máy chủ)
1. Mở thư mục `backend`, tìm file tên là `.env`.
2. Dán các khóa API bạn đã lấy ở Giai đoạn 2 vào các dòng tương ứng:
   - `CLOUDINARY_URL`, `CLOUDINARY_CLOUD_NAME`, v.v...
   - `PUSHER_APP_ID`, `PUSHER_APP_KEY`, v.v...
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
   - `GOOGLE_REDIRECT_URL`: Địa chỉ API đăng nhập (Quan trọng).
   - `FRONTEND_URL`: Địa chỉ web của bạn (Mặc định là `http://localhost:3000`).
   - `MAIL_USERNAME` (Email của bạn) và `MAIL_PASSWORD` (Mã 16 ký tự ở Bước 3).

> [!TIP]
> **KHI CHẠY PUBLIC (DÙNG CLOUDFLARE):** Bạn hãy sửa `FRONTEND_URL` thành link Cloudflare của trang web để sau khi đăng nhập Google, nó có thể quay về đúng trang web của bạn thay vì quay về localhost.

### Bước 3: Cấu hình Frontend (Giao diện)
1. Mở thư mục `frontend`, tìm file tên là `.env.local`.
2. Điền các khóa:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_PUSHER_APP_KEY="Key Pusher của bạn"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="Client ID Google của bạn"
   ```

---

## 🚀 GIAI ĐOẠN 4: CHẠY DỰ ÁN (CÁCH NHẬP LỆNH)

### Bước 1: Chạy Database (XAMPP)
1. Mở phần mềm XAMPP lên.
2. Nhấn nút **Start** ở dòng **Apache** và **MySQL**.
3. Mở trình duyệt, gõ `localhost/phpmyadmin`. Nhấn **New** để tạo Database tên là `shopdee`.

### Bước 2: Chạy Backend (Mở 1 cửa sổ Terminal mới)
1. Mở thư mục `backend` trong Terminal hoặc CMD.
2. Gõ các lệnh sau (nhấn Enter sau mỗi lệnh):
   ```bash
   composer install
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```
   *Giữ nguyên cửa sổ này, không được đóng lại.*

### Bước 3: Chạy Frontend (Mở thêm 1 cửa sổ Terminal khác)
1. Mở thư mục `frontend` trong Terminal.
2. Gõ các lệnh sau:
   ```bash
   npm install
   npm run dev
   ```
   *Giữ nguyên cửa sổ này.* Bây giờ bạn có thể vào `localhost:3000` để xem web.

---

## 🌐 GIAI ĐOẠN 5: ĐƯA WEB LÊN INTERNET (CLOUDFLARE TUNNEL)

Nếu bạn muốn gửi link cho người khác xem (Public):
1. Tải file `cloudflared.exe` vào thư mục gốc dự án.
2. **Cho Backend:** Nhập lệnh `.\cloudflared.exe tunnel --url http://localhost:8000` -> Bạn sẽ nhận được 1 link HTTPS của Cloudflare.
3. **CẬP NHẬT:** Lấy link đó, quay lại file `frontend/.env.local` và sửa dòng `NEXT_PUBLIC_API_URL` bằng link mới này (thêm `/api` ở cuối).
4. **Cho Frontend:** Nhập lệnh `.\cloudflared.exe tunnel --url http://localhost:3000` -> Link HTTPS nhận được chính là trang web của bạn!

> [!CAUTION]
> **LỖI CẤU HÌNH:** Nếu bạn quên không điền bất kỳ khóa API nào ở Giai đoạn 2, hệ thống sẽ hiện một BẢNG CẢNH BÁO chặn toàn bộ trang web. Bạn phải điền đầy đủ và khởi động lại server thì bảng này mới biến mất.

---
🚀 **ShopDee Team** - *Chúc bạn thành công trên con đường trở thành chuyên gia!*
