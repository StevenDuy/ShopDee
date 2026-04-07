<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ActionLog;
use Illuminate\Support\Facades\Storage;
use League\Csv\Writer;

class ExportAIData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:export-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export AI training dataset from action_logs table to CSV';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting data export...');

        $actionLogs = ActionLog::all();

        if ($actionLogs->isEmpty()) {
            $this->error('No data found in action_logs table.');
            return;
        }

        // Prepare CSV data
        $csvData = [];
        $csvData[] = [
            'id',
            'user_id',
            'type',
            'lat',
            'lng',
            'is_anomaly',
            'duration_ms',
            'distance_jump',
            'wrong_password_attempts',
            'address_changes',
            'click_speed_ms',
            'purchase_quantity',
            'purchase_value',
            'click_count',
        ];

        foreach ($actionLogs as $log) {
            $payload = $log->payload ?? [];
            $durationMs = $payload['duration_ms'] ?? 0;
            $distanceJump = $payload['distance_jump'] ?? 0;
            $wrongPasswordAttempts = $payload['wrong_password_attempts'] ?? 0;
            $addressChanges = $payload['address_changes'] ?? 0;
            $clickSpeedMs = $payload['click_speed_ms'] ?? 0;
            $purchaseQuantity = $payload['purchase_quantity'] ?? 0;
            $purchaseValue = $payload['purchase_value'] ?? 0;
            $clickCount = $payload['click_count'] ?? 0;

            $csvData[] = [
                $log->id,
                $log->user_id,
                $log->type,
                $log->lat,
                $log->lng,
                $log->is_anomaly ? 1 : 0,
                $durationMs,
                $distanceJump,
                $wrongPasswordAttempts,
                $addressChanges,
                $clickSpeedMs,
                $purchaseQuantity,
                $purchaseValue,
                $clickCount,
            ];
        }

        // Write to CSV
        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= implode(',', array_map(function($value) {
                return '"' . str_replace('"', '""', $value) . '"';
            }, $row)) . "\n";
        }

        $csvPath = storage_path('app/ai_dataset.csv');
        file_put_contents($csvPath, $csvContent);

        $this->info("Data exported successfully to {$csvPath}");
    }
}
