<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpVerification;
use App\Models\User;
use App\Mail\OtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    /**
     * Gửi mã OTP
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'purpose' => 'required|in:registration,reset_password,change_email',
        ]);

        $email = $request->email;
        $purpose = $request->purpose;

        // Nếu là reset_password, kiểm tra email tồn tại chưa
        if ($purpose === 'reset_password' || $purpose === 'change_email') {
             if (!User::where('email', $email)->exists() && $purpose === 'reset_password') {
                return response()->json(['message' => 'Email không tồn tại trong hệ thống.'], 404);
             }
        }

        // Tạo mã OTP 6 chữ số
        $otpCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        // Xóa mã cũ cùng purpose (nếu có)
        OtpVerification::where('email', $email)->where('purpose', $purpose)->delete();

        // Lưu vào DB
        OtpVerification::create([
            'email' => $email,
            'code' => $otpCode,
            'purpose' => $purpose,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        // Gửi Mail
        try {
            Mail::to($email)->send(new OtpMail($otpCode, $purpose));
            return response()->json(['message' => 'Mã OTP đã được gửi đến email của bạn.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi khi gửi email. Hãy kiểm tra cấu hình Mail.'], 500);
        }
    }

    /**
     * Xác thực OTP
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'purpose' => 'required|in:registration,reset_password,change_email',
        ]);

        $otp = OtpVerification::where('email', $request->email)
            ->where('code', $request->code)
            ->where('purpose', $request->purpose)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Mã xác thực không hợp lệ hoặc đã hết hạn.'], 422);
        }

        return response()->json(['message' => 'Xác thực mã OTP thành công.', 'status' => true]);
    }

    /**
     * Khôi phục mật khẩu (Reset Password)
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Kiểm tra OTP lại một lần nữa
        $otp = OtpVerification::where('email', $request->email)
            ->where('code', $request->code)
            ->where('purpose', 'reset_password')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Phiên làm việc hết hạn hoặc OTP không đúng.'], 422);
        }

        // Cập nhật mật khẩu
        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Xóa mã OTP sau khi dùng xong
        $otp->delete();

        return response()->json(['message' => 'Mật khẩu đã được thay đổi thành công. Bạn có thể đăng nhập ngay.']);
    }
}
