# Hướng dẫn Tích hợp Module AI Security (Fraud Detection) vào ShopDee

Tài liệu này mô tả chi tiết bài toán, quy trình, kiến trúc hệ thống, và cách tích hợp Module "Phát hiện Gian lận Hành vi thông qua Random Forest và Support Vector Machine" vào nền tảng E-commerce ShopDee hiện tại.

---

## 1. Mục tiêu Nghiên cứu và Kiến trúc Hệ thống

Mục tiêu chính của đề tài là xây dựng một luồng đánh giá rủi ro gian lận thời gian thực (Real-time Fraud Risk Detection) dựa trên **Hành vi Người dùng (User Behavior)**, sau đó so sánh hiệu năng giữa hai thuật toán phổ biến: **Random Forest (RF)** và **Support Vector Machine (SVM)**.

Dự án ShopDee sẽ được mở rộng từ kiến trúc 2 tầng hiện tại thành **kiến trúc 3 tầng phân tán (3-tier architecture)** nhằm đảm bảo hiệu năng, độc lập phát triển và dễ dàng demo:

1. **Tầng Ứng dụng (Web Application - Next.js):**
   - Thu thập ngầm các thông số hành vi của người dùng (Customer) trong quá trình thao tác.
   - Cung cấp một **Dashboard (Admin Role)** hiển thị kết quả phân tích, biểu đồ so sánh hai mô hình (RF/SVM) và một "Công cụ Giả lập" (Simulator) để nhập liệu test.
2. **Tầng Backend & Dữ liệu (API Gateway - Laravel & MySQL):**
   - Lưu trữ dữ liệu hệ thống cơ bản và Log hành vi (User Behavior Log).
   - Laravel đóng vai trò là cầu nối: Nhận dữ liệu hành vi từ Frontend trong quá trình Checkout/Thanh toán, chuẩn bị định dạng dữ liệu và gọi API sang tầng Machine Learning.
3. **Tầng Xử lý Máy học (ML Engine - Python):**
   - Một Microservice độc lập viết bằng **FastAPI** hoặc **Flask**.
   - Cốt lõi của nghiên cứu: Chịu trách nhiệm Load các mô hình AI đã huấn luyện (SMOTE + RF & SVM).
   - Chạy logic tính toán nội bộ (Inference) và trả về kết quả dự đoán cùng các chỉ số đi kèm (Độ chính xác, Thời gian phản hồi).

---

## 2. Chi tiết: Khai thác "Đặc trưng Hành vi" (Behavioral Features)

Vì đề tài nhấn mạnh vào "Hành vi" (Behaviour-based) thay vì chỉ thông tin thẻ tín dụng, chúng ta cần số hóa các hành động của tài khoản thành các rủi ro.

Tại ShopDee, chúng ta sẽ thu thập các Vector Đặc Trưng (Feature Vector) sau cho mỗi luồng điểm chạm nhạy cảm (như lúc Login hoặc Checkout):

* **A. Nhóm Đặc trưng Tương tác (Interaction & Timing):**
  * `time_to_checkout`: Thời gian (giây) từ lúc đăng nhập/mở web đến lúc bấm "Đặt hàng". (Bot thường có thời gian cực kỳ ngắn, gần như lập tức).
  * `pages_viewed`: Số lượng các trang khác nhau người dùng xem trước khi mua (Hành vi người dùng thực thường đi tham khảo nhiều nơi).
* **B. Nhóm Đặc trưng Điểm truy cập (Network & Identity):**
  * `ip_distance`: Khoảng cách địa lý ước tính từ IP hiện tại đến IP thường xuyên sử dụng nhất của tài khoản (tính bằng km).
  * `device_changed`: `1` (Thiết bị mới/lạ) hoặc `0` (Thiết bị quen thuộc).
  * `failed_login_attempts`: Số lần đăng nhập sai liên tiếp trước khi thành công.
