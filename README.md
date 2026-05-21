# 🚀 ShopDee - E-Commerce Platform with AI-Powered Behavioral Fraud Detection

Welcome to **ShopDee**! This is a modern e-commerce platform integrated with a real-time behavioral-based fraud detection system that comparatively evaluates two machine learning classifiers: **Random Forest (RF)** and **Support Vector Machine (SVM)**.

The system is engineered using a decoupled **Three-Tier Architecture** and supports dynamic environment variable configurations, enabling 100% offline local testing or seamless deployment to cloud platforms like Vercel and Render.

---

## 🖥️ 1. ShopDee Core Platform Features & Capabilities

Below is a detailed breakdown of the features implemented in the ShopDee ecosystem:

### 🛍️ Full-Featured E-Commerce Ecosystem
*   **Interactive Storefront:** A responsive catalog supporting product lookup, dynamic category filtering, client-side cart synchronization, and an streamlined checkout.
*   **Merchant Inventory Control (Seller Hub):** A dedicated interface allowing registered sellers to list products, upload media, update stock, and track current order statuses.
*   **Adaptive Media Hosting:** A flexible image storage pipeline utilizing the Laravel Storage Facade. Media uploads can be saved locally (`backend/storage/app/public`) for offline testing or routed to **Cloudinary** cloud storage simply by toggling `FILESYSTEM_DISK` in the `.env` settings.
*   **Secure Authentication & Social Login:** Standard email/password verification supplemented with **Google Social OAuth** configuration to streamline customer signups.

### 💬 Real-Time Messaging & Communications
*   **Peer-to-Peer Chat Hub:** A real-time chat interface connecting customers directly with merchants, allowing immediate order support.
*   **Dual WebSocket Brokering:** A dynamic WebSocket driver configuration. It utilizes **Laravel Reverb** for local offline socket serving (port 8080) and easily shifts to **Pusher Cloud** for production-grade scale without modifying the underlying client-side codebase.
*   **Live Event Dispatchers:** Immediate broadcast updates for order completions, inventory warnings, and message dispatches.

### 🛡️ AI Security & Anti-Fraud Suite
*   **Comparative Machine Learning Inference:** Evaluates transactional safety by piping behavioral telemetry to both **Random Forest (RF)** and **Support Vector Machine (SVM)** models simultaneously.
*   **Security Metrics Dashboard:** A analytical view for administrators displaying real-time comparisons of model performance metrics (Accuracy, F1-score, and processing latency in milliseconds).
*   **Interactive AI Simulator:** An administrative control panel enabling manual injection of custom telemetry (e.g., failed logins, checkout speed, spatial IP distance, price deviation) to instantly check classification scores.
*   **Advanced ML Training Pipeline:** The models leverage **SMOTE** (Synthetic Minority Over-sampling Technique) to combat class imbalance during offline training and run input vectors through standard scaling via `scaler.pkl`.

---

## 🛠️ 3. Step-by-Step Clone & Installation Guide

Follow these instructions to download and run the entire environment on your local machine:

### Step 1: System Prerequisites
Ensure you have installed the following tools:
1.  **XAMPP Control Panel** (To run Apache & MySQL).
2.  **Node.js** (LTS Version).
3.  **Composer** (PHP Package Manager).
4.  **Python 3.8+** (Added to your system's Environment Variables).

### Step 2: Clone the Repository
Open your Terminal or PowerShell and run:
```bash
git clone https://github.com/StevenDuy/ShopDee.git
cd ShopDee
```

### Step 3: Configure Environment Variables

#### 1. Setup Backend environment:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Duplicate the sample configuration file:
   ```bash
   copy .env.example .env
   ```
3. Open `.env` and verify that the local configurations are set as follows:
   ```ini
   FILESYSTEM_DISK=public
   BROADCAST_CONNECTION=reverb
   
   REVERB_APP_ID=123456
   REVERB_APP_KEY=shopdee_key
   REVERB_APP_SECRET=shopdee_secret
   REVERB_HOST=127.0.0.1
   REVERB_PORT=8080
   REVERB_SCHEME=http

   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

#### 2. Setup Frontend environment:
1. Return to the root folder, then open the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Create your local config file:
   ```bash
   copy .env.local.example .env.local
   ```
3. Verify that `.env.local` contains the following localhost mappings:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_PUSHER_APP_KEY=shopdee_key
   NEXT_PUBLIC_PUSHER_APP_CLUSTER=mt1
   NEXT_PUBLIC_PUSHER_HOST=127.0.0.1
   NEXT_PUBLIC_PUSHER_PORT=8080
   NEXT_PUBLIC_PUSHER_SCHEME=http
   ```

---

## 🚀 4. Executing the Project Cucko-style (Local Testing)

We have created an automated launcher script [s.ps1](file:///c:/Users/duyh1/Projects/ShopDee/s.ps1) to manage all background daemons.

### Step 1: Initialize Libraries & Databases (First-Time Only)

1.  **Install PHP libraries & create the public assets symlink:**
    ```powershell
    cd backend
    composer install
    php artisan key:generate
    php artisan storage:link
    ```
2.  **Seed the Database:**
    *   Open XAMPP Control Panel and start **Apache** and **MySQL**.
    *   Open your browser, go to `http://localhost/phpmyadmin`, and create a new schema named `shopdee`.
    *   Run migrations and populate mock store data:
        ```powershell
        php artisan migrate --seed
        ```
3.  **Install Node.js packages:**
    ```powershell
    cd ../frontend
    npm install
    ```
4.  **Install Python machine learning dependencies:**
    ```powershell
    cd ../shopdee-ai
    pip install -r requirements.txt
    ```

### Step 2: One-Click Execution
Navigate back to the root `ShopDee` directory, right-click [s.ps1](file:///c:/Users/duyh1/Projects/ShopDee/s.ps1) and choose **Run with PowerShell**, or execute the script in your terminal:
```powershell
./s.ps1
```

The script will automatically clear bound ports, boot the Laravel server (`:8000`), launch the Reverb WebSocket daemon (`:8080`), build the Next.js development bundle (`:3000`), and run the Python AI service (`:5000`).

---

## 🧪 5. Testing the Fraud Detection AI
1.  Navigate to the Admin Panel: `http://localhost:3000/admin/ai-security`.
2.  Open the **AI Simulator** tab.
3.  **Normal Transaction Test:** Enter safe inputs (Failed logins = 0, Time to checkout = 45s, IP distance = 2km, Deviation = 1.0) -> Click **Evaluate**. Both models will label the payload as `Safe`.
4.  **Fraud Attack Simulation:** Enter high-risk telemetry (Failed logins = 8, Time to checkout = 2.1s, IP distance = 980km, Deviation = 6.4) -> Click **Evaluate**. The ML Engine will immediately output `Fraud` notifications from both RF and SVM, graphing their decision speeds side-by-side.
