# ShopDee - Hệ thống Thương mại Điện tử (Next.js & Laravel)

Chào mừng bạn đến với dự án **ShopDee**. Đây là một nền tảng thương mại điện tử hiện đại được xây dựng với kiến trúc tách biệt Frontend (Next.js) và Backend (Laravel).

---

## 🛠 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **PHP >= 8.2** (Khuyên dùng XAMPP bản mới nhất)
- **Composer** (Quản lý thư viện PHP)
- **Node.js** (Bản LTS mới nhất) & **npm**
- **MySQL** (Có sẵn trong XAMPP)

---

## 🚀 Hướng dẫn cài đặt & Cấu hình

### Bước 0: Tạo cơ sở dữ liệu (Database)
Trước khi cài đặt code, bạn cần chuẩn bị "ngôi nhà" cho dữ liệu:
1.  **Mở XAMPP Control Panel:** Nhấn nút **Start** ở cả 2 dòng **Apache** và **MySQL** (Khi hiện màu xanh lá cây là OK).
2.  **Truy cập phpMyAdmin:** Mở trình duyệt web và gõ địa chỉ: `http://localhost/phpmyadmin`
3.  **Tạo Database mới:**
    - Nhìn cột bên trái, click vào chữ **New** (Mới).
    - Ở ô **Database name** (Tên cơ sở dữ liệu), bạn gõ đúng chữ: `shopdee`
    - Ở ô bên cạnh (Collation), chọn `utf8mb4_unicode_ci` (nếu không biết thì cứ để mặc định).
    - Nhấn nút **Create** (Tạo).
4.  **Xong!** Bây giờ bạn đã có một database trống tên là `shopdee`. Hãy sang bước tiếp theo.

---

### 1. Cấu hình Backend (Laravel)

Di chuyển vào thư mục backend:
1. Mở thư mục `ShopDee`, sau đó vào tiếp thư mục `backend`.
2. Click chuột phải chọn "Open in Terminal" (hoặc mở Command Prompt và gõ `cd backend`).

#### Bước 1.1: Cài đặt thư viện
Gõ lệnh sau và nhấn Enter:
```bash
composer install
```

#### Bước 1.2: Cấu hình môi trường (.env)
1. Trong thư mục `backend`, tìm file `.env.example`.
2. Chuột phải vào file, chọn **Copy**, sau đó **Paste** ngay tại đó.
3. Đổi tên file vừa paste thành `.env` (xóa phần `.example`).
4. Mở file `.env` bằng Notepad hoặc VS Code:
    - Tìm dòng `DB_DATABASE`, sửa thành `DB_DATABASE=shopdee`.
    - (Lưu ý: Bạn cần vào `http://localhost/phpmyadmin` để tạo một database tên là `shopdee` trước).

#### Bước 1.3: Khởi tạo ứng dụng & Tạo bảng dữ liệu (Migration)
Đây là bước quan trọng nhất để biến database trống thành database có đầy đủ các bảng và chức năng. Bạn thực hiện lần lượt 2 lệnh sau trong terminal `backend`:

1.  **Tạo mã bảo mật ứng dụng:**
    ```bash
    php artisan key:generate
    ```
    *(Sau lệnh này, bạn sẽ thấy thông báo "Application key set successfully")*

2.  **Tạo các bảng (Migration) và Dữ liệu mẫu (Seeder):**
    Gõ chính xác lệnh sau và nhấn Enter:
    ```bash
    php artisan migrate --seed
    ```
    - **Nó làm gì?** Nó sẽ tự động tạo ra các bảng như `users`, `products`, `orders`... vào trong database `shopdee`.
    - **Dữ liệu mẫu:** Nó cũng tạo luôn các tài khoản Web Admin, Người bán và Sản phẩm mẫu để bạn dùng thử ngay mà không cần ngồi nhập liệu từ đầu.
    - *(Khi chạy xong, các dòng chữ màu xanh hiện ra thông báo "Completed" là thành công).*

#### Bước 1.4: Cấu hình FIREBASE (Rất quan trọng để đăng ảnh)
Dành cho người mới:
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Chọn dự án của bạn (ví dụ: `ShopDee-App`).
3. Nhìn menu bên trái, click vào biểu tượng **Bánh răng (Settings)** -> Chọn **Project Settings**.
4. Chọn tab **Service Accounts**.
5. Đảm bảo đang chọn mục **Firebase Admin SDK**.
6. Nhấn nút **Generate new private key**. Một cửa sổ hiện ra, nhấn tiếp **Generate key**.
7. Một file có đuôi `.json` sẽ được tải về máy bạn.
8. **Quan trọng:** Tìm file vừa tải về, đổi tên nó thành đúng `firebase-credentials.json`.
9. Cắt (Cut) file này và dán (Paste) vào thư mục: `ShopDee/backend/storage/`.

#### Bước 1.5: Cấu hình PUSHER (Để nhắn tin và thông báo realtime)
1. Truy cập [Pusher.com](https://pusher.com/) và đăng nhập.
2. Tạo một app mới (ví dụ tên `shopdee-chat`), chọn cluster là `ap1` (Singapore).
3. Sau khi tạo xong, chọn mục **App Keys** ở menu bên trái.
4. Bạn sẽ thấy: `app_id`, `key`, `secret`, `cluster`.
5. Mở file `.env` ở Backend ra, tìm mục Pusher và điền các giá trị này vào.

#### Bước 1.6: Chạy Backend
Gõ lệnh:
```bash
php artisan serve
```
*(Giữ nguyên cửa sổ terminal này, đừng tắt nó đi).*

---

### 2. Cấu hình Frontend (Next.js)

Mở một terminal **mới** (giữ terminal cũ đang chạy Backend):
1. Quay lại thư mục `ShopDee`, vào thư mục `frontend`.
2. Mở terminal tại đây.

#### Bước 2.1: Cài đặt thư viện
Gõ:
```bash
npm install
```

#### Bước 2.2: Cấu hình môi trường (.env.local)
1. Tìm file `.env.example` trong thư mục `frontend`.
2. Copy và đổi tên thành `.env.local`.
3. Mở `.env.local` lên:
    - `NEXT_PUBLIC_API_URL` để mặc định là `http://localhost:8000/api`.
    - Phần **Firebase Config**: Quay lại **Firebase Console** -> **Project Settings** -> Tab **General**. Kéo xuống dưới cùng chỗ "Your apps", chọn ứng dụng Web (biểu tượng `</>`). Bạn sẽ thấy một đoạn code có chứa các thông số như `apiKey`, `authDomain`... Hãy copy và điền vào các dòng tương ứng trong `.env.local`.
    - Phần **Pusher Config**: Điền `key` và `cluster` vào.

#### Bước 2.3: Chạy Frontend
Gõ:
```bash
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000) để thấy thành quả.

---

## 📦 Các công nghệ chính sử dụng

- **Backend:** Laravel 12, Laravel Sanctum (Auth), Pusher (WebSocket), Firebase Admin SDK.
- **Frontend:** Next.js 16 (App Router), Tailwind CSS, Framer Motion, Lucide React, Zustand.
- **Realtime:** Laravel Echo + Pusher.
- **Database:** MySQL.

---

## 📝 Lưu ý quan trọng
- Khi thay đổi cấu hình trong `.env` của Backend, hãy chạy `php artisan config:clear`.
- Đảm bảo file `firebase-credentials.json` đã được thêm vào `.gitignore` để tránh lộ thông tin bảo mật.
