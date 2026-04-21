# 🚀 ShopDee - Ultimate Setup & Installation Guide (Step-by-Step)

Welcome to ShopDee! This comprehensive guide is designed to help anyone—even those with no prior programming experience—install and run the system successfully.

---

## 📋 PHASE 1: PREREQUISITES (One-Time Setup)

Before you begin, ensure you have the following three tools installed on your computer:
1. **XAMPP**: To run the database. [Download here](https://www.apachefriends.org/download.html).
2. **Node.js**: To run the user interface (Frontend). [Download LTS version here](https://nodejs.org/).
3. **Composer**: To run the source code (Backend). [Download here](https://getcomposer.org/).

---

## 🛠️ PHASE 2: ACQUIRING API KEYS (Crucial)

The system requires several "keys" for integration. Copy these into a temporary Notepad file to prepare for configuration.

### 1. CLOUDINARY (For storing product images)
1. Go to [Cloudinary](https://cloudinary.com/) -> Register for a free account.
2. On your Dashboard, find and save: **Cloud Name**, **API Key**, and **API Secret**.

### 2. PUSHER (For real-time messaging)
1. Go to [Pusher](https://pusher.com/) -> Register for an account.
2. Click **Create App**:
   - App Name: `ShopDee`.
   - Cluster: `ap1 (Asia Pacific)`.
3. Go to the **App Keys** menu on the left and save: `app_id`, `key`, `secret`, and `cluster`.

### 3. GMAIL APP PASSWORD (For automated emails)
1. Go to [Your Google Account - App Passwords](https://myaccount.google.com/apppasswords).
2. Log in and create an app password for "ShopDee".
3. Google will provide a **16-character code**. This is your application's email password.

### 4. GOOGLE AUTH (For Google Social Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project -> Under **OAuth consent screen**, select `External` and fill in the app details.
3. Under **Credentials** -> Click **Create Credentials** -> **OAuth client ID**.
   - Select **Web Application**.
   - **IMPORTANT:** In the **Authorized redirect URIs** field, enter: `http://localhost:8000/api/auth/google/callback`. (If using Cloudflare later, replace `http://localhost:8000` with your Cloudflare URL).
4. Save the **Client ID** and **Client Secret**.

---

## ⚙️ PHASE 3: SYSTEM CONFIGURATION

### Step 1: Open Project Folder
Open the `ShopDee` folder on your computer. You will see two subfolders: `backend` and `frontend`.

### Step 2: Configure Backend (Server)
1. Open the `backend` folder and find the `.env` file.
2. Paste the API keys you collected in Phase 2 into the corresponding lines:
   - `CLOUDINARY_URL`, `CLOUDINARY_CLOUD_NAME`, etc.
   - `PUSHER_APP_ID`, `PUSHER_APP_KEY`, etc.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
   - `GOOGLE_REDIRECT_URL`: Your login API address (Crucial).
   - `FRONTEND_URL`: Your web address (Default is `http://localhost:3000`).
   - `MAIL_USERNAME`: (Your Email) and `MAIL_PASSWORD`: (16-character code from Phase 2, Step 3).

> [!TIP]
> **PROD MODE (USING CLOUDFLARE):** You must change `FRONTEND_URL` to your Cloudflare website link so that Google Login redirects back to the correct site instead of localhost.

### Step 3: Configure Frontend (UI)
1. Open the `frontend` folder and find the `.env.local` file.
2. Fill in the following:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_PUSHER_APP_KEY="Your Pusher Key"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="Your Google Client ID"
   ```

---

## 🚀 PHASE 4: RUNNING THE PROJECT

### Step 1: Start Database (XAMPP)
1. Open the XAMPP Control Panel.
2. Click **Start** for **Apache** and **MySQL**.
3. Open your browser and go to `localhost/phpmyadmin`. Click **New** to create a database named `shopdee`.

### Step 2: Run Backend (Open a New Terminal window)
1. Navigate to the `backend` folder in Terminal or CMD.
2. Run the following commands (press Enter after each):
   ```bash
   composer install
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```
   *Keep this window open.*

### Step 3: Run Frontend (Open ANOTHER Terminal window)
1. Navigate to the `frontend` folder in Terminal.
2. Run the following commands:
   ```bash
   npm install
   npm run dev
   ```
   *Keep this window open.* You can now visit `localhost:3000` to view the website.

---

## 🌐 PHASE 5: BRINGING WEB TO INTERNET (FIXED CLOUDFLARE TUNNEL)

To establish a professional web address (e.g., `https://your-domain.com`), follow these steps:

### 1. Domain & Cloudflare Preparation
- You must own a domain and point its **Nameservers** to Cloudflare so the status is **Active**.
- Download `cloudflared.exe` and place it in the ShopDee root directory.

### 2. Connection Setup (One-Time Only)
Open Terminal in the root directory and run:
1. **Login:** `.\cloudflared.exe login` (Select your domain on the web page).
2. **Create Tunnel:** `.\cloudflared.exe tunnel create shopdee-tunnel` -> Save the long ID displayed.
3. **Route DNS Records Automatically:**
   - For Main Web: `.\cloudflared.exe tunnel route dns shopdee-tunnel your-domain.com`
   - For API: `.\cloudflared.exe tunnel route dns shopdee-tunnel api.your-domain.com`

### 3. Configure `cloudflare-config.yml`
Create a `cloudflare-config.yml` file in the root directory with the following content:
```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<Your_Name>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - hostname: api.your-domain.com
    service: http://localhost:8000
  - service: http_status:404
```

### 4. Codebase Update (CRITICAL)
To ensure the system recognizes the new domain, you **must** edit the following:
- **Backend (`backend/.env`):**
   - `APP_URL=https://api.your-domain.com`
   - `FRONTEND_URL=https://your-domain.com`
   - `SANCTUM_STATEFUL_DOMAINS=your-domain.com`
- **Frontend (`frontend/.env.local`):**
   - `NEXT_PUBLIC_API_URL=https://api.your-domain.com/api`

### 5. Launch Tunnel
Whenever you want to go live, run:
```powershell
.\cloudflared.exe tunnel --config cloudflare-config.yml run
```

> [!TIP]
> You can use the `s.ps1` script to automatically start all services along with the Tunnel.

---
> [!CAUTION]
> **CONFIGURATION ERROR:** If you forget to provide any API key from Phase 2, the system will display a WARNING BANNER blocking the entire site. You must fill in all keys and restart the server to clear it.

---
🚀 **ShopDee Team** - *Wishing you success on your journey to becoming an expert!*
