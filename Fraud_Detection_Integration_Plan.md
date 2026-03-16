# Kế hoạch Tích hợp Chi tiết: Phát hiện Rủi ro Gian lận dựa trên Hành vi Tài khoản (RF vs SVM)

Tài liệu này cung cấp hướng dẫn từng bước để triển khai hệ thống nghiên cứu so sánh giữa **Random Forest (RF)** và **Support Vector Machine (SVM)**, tích hợp trực tiếp vào nền tảng ShopDee.

---

## 1. Đánh giá sự đáp ứng yêu cầu (Compliance Review)

Hệ thống này được thiết kế để đáp ứng chính xác các mục tiêu nghiên cứu của bạn:
*   **Mục tiêu so sánh:** Triển khai song song cả RF và SVM để đánh giá hiệu năng (Accuracy, Time, F1) trong cùng một môi trường.
*   **Hành vi tài khoản:** Tập trung vào các đặc trưng phi tài chính (Hành vi):
    *   `failed_login_attempts`: Theo dõi đăng nhập sai.
    *   `time_to_checkout`: Đo tốc độ thao tác (phát hiện bot).
    *   `ip_distance`: Khoảng cách địa lý truy cập.
    *   `amount_deviation`: Độ lệch chi tiêu so với lịch sử.
*   **Kiến trúc 3 tầng:** Tách biệt rõ ràng Frontend (Next.js), Backend (Laravel), và ML Engine (Python/FastAPI).
*   **Xử lý dữ liệu:** Bao gồm bước SMOTE (cân bằng dữ liệu) và Normalization (quan trọng cho SVM).

---

## 2. Hướng dẫn Triển khai Chi tiết (Step-by-Step)

### Bước 1: Chuẩn bị Dữ liệu và Mô hình (Offline - Google Colab)
Bạn sẽ thực hiện bước này trên Colab để lấy các file mô hình đã huấn luyện.

1.  **Dataset:** Sử dụng bộ dữ liệu [IEEE-CIS Fraud Detection](https://www.kaggle.com/c/ieee-fraud-detection) (Kaggle).
2.  **Feature Engineering:** Tạo các cột dựa trên hành vi như đã mô tả.
3.  **Preprocessing:** 
    - `imbalanced-learn` (SMOTE).
    - `StandardScaler` từ `sklearn`.
4.  **Export:**
    - Sau khi `fit`, lưu mô hình:
      ```python
      import joblib
      joblib.dump(rf_model, 'fraud_rf_model.pkl')
      joblib.dump(svm_model, 'fraud_svm_model.pkl')
      joblib.dump(standard_scaler, 'scaler.pkl')
      ```

### Bước 2: Xây dựng Tầng ML Engine (Python Service)
Tạo thư mục `ml-engine` nằm ngoài thư mục frontend/backend của ShopDee.

1.  **Tạo file `requirements.txt`:**
    ```text
    fastapi
    uvicorn
    scikit-learn
    joblib
    pandas
    numpy
    ```
2.  **Tạo file `main.py`:**
    - Implement API nhận input, chuẩn hóa bằng `scaler.pkl`.
    - Gọi dự đoán từ cả 2 model.
    - Đo thời gian thực thi bằng `time.process_time()`.

### Bước 3: Tích hợp Tầng Backend (Laravel Gateway)
Laravel đóng vai trò "người điều phối" (Orchestrator).

1.  **Tạo Controller mới:** `php artisan make:controller Api/FraudDetectionController`
2.  **Log Logic:** Khi người dùng thực hiện các hành động (Login, Add to cart), Laravel sẽ ghi nhận vào bảng `user_activity_logs`.
3.  **Bridge Logic:**
    - Tại phương thức `simulateCheck` hoặc trong luồng `Checkout`, Laravel gọi tới Python Service:
    ```php
    $response = Http::post('http://localhost:5000/api/predict', $behaviorData);
    return $response->json();
    ```

### Bước 4: Tích hợp Tầng Ứng dụng Web (Frontend Next.js)
Đây là nơi hiển thị Dashboard so sánh cho công trình nghiên cứu.

1.  **Tạo Tracker Context:**
    - Tạo `src/context/BehaviorTracker.tsx` để ghi nhận: `pages_visited`, `start_time`, `click_count`.
2.  **Xây dựng Admin Dashboard (`/admin/fraud-analysis`):**
    - **Tab 1: Comparative Dashboard:** Dùng biểu đồ cột so sánh Accuracy, F1-Score của RF và SVM.
    - **Tab 2: Simulator:** Form nhập liệu tay các thông số (Login fails, IP...) -> Nhấn "Test" -> Hiển thị kết quả so sánh thời gian thực.

---

## 3. Cách Tính toán các "Đặc trưng Hành vi" trong ShopDee

Để hệ thống thực sự "hiểu" hành vi, chúng ta sẽ cài đặt logic tính toán tại Backend:

| Đặc trưng | Nguồn dữ liệu / Cách tính | Vai trò trong Fraud |
| :--- | :--- | :--- |
| **Login Fails** | Đếm số bản ghi `status=failed` trong bảng `login_attempts` của user ID trong 24h qua. | Dấu hiệu của Brute Force / Account Takeover. |
| **Time to Checkout** | `(Giờ bấm Pay) - (Giờ Login)` lấy từ Session. | Bot thường thanh toán trong < 10 giây. |
| **IP Distance** | Dùng thư viện GeoIP để lấy tọa độ IP hiện tại so với tọa độ IP gần nhất. | Dự đoán việc đánh cắp session từ nơi xa. |
| **Amount Deviation** | `(Đơn hiện tại) / (Trung bình 10 đơn trước đó)`. | Gian lận thường cố gắng mua món đồ đắt tiền nhất có thể. |

---

## 4. Hướng dẫn Quy trình tích hợp (Workflow)

1.  **Tạo thư mục:** Khởi tạo `fraud-engine` và cài đặt môi trường ảo Python (`venv`).
2.  **Copy mô hình:** Đưa 3 file `.pkl` từ Colab vào thư mục `models/` của engine.
3.  **Chạy server:** `uvicorn main:app --port 5000`.
4.  **Kiểm tra kết nối:** Dùng Postman test endpoint `/api/predict` để đảm bảo kết quả trả về đúng định dạng so sánh giữa RF và SVM.
5.  **Cập nhật Sidebar:** Thêm menu "Fraud Dashboard" vào file `src/components/admin/Sidebar.tsx` của ShopDee.

---

**Kết luận:** Quá trình này không chỉ là lập trình, mà là hiện thực hóa một bài toán Khoa học Dữ liệu vào một ứng dụng thực tế. Việc tích hợp này đáp ứng đầy đủ tiêu chí của một đề tài nghiên cứu chuyên sâu về an ninh thương mại điện tử.
