<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AI\BehaviorLogService;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class SimulateFraud extends Command
{
    protected $signature = 'ai:simulate-fraud {type}';
    protected $description = 'Giả lập các kịch bản gian lận để tạo dữ liệu cho AI (e.g., bot-click, gps-spoof, price-tamper)';

    public function handle(BehaviorLogService $logger)
    {
        $type = $this->argument('type');

        switch ($type) {
            case 'bot-click':
                $this->info("Đang giả lập Bot Click...");
                for ($i = 0; $i < 50; $i++) {
                    $logger->log('CLICK', ['product_id' => 1, 'agent' => 'GiaLapBot'], null, null, true);
                }
                break;

            case 'gps-spoof':
                $this->info("Đang giả lập Shipper nhẩy GPS (Anomalous moves)...");
                for ($i = 0; $i < 10; $i++) {
                    $logger->logGps(10.762622 + rand(-100, 100) / 1000, 106.660172 + rand(-100, 100) / 1000, true);
                }
                break;

            case 'price-tamper':
                $this->info("Đang giả lập gian lận thay đổi giá bất thường...");
                $product = DB::table('products')->first();
                if ($product) {
                    DB::table('products')->where('id', $product->id)->update([
                        'current_price' => $product->price * 0.1, // Giảm giá 90% bất thường
                        'is_anomaly' => true
                    ]);
                    $logger->log('PRICE_TAMPER', ['product_id' => $product->id, 'new_price' => $product->price * 0.1], null, null, true);
                }
                break;

            default:
                $this->error("Loại gian lận không hợp lệ. Chọn: bot-click, gps-spoof, price-tamper");
                return;
        }

        $this->info("Hoàn tất tạo dữ liệu giả lập gian lận!");
    }
}
