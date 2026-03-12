<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Address;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductAttribute;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Notification;
use App\Models\SellerFinance;
use App\Models\ModerationReport;

class DBTestController extends Controller
{
    public function seed()
    {
        $this->cleanupTestData();

        $users = $this->getSeededUsers();
        if (!$users) {
            return response()->json(['error' => 'Seed users not found. Run php artisan migrate:fresh --seed first.'], 500);
        }

        [$customer, $seller] = $users;
        $address = $this->seedUserData($customer, $seller);
        [$subCategory, $product] = $this->seedProductData($seller);
        $order = $this->seedOrderData($customer, $seller, $address, $product);
        $this->seedInteractions($customer, $seller, $product, $order);

        return response()->json(['success' => true, 'message' => 'Test data seeded successfully.']);
    }

    private function cleanupTestData(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        ModerationReport::where('reason', 'like', '%[TEST]%')->delete();
        SellerFinance::where('description', 'like', '%[TEST]%')->delete();
        Review::where('comment', 'like', '%[TEST]%')->delete();
        OrderItem::whereHas('order', fn($q) => $q->where('notes', '[TEST]'))->delete();
        Order::where('notes', '[TEST]')->delete();
        ProductAttribute::where('attribute_value', 'like', '%[TEST]%')->delete();
        ProductMedia::where('url', 'like', '%picsum%')->delete();
        Product::where('sku', 'like', 'TEST-%')->delete();
        Category::where('slug', 'like', 'test-%')->delete();
        Address::where('address_line_1', 'like', '%Test Street%')->delete();
        UserProfile::whereIn('user_id', User::whereIn('email', ['customer@shopdee.com', 'seller@shopdee.com'])->pluck('id'))->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /** @return array<User>|null */
    private function getSeededUsers(): ?array
    {
        $customer = User::where('email', 'customer@shopdee.com')->first();
        $seller   = User::where('email', 'seller@shopdee.com')->first();
        if (!$customer || !$seller) return null;
        return [$customer, $seller];
    }

    private function seedUserData(User $customer, User $seller): Address
    {
        UserProfile::create(['user_id' => $customer->id, 'phone' => '0901234567', 'bio' => 'Test customer account']);
        UserProfile::create(['user_id' => $seller->id,   'phone' => '0987654321', 'bio' => 'Test seller account']);

        return Address::create([
            'user_id' => $customer->id,
            'type' => 'shipping',
            'address_line_1' => '100 Test Street',
            'city' => 'Ho Chi Minh City',
            'country' => 'Vietnam',
            'lat' => 10.762622,
            'lng' => 106.660172,
            'is_default' => true,
        ]);
    }

    /** @return array{Category, Product} */
    private function seedProductData(User $seller): array
    {
        $parent = Category::create(['name' => 'Electronics [TEST]', 'slug' => 'test-electronics', 'is_active' => true]);
        $sub    = Category::create(['name' => 'Phones [TEST]', 'slug' => 'test-phones', 'parent_id' => $parent->id, 'is_active' => true]);

        $product = Product::create([
            'seller_id'      => $seller->id,
            'category_id'    => $sub->id,
            'title'          => 'ShopDee Test Smartphone',
            'slug'           => 'shopdee-test-smartphone-' . Str::random(4),
            'description'    => 'A test product for schema verification.',
            'price'          => 12000000,
            'sale_price'     => 10500000,
            'stock_quantity' => 50,
            'sku'            => 'TEST-PHONE-001',
            'status'         => 'active',
        ]);

        ProductMedia::create(['product_id' => $product->id, 'media_type' => 'image', 'url' => 'https://picsum.photos/400/400?random=1', 'is_primary' => true]);
        ProductAttribute::create(['product_id' => $product->id, 'attribute_name' => 'Color [TEST]', 'attribute_value' => 'Space Gray [TEST]']);
        ProductAttribute::create(['product_id' => $product->id, 'attribute_name' => 'Storage [TEST]', 'attribute_value' => '128GB [TEST]']);

        return [$sub, $product];
    }

    private function seedOrderData(User $customer, User $seller, Address $address, Product $product): Order
    {
        $order = Order::create([
            'customer_id'         => $customer->id,
            'seller_id'          => $seller->id,
            'shipping_address_id' => $address->id,
            'total_amount'       => 10500000,
            'status'             => 'completed',
            'payment_method'     => 'momo',
            'notes'              => '[TEST]',
        ]);

        $item = OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $product->id,
            'quantity'   => 1,
            'unit_price' => 10500000,
            'subtotal'   => 10500000,
        ]);

        Review::create([
            'product_id'   => $product->id,
            'customer_id'  => $customer->id,
            'order_item_id' => $item->id,
            'rating'       => 5,
            'comment'      => 'Works great! [TEST]',
        ]);

        return $order;
    }

    private function seedInteractions(User $customer, User $seller, Product $product, Order $order): void
    {
        $conv = ChatConversation::firstOrCreate(['user1_id' => $customer->id, 'user2_id' => $seller->id]);
        ChatMessage::create(['conversation_id' => $conv->id, 'sender_id' => $customer->id, 'message_type' => 'text',         'content' => 'Hello, I am interested! [TEST]']);
        ChatMessage::create(['conversation_id' => $conv->id, 'sender_id' => $seller->id,   'message_type' => 'product_link', 'content' => '/products/' . $product->slug]);

        Notification::create(['user_id' => $customer->id, 'type' => 'order', 'data' => ['order_id' => $order->id, 'message' => 'Your order has been completed!', 'status' => 'completed'], 'is_read' => false]);

        SellerFinance::create(['seller_id' => $seller->id, 'order_id' => $order->id, 'type' => 'credit', 'amount' => 10500000 * 0.95, 'description' => 'Order payout [TEST]', 'status' => 'completed']);

        ModerationReport::create(['reporter_id' => $customer->id, 'reported_product_id' => $product->id, 'reason' => 'Test report [TEST]', 'status' => 'pending']);
    }

    public function relationships()
    {
        $customer = User::with(['role', 'profile', 'addresses'])->where('email', 'customer@shopdee.com')->first();
        $seller   = User::with(['role', 'profile'])->where('email', 'seller@shopdee.com')->first();
        $product  = Product::with(['seller', 'category.parent', 'media', 'attributes', 'reviews.customer'])->where('sku', 'TEST-PHONE-001')->first();
        $order    = Order::with(['customer', 'seller', 'items.product', 'shippingAddress'])->where('notes', '[TEST]')->latest()->first();
        $conv     = ChatConversation::with(['user1', 'user2', 'messages.sender'])->where('user1_id', $customer?->id ?? 0)->where('user2_id', $seller?->id ?? 0)->first();

        return response()->json([
            'users'            => ['customer' => $customer, 'seller' => $seller],
            'product'          => $product,
            'order'            => $order,
            'chat_conversation' => $conv,
            'notifications'    => Notification::where('user_id', $customer?->id ?? 0)->latest()->limit(3)->get(),
            'seller_finance'   => SellerFinance::with(['order'])->where('seller_id', $seller?->id ?? 0)->where('description', 'like', '%[TEST]%')->latest()->first(),
            'moderation_report' => ModerationReport::with(['reporter', 'reportedProduct'])->where('reason', 'like', '%[TEST]%')->latest()->first(),
        ]);
    }
}
