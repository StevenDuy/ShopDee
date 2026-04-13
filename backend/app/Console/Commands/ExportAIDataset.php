<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ExportAIDataset extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:export-dataset';
    protected $description = 'Xuất dữ liệu hành vi thực tế từ ActionLog ra CSV để huấn luyện AI';

    public function handle()
    {
        $logs = \App\Models\ActionLog::all();
        $path = storage_path('app/ai_dataset.csv');
        
        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $file = fopen($path, 'w');

        // Header khớp với train.py mới
        fputcsv($file, [
            'type', 'lat', 'lng', 'duration_ms', 'distance_km',
            'wrong_password_attempts', 'nav_time_ms', 'purchase_value',
            'avg_purchase_value', 'click_speed_ms', 'is_anomaly'
        ]);

        foreach ($logs as $log) {
            // Ưu tiên nhãn do AI hoặc Admin gán nhãn thực tế
            $isAnomaly = $log->is_fraud_labeled ? 1 : ($log->is_anomaly ? 1 : 0);

            fputcsv($file, [
                $log->type,
                $log->lat ?: 0,
                $log->lng ?: 0,
                $log->duration_ms ?: 0,
                $log->distance_km ?: 0,
                $log->wrong_password_attempts ?: 0,
                $log->nav_time_ms ?: 0,
                $log->purchase_value ?: 0,
                $log->avg_purchase_value ?: 0,
                $log->payload['click_speed_ms'] ?? 0,
                $isAnomaly
            ]);
        }

        fclose($file);
        $this->info("Đã xuất " . $logs->count() . " bản ghi hành vi vào: " . $path);
    }
}
