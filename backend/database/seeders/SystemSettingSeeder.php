<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'platform_fee',
                'value' => '5.0',
                'type' => 'numeric',
                'group' => 'finance'
            ],
            [
                'key' => 'shipping_base_rate',
                'value' => '10.00',
                'type' => 'numeric',
                'group' => 'platform'
            ],
            [
                'key' => 'tax_rate',
                'value' => '8.5',
                'type' => 'numeric',
                'group' => 'finance'
            ],
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'platform'
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
