<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->load(['role', 'profile', 'addresses']));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $request->validate(['name' => 'sometimes|string|max:255']);
        $user->update($request->only('name'));

        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            $request->only(['phone', 'bio', 'avatar_url'])
        );

        return response()->json($user->load(['role', 'profile']));
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:8|confirmed',
        ]);
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Password changed successfully.']);
    }

    // Address CRUD
    public function addresses(Request $request)
    {
        return response()->json($request->user()->addresses()->get());
    }

    public function storeAddress(Request $request)
    {
        $request->validate([
            'type'           => 'required|in:shipping,billing,store',
            'address_line_1' => 'required|string',
            'city'           => 'required|string',
            'country'        => 'required|string',
        ]);
        $user = $request->user();
        if ($request->is_default) {
            $user->addresses()->update(['is_default' => false]);
        }
        $address = $user->addresses()->create($request->all());
        return response()->json($address, 201);
    }

    public function updateAddress(Request $request, int $id)
    {
        $address = $request->user()->addresses()->findOrFail($id);
        if ($request->is_default) {
            $request->user()->addresses()->update(['is_default' => false]);
        }
        $address->update($request->all());
        return response()->json($address);
    }

    public function deleteAddress(Request $request, int $id)
    {
        $request->user()->addresses()->findOrFail($id)->delete();
        return response()->json(['message' => 'Address deleted.']);
    }
}
