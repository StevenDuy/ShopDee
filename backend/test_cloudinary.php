<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

try {
    $config = config('cloudinary');
    echo "Config 'cloudinary': " . json_encode($config) . "\n";
    
    // Test if facade can access configuration
    // (Actual method depends on package version, but usually it's getCloudinary())
    if (method_exists(Cloudinary::class, 'getCloudinary')) {
         $c = Cloudinary::getCloudinary();
         echo "Cloud Name from SDK: " . $c->configuration->cloud->cloudName . "\n";
    } else {
         echo "getCloudinary() not found on facade.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
