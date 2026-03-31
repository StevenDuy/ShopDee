<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class BehaviorLogService
{
    /**
     * Ghi lại hành vi người dùng vào database phục vụ AI.
     */
    public function log(string $type, array $payload = [], ?float $lat = null, ?float $lng = null, bool $isAnomaly = false)
    {
        return DB::table('action_logs')->insert([
            'user_id' => Auth::id(),
            'type' => $type,
            'payload' => json_encode($payload),
            'lat' => $lat,
            'lng' => $lng,
            'is_anomaly' => $isAnomaly,
            'created_at' => now(),
        ]);
    }

    /**
     * Shortcut để ghi lại tọa độ (GPS Tick)
     */
    public function logGps(float $lat, float $lng, bool $isAnomaly = false)
    {
        return $this->log('GPS_TICK', [], $lat, $lng, $isAnomaly);
    }
}
