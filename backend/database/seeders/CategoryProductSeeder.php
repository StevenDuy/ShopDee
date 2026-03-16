<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class CategoryProductSeeder extends Seeder
{
    private function optimizeImg($id, $w = 800) {
        return "https://images.unsplash.com/photo-" . $id . "?auto=format&fit=crop&w=" . $w . "&q=75";
    }

    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        ProductOptionValue::truncate();
        ProductOption::truncate();
        ProductMedia::truncate();
        Product::truncate();
        Category::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $categories = [
            'Thiết bị Điện tử' => ['Điện thoại di động', 'Laptop & Máy tính', 'Máy tính bảng'],
            'Phụ kiện công nghệ' => ['Phụ kiện âm thanh', 'Chuột & Bàn phím', 'Pin & Cáp sạc'],
            'Thời trang' => ['Áo thun', 'Quần Jean', 'Giày thể thao']
        ];

        $catIds = [];
        foreach ($categories as $parent => $children) {
            $p = Category::create(['name' => $parent, 'slug' => Str::slug($parent), 'is_active' => true]);
            foreach ($children as $child) {
                $c = Category::create(['name' => $child, 'slug' => Str::slug($child), 'parent_id' => $p->id, 'is_active' => true]);
                $catIds[] = $c->id;
            }
        }

        $seller = User::where('role_id', 2)->first() ?? User::factory()->create(['role_id' => 2]);
        
        // Base images for variety
        $images = [
            '1695048133142-1a20484d2569', '1646733230588-cf49fb87a99f', '1517336714731-489689fd1ca8', 
            '1603302576837-37561b2e2302', '1606220588913-b3aecb471549', '1615663245857-ac1eeb536688',
            '1595225476474-87563907a212', '1631505206896-1c8888b1f5fc', '1523275335684-37898b6baf30',
            '1505740420928-5e560c06d30e', '1583394838336-acd99d9a5817', '1491553895911-0055eca6402d'
        ];

        $adjectives = ['Cao cấp', 'Chính hãng', 'Giá rẻ', 'Xịn xò', 'Thế hệ mới', 'Siêu bền', 'Limited Edition'];
        $productNames = ['Sản phẩm', 'Thiết bị', 'Phụ kiện', 'Combo', 'Mẫu mới'];

        for ($i = 1; $i <= 60; $i++) {
            $catId = $catIds[array_rand($catIds)];
            $name = $adjectives[array_rand($adjectives)] . " " . $productNames[array_rand($productNames)] . " #" . $i;
            $price = rand(100, 5000) * 10000;
            
            $p = Product::create([
                'seller_id' => $seller->id,
                'category_id' => $catId,
                'title' => $name,
                'slug' => Str::slug($name) . "-" . Str::random(5),
                'description' => "Mô tả chi tiết cho " . $name . ". Sản phẩm chất lượng cao, bảo hành chính hãng. Đáp ứng mọi nhu cầu của người dùng trong phân khúc.",
                'price' => $price,
                'sale_price' => rand(0, 1) ? $price * 0.9 : null,
                'stock_quantity' => rand(50, 200),
                'status' => 'active',
                'sku' => "SKU-" . strtoupper(Str::random(8))
            ]);

            ProductMedia::create([
                'product_id' => $p->id,
                'media_type' => 'image',
                'url' => $this->optimizeImg($images[array_rand($images)]),
                'is_primary' => true
            ]);

            // Add Options (some products only)
            if ($i % 3 === 0) {
                $option = ProductOption::create(['product_id' => $p->id, 'option_name' => 'Màu sắc']);
                $colors = ['Trắng', 'Đen', 'Xanh', 'Đỏ'];
                foreach (array_slice($colors, 0, 2) as $c) {
                    $pv = ProductOptionValue::create([
                        'product_option_id' => $option->id,
                        'option_value' => $c,
                        'price_adjustment' => 0,
                        'stock_quantity' => 50,
                        'parent_id' => null
                    ]);

                    // Sub options
                    ProductOptionValue::create(['product_option_id' => $option->id, 'option_value' => 'S', 'price_adjustment' => 0, 'stock_quantity' => 25, 'parent_id' => $pv->id]);
                    ProductOptionValue::create(['product_option_id' => $option->id, 'option_value' => 'M', 'price_adjustment' => 50000, 'stock_quantity' => 25, 'parent_id' => $pv->id]);
                }
            }
        }
    }
}
