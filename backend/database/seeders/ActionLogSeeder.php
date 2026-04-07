<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ActionLog;
use App\Models\User;
use Faker\Factory as Faker;

class ActionLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Ensure there are test users available for foreign key relationships.
        $userCount = User::count();
        if ($userCount < 20) {
            for ($i = 1; $i <= 20; $i++) {
                User::firstOrCreate(
                    ['email' => "ai-user-$i@example.com"],
                    [
                        'name' => "AI Test User $i",
                        'password' => bcrypt('password'),
                        'status' => 'active',
                    ]
                );
            }
        }

        $userIds = User::pluck('id')->toArray();

        // Tạo 500 bản ghi bình thường
        for ($i = 0; $i < 500; $i++) {
            ActionLog::create([
                'user_id' => $faker->randomElement($userIds),
                'type' => $faker->randomElement(['login', 'view_product', 'add_to_cart', 'checkout']),
                'lat' => $faker->latitude(10, 20), // Việt Nam
                'lng' => $faker->longitude(100, 110),
                'is_anomaly' => false,
                'payload' => [
                    'duration_ms' => $faker->numberBetween(100, 2000),
                    'distance_jump' => 0, // Bình thường
                ],
            ]);
        }

        // Tạo 500 bản ghi gian lận
        for ($i = 0; $i < 500; $i++) {
            $type = $faker->randomElement(['login', 'view_product', 'add_to_cart', 'checkout']);
            $payload = [];

            if ($type == 'login') {
                $payload = [
                    'duration_ms' => $faker->numberBetween(50, 500), // Nhanh bất thường
                    'distance_jump' => $faker->numberBetween(1000, 10000), // Teleport
                ];
            } elseif ($type == 'checkout') {
                $payload = [
                    'duration_ms' => $faker->numberBetween(10, 100), // Thanh toán nhanh
                    'distance_jump' => $faker->numberBetween(500, 5000),
                ];
            } else {
                $payload = [
                    'duration_ms' => $faker->numberBetween(100, 2000),
                    'distance_jump' => $faker->numberBetween(100, 1000),
                ];
            }

            ActionLog::create([
                'user_id' => $faker->randomElement($userIds),
                'type' => $type,
                'lat' => $faker->latitude(10, 20),
                'lng' => $faker->longitude(100, 110),
                'is_anomaly' => true,
                'payload' => $payload,
            ]);
        }
    }
}
