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

    public function testBroadcast(Request $request)
    {
        $message = $request->input('message', 'Hello from Laravel Reverb!');
        
        broadcast(new HelloReverbEvent($message));

        return response()->json(['status' => 'Message broadcasted', 'message' => $message]);
    }
}
