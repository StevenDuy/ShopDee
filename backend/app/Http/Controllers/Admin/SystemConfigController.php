<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemConfigController extends Controller
{
    /**
     * Get all system settings
     */
    public function index(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $settings = SystemSetting::all();
        
        // Return keyed associative array for easier frontend parsing
        $keyed = [];
        foreach ($settings as $setting) {
            $keyed[$setting->key] = [
                'value' => $setting->value,
                'type' => $setting->type,
                'group' => $setting->group,
            ];
        }

        return response()->json($keyed);
    }

    /**
     * Update multiple settings at once
     */
    public function update(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.type' => 'sometimes|string',
            'settings.*.group' => 'sometimes|string',
        ]);

        foreach ($request->settings as $item) {
            SystemSetting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => $item['value'],
                    'type'  => $item['type'] ?? 'string',
                    'group' => $item['group'] ?? 'general'
                ]
            );
        }

        return response()->json(['message' => 'System settings updated successfully.']);
    }

    /**
     * Helper to retrieve specific public configs via separate endpoint if needed 
     * (e.g., getting platform fee during checkout without admin auth).
     * Currently not implemented, but reserved.
     */
}
