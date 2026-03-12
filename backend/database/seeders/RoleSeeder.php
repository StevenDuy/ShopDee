<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'slug' => 'admin'],
            ['name' => 'Seller', 'slug' => 'seller'],
            ['name' => 'Customer', 'slug' => 'customer'],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::firstOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
