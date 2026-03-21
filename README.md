# 🚀 ShopDee - Nền tảng Thương mại Điện tử Hiện đại (Next.js & Laravel)

Chào mừng bạn đến với **ShopDee**! Dự án này là một hệ thống thương mại điện tử full-stack mạnh mẽ, được thiết kế để mang lại trải nghiệm mượt mà với Chat Realtime, Quản lý sản phẩm thông minh và Hiển thị biểu đồ thống kê hiện đại (Dashboard).

---

## 🏛️ Kiến trúc Hệ thống

| Thành phần | Công nghệ Sử dụng | Vai trò |
| :--- | :--- | :--- |
| **Backend** | Laravel 11 + PHP 8.2+ | Xử lý API, Business Logic, Bảo mật, Realtime Broadcast |
| **Frontend** | Next.js 15 (App Router) + TypeScript | Giao diện người dùng, Dashboard admin, Responsive design |
| **Database** | TiDB Cloud (Cơ sở dữ liệu phân tán) | Lưu trữ dữ liệu an toàn, hiệu năng cao, chứng chỉ SSL |
| **Realtime** | Pusher / Laravel Echo | Chat trực tiếp giữa người mua và người bán, Thông báo |
| **Lưu trữ** | Cloudinary | Tối ưu hóa và lưu trữ hình ảnh/video sản phẩm |
| **Firebase** | Service Account (Admin SDK) | Quản lý xác thực nâng cao và dữ liệu Chat đồng bộ |
| **UI/UX** | Tailwind CSS + Lucide Icons + Framer Motion | Thiết kế hiện đại, mượt mà và trực quan |
| **Charts** | Recharts | Trình diễn dữ liệu thống kê doanh thu và rủi ro trực quan |

---

## ⚙️ Hướng dẫn Cài đặt Chi tiết

### 1. Chuẩn bị Môi trường
*   **PHP:** >= 8.2 (Cần bật extension: `bcmath`, `curl`, `mbstring`, `openssl`, `xml`, `zip`).
*   **Composer:** Phiên bản mới nhất.
*   **Node.js:** >= 18.x (Bản LTS) & **npm**.
*   **Database:** [TiDB Cloud](https://tidbcloud.com/) (Tạo cụm miễn phí).

---

### 2. Cấu hình Backend (Laravel)
Vào thư mục con: `cd backend`

1.  **Cài đặt thư viện:**
    ```bash
    composer install
    ```
2.  **Thiết lập file Môi trường:**
    Copy `.env.example` thành `.env` và điền các thông số sau:
    *   `DB_CONNECTION=mysql`
    *   `DB_HOST`: gateway.. (lấy từ TiDB Cloud console)
    *   `DB_PORT=4000` (TiDB sử dụng cổng 4000 thay vì 3306)
    *   `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` tương ứng.
    *   `MYSQL_ATTR_SSL_CA=storage/certs/isrgrootx1.pem` (Bắt buộc để kết nối TiDB Cloud).
3.  **Cấu hình Cloudinary:**
    Lấy `API Key`, `API Secret`, `Cloud Name` điền vào các biến `CLOUDINARY_...`.
4.  **Cấu hình Firebase (BẮT BUỘC):**
    *   Tải file Private Key JSON từ: *Firebase Console -> Project Settings -> Service Accounts*.
    *   Đổi tên file thành `firebase-credentials.json`.
    *   Đưa vào thư mục: `backend/storage/firebase-credentials.json`.
5.  **Khởi động Backend:**
    ```bash
    php artisan key:generate
    php artisan migrate:fresh --seed
    php artisan serve
    ```

---

### 3. Cấu hình Frontend (Next.js)
Vào thư mục con: `cd frontend`

1.  **Cài đặt thư viện:**
    ```bash
    npm install
    ```
2.  **Thiết lập file Môi trường:**
    Copy `.env.example` thành `.env.local` và điền:
    *   `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
    *   Thông tin Web App của Firebase (apiKey, authDomain, projectId...).
    *   `NEXT_PUBLIC_PUSHER_APP_KEY`: Dùng chung với Backend.
3.  **Khởi động Frontend:**
    ```bash
    npm run dev
    ```

---

## 🛡️ Bảo mật & Git (Lưu ý Tuyệt đối)

Dự án đã được cấu hình `.gitignore` cực kỳ nghiêm ngặt để bảo vệ Token và API Key của bạn.
- **KHÔNG BAO GIỜ** đẩy file `.env` hoặc `firebase-credentials.json` lên Git.
- Nếu bạn lỡ đẩy file nhạy cảm, hãy chạy lệnh sau để gỡ bỏ chúng khỏi bộ nhớ đệm của Git (Git cache):
  ```bash
  git rm --cached backend/storage/firebase-credentials.json
  git rm --cached backend/.env
  git rm --cached frontend/.env.local
  ```

---

## 🛠️ Giải quyết các Lỗi thường gặp (Troubleshooting)

### 1. Lỗi: `Module not found: Can't resolve 'recharts'`
*   **Nguyên nhân:** Thư viện vẽ biểu đồ chưa được cài đặt.
*   **Cách sửa:** Chạy `npm install recharts` trong thư mục `frontend`.

### 2. Lỗi: `Can't connect to MySQL server on ... (10060)` (TiDB)
*   **Nguyên nhân:** Thường do sai Port (mặc định Laravel là 3306) hoặc chưa bật SSL.
*   **Cách sửa:** 
    *   Kiểm tra `DB_PORT` phải là `4000`.
    *   Đảm bảo `MYSQL_ATTR_SSL_CA` trỏ đúng đến file `.pem` trong `storage/certs`.
    *   Kiểm tra Allow-list IP trên TiDB Cloud console.

### 3. Lỗi: `Firebase initialization failed`
*   **Nguyên nhân:** Thiếu file `firebase-credentials.json` ở Backend hoặc sai config ở Frontend.
*   **Cách sửa:** Kiểm tra đường dẫn file trong `.env` Backend (`FIREBASE_CREDENTIALS`). Đảm bảo file JSON đó là hợp lệ.

### 4. Lỗi: `CORS Error` khi gọi API
*   **Cách sửa:** Kiểm tra file `backend/config/cors.php`. Đảm bảo `allowed_origins` chứa đúng URL của Frontend (`http://localhost:3000`).

---

## 📈 Dashboard Admin
Trang quản trị của dự án tích hợp hệ thống BI (Business Intelligence) mini sử dụng **Recharts** để theo dõi:
- Biểu đồ vùng (Area Chart): Doanh thu và lợi nhuận 7 ngày gần nhất.
- Biểu đồ cột (Bar Chart): Phân tích rủi ro và các cảnh báo hành vi bất thường của người dùng.
- Theo dõi Realtime các hành vi gian lận thông qua AI Security.

---
**ShopDee Team** - *Chúc bạn có những giây phút lập trình tuyệt vời!* 🚀
