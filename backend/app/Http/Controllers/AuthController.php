<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\HelloReverbEvent;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $token = $user->createToken('test-token')->plainTextToken;
            
            return response()->json([
                'user' => $user->load('role'),
                'token' => $token,
            ]);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'code' => 'required|string|size:6',
        ]);

        // Kiểm tra mã OTP trước
        $otp = \App\Models\OtpVerification::where('email', $data['email'])
            ->where('code', $data['code'])
            ->where('purpose', 'registration')
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Mã xác thực không hợp lệ hoặc đã hết hạn.'], 422);
        }

        $user = \App\Models\User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($data['password']),
            'role_id' => $data['role_id'],
            'email_verified_at' => now(), // Đánh dấu đã xác thực ngay
        ]);

        // Dùng xong thì xóa đi
        $otp->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('role'),
            'token' => $token,
        ], 201);
    }

    /**
     * Tính năng đổi Email
     */
    public function changeEmail(Request $request)
    {
        $request->validate([
            'old_email_code' => 'required|string|size:6',
            'new_email' => 'required|email|unique:users,email',
            'new_email_code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        // 1. Xác thực OTP email cũ
        $otpOld = \App\Models\OtpVerification::where('email', $user->email)
            ->where('code', $request->old_email_code)
            ->where('purpose', 'change_email')
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpOld) {
            return response()->json(['message' => 'Mã xác thực email cũ không đúng.'], 422);
        }

        // 2. Xác thực OTP email mới
        $otpNew = \App\Models\OtpVerification::where('email', $request->new_email)
            ->where('code', $request->new_email_code)
            ->where('purpose', 'change_email') // Vẫn dùng chung purpose nhưng cho mail mới
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpNew) {
            return response()->json(['message' => 'Mã xác thực email mới không đúng.'], 422);
        }

        // 3. Cập nhật Email
        $user->update([
            'email' => $request->new_email,
            'email_verified_at' => now(),
        ]);

        // Cập nhật lại profie nếu cần
        if ($user->profile) {
            $user->profile->update(['contact_email' => $request->new_email]);
        }

        // Xóa mã
        $otpOld->delete();
        $otpNew->delete();

        return response()->json(['message' => 'Đổi email thành công.', 'user' => $user]);
    }

    public function testBroadcast(Request $request)
    {
        $message = $request->input('message', 'Hello from Laravel Reverb!');
        
        broadcast(new HelloReverbEvent($message));

        return response()->json(['status' => 'Message broadcasted', 'message' => $message]);
    }
}