* **C. Nhóm Đặc trưng Giao dịch (Transactional Pattern):**
  * `order_amount`: Tổng số tiền đơn hàng hiện tại.
  * `amount_deviation_ratio`: Tỷ lệ lệch của số tiền đơn hàng hiện tại so với *số tiền trung bình* trong lịch sử giao dịch của user này (Sự bất thường).
  * `orders_in_last_hour`: Tần suất/Số lượng đơn hàng tài khoản đã đặt trong 1 giờ qua (Spam/Carding attack).
  * `address_changed_suddenly`: `1` hoặc `0` (vừa được thêm mới/đổi mới hoàn toàn ngay trước khi thanh toán).

**Cách triển khai thu thập:**
* Trên Next.js (Customer Role): Cài đặt một Tracker Context (dùng `useEffect`) để đếm thời gian và ghi nhận các trang đã xem. Khi gọi API `/orders`, gửi đính kèm object `behavior_features: {...}` về cho Laravel.

---

## 3. Xây dựng ML Engine (Python Service)

Không nên chạy model ML chung trên nền PHP. Cần khởi tạo 1 thư mục riêng biệt (VD: `ml-engine`) chứa server Python.

### 3.1 Giai đoạn Huấn luyện (Preprocessing & Training - Offline)
Chúng ta sẽ sử dụng File Notebook (.ipynb) với thư viện `scikit-learn` trên dữ liệu E-commerce Fraud Dataset (VD: IEEE-CIS) để:
1. **Trích xuất đặc trưng (Feature Engineering):** Gắn các cột tương tự như mục 2 ở trên.
2. **Tiền xử lý (Preprocessing):**
   - **Xử lý mất cân bằng lớp (Imbalanced Data):** Gian lận chiếm < 1%. Sử dụng kỹ thuật **SMOTE** (Synthetic Minority Over-sampling Technique) để nội suy tăng dữ liệu mẫu gian lận, giúp mô hình học chính xác hơn.
   - **Chuẩn hóa dữ liệu (Normalization/Scaling):** Sử dụng `StandardScaler`. (Bước này **cực kì quan trọng đối với SVM**, vì dải dữ liệu `order_amount` lớn sẽ làm lệch thuật toán chia hyperplane. RF thì dùng Decision Tree nên ít bị ảnh hưởng hơn).
3. **Huấn luyện mô hình:**
   - `RandomForestClassifier`: Tinh chỉnh (hyper-tuning) số lượng cây `n_estimators`, độ sâu `max_depth`.
   - `SVC` (Support Vector Classifier): Tinh chỉnh Kernel (`RBF`, `Linear`), `C`, và `Gamma`. Lấy ra vector probability (`probability=True`).
4. **Đánh giá hiệu năng:** Tính các chỉ số Accuracy, Precision, Recall, F1-Score lưu lại file config tĩnh. Export mô hình ra 2 files: `rf_model.pkl` và `svm_model.pkl`.

### 3.2 Giai đoạn Khai thác (Inference API - Online)
Xây dựng file `main.py` (FastAPI) chạy ở cổng `:5000` với 2 API chính:

* **`GET /api/ml/metrics`**: Trả về các chỉ số tĩnh lúc training (Accuracy, Precision, Recall, F1, Train Time) của 2 thuật toán để NextJS vẽ biểu đồ so sánh bên trong Admin Dashboard.
* **`POST /api/ml/predict`**: 
  - *Input:* JSON chứa Vector Cấu hình hành vi (từ bước 2).
  - *Pipeline:* Đọc Vector -> Chạy qua `scaler` -> Kích hoạt 2 luồng tính toán (RF & SVM) -> Đo thời gian chờ (Inference time).
  - *Output:*
    ```json
    {
      "results": {
        "random_forest": { "is_fraud": 0, "probability": 0.15, "inference_time_ms": 12 },
        "svm": { "is_fraud": 1, "probability": 0.62, "inference_time_ms": 45 }
      }
    }
    ```

---

## 4. Tích hợp Hệ thống: Web Demo Component (Admin Role)

