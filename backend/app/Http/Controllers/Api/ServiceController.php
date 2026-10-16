<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    private const TYPES = ['printing', 'repair'];

    public function index()
    {
        return response()->json([
            'services' => Service::where('is_active', true)
                ->whereIn('service_type', self::TYPES)
                ->orderBy('service_name')->get(),
        ]);
    }

    public function show(Service $service)
    {
        if (!$service->is_active || !in_array($service->service_type, self::TYPES, true)) {
            return response()->json(['message' => 'Service not found.'], 404);
        }
        return response()->json(['service' => $service]);
    }

    public function adminIndex(Request $request)
    {
        $validated = $request->validate([
            'search' => 'sometimes|nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = Service::query();
        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('service_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        if (isset($validated['is_active'])) {
            $query->where('is_active', $validated['is_active']);
        }
        return response()->json([
            'services' => $query->orderBy('id', 'desc')
                ->paginate($validated['per_page'] ?? 10),
        ]);
    }

    public function store(Request $request)
    {
        return response()->json([
            'message' => 'J-Prints supports only the two existing services: Document Printing and Photocopying and Printer Repair. Edit an existing service instead.',
        ], 403);
    }

    public function update(Request $request, Service $service)
    {
        if (!in_array($service->service_type, self::TYPES, true)) {
            // Legacy/test services may only be deactivated.
            $validated = $request->validate([
                'is_active' => 'required|boolean',
            ]);
            if ($validated['is_active']) {
                return response()->json(['message' => 'Legacy services cannot be reactivated.'], 422);
            }
            $service->update(['is_active' => false]);
            return response()->json([
                'message' => 'Legacy service deactivated successfully.',
                'service' => $service->fresh(),
            ]);
        }

        $validated = $request->validate([
            'service_name' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('services', 'service_name')->ignore($service->id),
            ],
            'description' => 'sometimes|nullable|string',
            'base_price' => 'sometimes|required|numeric|min:0|max:99999999.99',
            'is_active' => 'sometimes|boolean',
        ]);
        $service->update($validated);
        return response()->json([
            'message' => 'Service updated successfully.',
            'service' => $service->fresh(),
        ]);
    }

    public function destroy(Service $service)
    {
        if (in_array($service->service_type, self::TYPES, true)) {
            return response()->json([
                'message' => 'Official services cannot be deleted. Deactivate them instead.',
            ], 409);
        }
        if ($service->serviceRequests()->exists()) {
            return response()->json([
                'message' => 'This service has existing requests. Deactivate it instead of deleting it.',
            ], 409);
        }
        $service->delete();
        return response()->json(['message' => 'Service deleted successfully.']);
    }
}