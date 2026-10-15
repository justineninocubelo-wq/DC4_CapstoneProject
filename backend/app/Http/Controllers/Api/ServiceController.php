<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    public function index()
    {
        $services = Service::where('is_active', true)
            ->orderBy('service_name')
            ->get();

        return response()->json([
            'services' => $services
        ], 200);
    }

    public function show(Service $service)
    {
        if (!$service->is_active) {
            return response()->json([
                'message' => 'Service not found.'
            ], 404);
        }

        return response()->json([
            'service' => $service
        ], 200);
    }

    public function adminIndex()
    {
        return response()->json([
            'services' => Service::orderBy('id', 'desc')->get()
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_name' => 'required|string|max:255|unique:services,service_name',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0|max:99999999.99',
            'is_active' => 'sometimes|boolean'
        ]);

        $service = Service::create($validated);

        return response()->json([
            'message' => 'Service created successfully.',
            'service' => $service
        ], 201);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'service_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('services', 'service_name')->ignore($service->id)
            ],
            'description' => 'sometimes|nullable|string',
            'base_price' => 'sometimes|required|numeric|min:0|max:99999999.99',
            'is_active' => 'sometimes|boolean'
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Service updated successfully.',
            'service' => $service->fresh()
        ], 200);
    }

    public function destroy(Service $service)
    {
        if ($service->serviceRequests()->exists()) {
            return response()->json([
                'message' => 'This service has existing requests. Deactivate it instead of deleting it.'
            ], 409);
        }

        $service->delete();

        return response()->json([
            'message' => 'Service deleted successfully.'
        ], 200);
    }
}
