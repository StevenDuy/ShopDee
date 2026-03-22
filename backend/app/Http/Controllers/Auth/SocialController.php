<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $user = User::where('google_id', $googleUser->id)
                        ->orWhere('email', $googleUser->email)
                        ->first();

            if ($user) {
                // Nếu chưa có google_id thì cập nhật (trường hợp user đã đăng ký bằng email trước đó)
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->id,
                        'google_token' => $googleUser->token,
                    ]);
                }

                $token = $user->createToken('auth-token')->plainTextToken;
                
                // Redirect về frontend với token
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
                return redirect($frontendUrl . '/login/success?token=' . $token);
            }

            // Nếu người dùng chưa tồn tại, chuyển hướng sang trang chọn vai trò trên frontend
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $params = http_build_query([
                'email' => $googleUser->email,
                'name' => $googleUser->name,
                'google_id' => $googleUser->id,
                'google_token' => $googleUser->token,
                'needs_role' => 'true'
            ]);

            return redirect($frontendUrl . '/register/google?' . $params);

        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?error=google_auth_failed');
        }
    }

    public function completeGoogleRegistration(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'google_id' => 'required',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'google_id' => $request->google_id,
            'google_token' => $request->google_token,
            'role_id' => $request->role_id,
            'password' => bcrypt(Str::random(16)), // Mật khẩu ngẫu nhiên cho user Google
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('role'),
            'token' => $token,
        ]);
    }
}
