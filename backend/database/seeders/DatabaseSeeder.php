<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Insert Roles first to satisfy foreign key constraints
        \Illuminate\Support\Facades\DB::table('roles')->insertOrIgnore([
            ['id' => 1, 'name' => 'Admin', 'slug' => 'admin'],
            ['id' => 2, 'name' => 'Seller', 'slug' => 'seller'],
            ['id' => 3, 'name' => 'Customer', 'slug' => 'customer'],
        ]);

        // First run roles if we have RoleSeeder (assuming roles exist), but let's just make sure UserSeeder creates users.
        $this->call([
            UserSeeder::class,
        ]);
    }
}
