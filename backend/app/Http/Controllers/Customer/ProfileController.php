<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;



class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->load(['role', 'profile', 'addresses']));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $request->validate(['name' => 'sometimes|string|max:255']);
        $user->update($request->only('name'));

        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            $request->only(['phone', 'bio', 'avatar_url'])
        );

        return response()->json($user->load(['role', 'profile']));
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:8|confirmed',
        ]);
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Password changed successfully.']);
    }

    // Address CRUD
    public function addresses(Request $request)
    {
        return response()->json($request->user()->addresses()->get());
    }

    public function storeAddress(Request $request)
    {
        $request->validate([
            'type'           => 'required|string|max:100', // Allow Home, Office, or custom nicknames
            'address_line_1' => 'required|string',
            'city'           => 'required|string',
            'country'        => 'required|string',
        ]);

        $user = $request->user();
        if ($request->is_default) {
            $user->addresses()->update(['is_default' => false]);
        }
        $address = $user->addresses()->create($request->all());
        return response()->json($address, 201);
    }

    public function updateAddress(Request $request, int $id)
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $request->validate([
            'type'           => 'sometimes|string|max:100',
            'address_line_1' => 'sometimes|string',
        ]);
        if ($request->is_default) {
            $request->user()->addresses()->update(['is_default' => false]);
        }
        $address->update($request->all());

        return response()->json($address);
    }

    public function deleteAddress(Request $request, int $id)
    {
        $request->user()->addresses()->findOrFail($id)->delete();
        return response()->json(['message' => 'Address deleted.']);
    }

    public function proxySearch(Request $request)
    {
        $query = $request->query('q');
        if (!$query) return response()->json([]);

        $cacheKey = 'geo_search_v2_' . md5($query); // v2 for photon
        if (Cache::has($cacheKey)) return response()->json(Cache::get($cacheKey));

        try {
            // Switch to Photon API (by Komoot) - much higher limits and faster
            $response = Http::timeout(5)
                ->get("https://photon.komoot.io/api/", [
                    'q' => $query,
                    'limit' => 5,
                    'lang' => 'en'
                ]);

            if ($response->successful()) {
                $photonData = $response->json();
                $mapped = array_map(function($feature) {
                    $p = $feature['properties'];
                    $coords = $feature['geometry']['coordinates'];
                    
                    // Construct display name like Nominatim
                    $nameParts = array_filter([$p['name'] ?? null, $p['street'] ?? null, $p['district'] ?? null, $p['city'] ?? null, $p['state'] ?? null, $p['country'] ?? null]);
                    
                    return [
                        'place_id' => $p['osm_id'] ?? rand(1000, 9999),
                        'display_name' => implode(', ', $nameParts),
                        'lat' => $coords[1],
                        'lon' => $coords[0],
                        'address' => [
                            'house_number' => $p['housenumber'] ?? null,
                            'road' => $p['street'] ?? null,
                            'suburb' => $p['district'] ?? null,
                            'village' => $p['locality'] ?? null,
                            'city' => $p['city'] ?? $p['town'] ?? null,
                            'state' => $p['state'] ?? null,
                            'country' => $p['country'] ?? 'Vietnam',
                            'postcode' => $p['postcode'] ?? null,
                            'name' => $p['name'] ?? null,
                        ]
                    ];

                }, $photonData['features'] ?? []);

                Cache::put($cacheKey, $mapped, 86400);
                return response()->json($mapped);
            }
        } catch (\Exception $e) {
            // Fallback to nominatim if photon fails
        }

        // Fallback to Nominatim as secondary
        $response = Http::withHeaders(['User-Agent' => 'ShopDee/2.0 (contact: admin@shopdee.com)'])
            ->get("https://nominatim.openstreetmap.org/search", [
                'q' => $query,
                'format' => 'json',
                'addressdetails' => 1,
                'limit' => 5,
                'countrycodes' => 'vn',
            ]);
            
    }

    public function proxyReverse(Request $request)
    {
        $lat = round($request->query('lat'), 6);
        $lng = round($request->query('lng'), 6);
        
        $cacheKey = "geo_reverse_v2_{$lat}_{$lng}";
        if (Cache::has($cacheKey)) return response()->json(Cache::get($cacheKey));

        try {
            // Use Photon Reverse
            $response = Http::timeout(5)
                ->get("https://photon.komoot.io/reverse", [
                    'lon' => $lng,
                    'lat' => $lat,
                ]);

            if ($response->successful()) {
                $photonData = $response->json();
                if (!empty($photonData['features'])) {
                    $feature = $photonData['features'][0];
                    $p = $feature['properties'];
                    $coords = $feature['geometry']['coordinates'];

                    $nameParts = array_filter([$p['name'] ?? null, $p['street'] ?? null, $p['district'] ?? null, $p['city'] ?? null, $p['state'] ?? null, $p['country'] ?? null]);

                    $mapped = [
                        'place_id' => $p['osm_id'] ?? rand(1000, 9999),
                        'display_name' => implode(', ', $nameParts),
                        'lat' => $coords[1],
                        'lon' => $coords[0],
                        'address' => [
                            'house_number' => $p['housenumber'] ?? null,
                            'road' => $p['street'] ?? null,
                            'suburb' => $p['district'] ?? null,
                            'village' => $p['locality'] ?? null,
                            'city' => $p['city'] ?? $p['town'] ?? null,
                            'state' => $p['state'] ?? null,
                            'country' => $p['country'] ?? 'Vietnam',
                        ]
                    ];
                    Cache::put($cacheKey, $mapped, 86400);
                    return response()->json($mapped);
                }
            }
        } catch (\Exception $e) { }

        // Fallback to Nominatim
        $response = Http::withHeaders(['User-Agent' => 'ShopDee/2.0'])
            ->get("https://nominatim.openstreetmap.org/reverse", [
                'lat' => $lat,
                'lon' => $lng,
                'format' => 'json',
            ]);

        return response()->json($response->json());
    }



}