Để hoàn thiện kiến trúc, trên bộ giao diện Admin của hệ thống ShopDee (Menu nằm ở Sidebar bên trái), chúng ta sẽ thêm một module **AI Security Dashboard & Simulator**.

Trang này có 2 chức năng cốt lõi bắt buộc phải có để minh họa nghiên cứu:

### Giao diện 1: So sánh Hiệu năng (Model Comparative Analysis)
* Sử dụng thư viện `recharts` / `chart.js` để render nhóm biểu đồ:
  * **Radar Chart / Bar Chart:** Trực quan hóa so sánh độ chính xác `Accuracy`, `Precision`, `Recall`, `F1-score` giữa RF và SVM để chứng minh cái nào tối ưu hơn cho bài toán gian lận.
  * **Performance Metrics:** Bảng so sánh "Thời gian Huấn Luyện (Training Time)" và "Thời gian Dự đoán (Inference Time)".
  * Đưa ra nhận xét (VD: RF thì huấn luyện lâu nhưng khả năng phán đoán ở môi trường production nhanh hơn, ít bị nhạy cảm bởi giá trị ngoại lai, trong khi SVM dự đoán chậm hơn nhưng...).

### Giao diện 2: Kiểm thử Rủi ro Giả lập (Live Behavior Simulator)
Đây là công cụ kiểm tra mô hình một cách trực tiếp ngay trên web:
* Một biểu mẫu (Form) cho phép người dùng (cụ thể là Hội đồng chấm/Giáo viên) tùy ý điều chỉnh các giả định thông số:
  * Ví dụ: Kéo thanh trượt `time_to_checkout = 1s`, nhập `failed_login_attempts = 5`, chọn `device_changed = true`.
* Nút bấm **"Run Fraud Detection Analysis"**.
* **Luồng xử lý:** 
  1. Frontend đóng gói Input -> Gửi cho Backend Laravel.
  2. Laravel call thông qua Python API -> Python xử lý và trả kết quả về.
  3. Frontend hiển thị output thành 2 bảng kề nhau.
      - **Random Forest Insight:** "Gian lận (92%) - Tín hiệu cảnh báo: Thời gian checkout < 2s."
      - **Support Vector Machine Insight:** "Gian lận (89%) - Cảnh báo: Lịch sử nạp tiền lệch chuẩn."
  4. Hệ thống quyết định đưa ra (Ví dụ khóa tài khoản hoặc cho phép tiếp tục) nếu Tỉ lệ Rủi ro vượt ngưỡng chung.

---

## 5. Quy trình & Các Bước Triển Khai (Roadmap)

Nếu bắt đầu tích hợp, chúng ta sẽ thực hiện theo trình tự sau:

* **Bước 1 (Xây dựng Model & Mock API):** Setup Python API độc lập với FastAPI. Có thể ban đầu trả về dữ liệu Mock JSON cứng để dev Web giao diện trước.
* **Bước 2 (API Gateway - Laravel):** Viết `AiSecurityController.php` ở backend Laravel, làm nhiệm vụ bảo mật giao tiếp, lấy danh sách Model Metrics, nhận dữ liệu giả lập để forward tới Python.
* **Bước 3 (Admin UI Construction):** Cập nhật `Sidebar.tsx` trong frontend Next.js -> Tạo trang `/admin/ai-security`. Thêm Chart. Thêm Input Form.
* **Bước 4 (Customer Checkout Hooking):** (Khuyến nghị/Nâng cao): Gắn thuật toán ghi nhận log thực tế vào các luồng thao tác của Customer trên frontend để làm bằng chứng cho tính thực tiễn của công trình.

Bản thân file hướng dẫn này có vai trò như bảng "Thiết kế Kiến Trúc Chuyên Sâu" giúp bạn dễ dàng định hình và tự tin thuyết trình về hệ thống thông minh, phân bổ rõ trách nhiệm 3 môi trường Next.js - Laravel - Data Science.
