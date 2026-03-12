<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::firstOrCreate(
            ['email' => 'admin@shopdee.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password'), 'role_id' => 1]
        );

        \App\Models\User::firstOrCreate(
            ['email' => 'seller@shopdee.com'],
            ['name' => 'Seller User', 'password' => bcrypt('password'), 'role_id' => 2]
        );

        \App\Models\User::firstOrCreate(
            ['email' => 'customer@shopdee.com'],
            ['name' => 'Customer User', 'password' => bcrypt('password'), 'role_id' => 3]
        );
    }
}
