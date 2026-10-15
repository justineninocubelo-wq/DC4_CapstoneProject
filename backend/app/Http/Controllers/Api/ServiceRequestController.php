<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Service;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceRequest::with(['customer.user', 'service']);

        if ($request->user()->role !== 'admin') {
            $customer = Customer::where('user_id', $request->user()->id)->first();

            if (!$customer) {
                return response()->json([
                    'message' => 'Customer profile not found.'
                ], 404);
            }

            $query->where('customer_id', $customer->id);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $request->validate([
                'customer_id' => 'required|exists:customers,id',
            ]);

            $customerId = $request->customer_id;
        } else {
            $customer = Customer::where('user_id', $user->id)->first();

            if (!$customer) {
                return response()->json([
                    'message' => 'Customer profile not found.'
                ], 404);
            }

            $customerId = $customer->id;
        }

        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'printer_brand' => 'required|string|max:255',
            'printer_model' => 'nullable|string|max:255',
            'issue_description' => 'required|string',
        ]);

        $service = Service::findOrFail($validated['service_id']);

        $serviceRequest = ServiceRequest::create([
            'customer_id' => $customerId,
            'service_id' => $service->id,
            'printer_brand' => $validated['printer_brand'],
            'printer_model' => $validated['printer_model'] ?? null,
            'issue_description' => $validated['issue_description'],
            'status' => 'Received',
            'received_at' => now(),
        ]);

        return response()->json([
            'message' => 'Service request created successfully.',
            'data' => $serviceRequest->load(['customer.user', 'service']),
        ], 201);
    }

    public function show(Request $request, ServiceRequest $serviceRequest)
    {
        if (
            $request->user()->role !== 'admin' &&
            $serviceRequest->customer->user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'Forbidden.'
            ], 403);
        }

        return response()->json(
            $serviceRequest->load(['customer.user', 'service'])
        );
    }

    public function update(Request $request, ServiceRequest $serviceRequest)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only administrators can update service requests.'
            ], 403);
        }

        $validated = $request->validate([
            'service_id' => 'sometimes|required|exists:services,id',
            'printer_brand' => 'sometimes|required|string|max:255',
            'printer_model' => 'nullable|string|max:255',
            'issue_description' => 'sometimes|required|string',
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'Received',
                    'Processing',
                    'Completed',
                    'Cancelled'
                ]),
            ],
        ]);

        $serviceRequest->update($validated);

        return response()->json([
            'message' => 'Service request updated successfully.',
            'data' => $serviceRequest->fresh()->load(['customer.user', 'service']),
        ]);
    }

    public function destroy(Request $request, ServiceRequest $serviceRequest)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only administrators can delete service requests.'
            ], 403);
        }

        $serviceRequest->delete();

        return response()->json([
            'message' => 'Service request deleted successfully.'
        ]);
    }

    public function cancel(Request $request, ServiceRequest $serviceRequest)
    {
        $user = $request->user();

        if (
            $user->role !== 'admin' &&
            $serviceRequest->customer->user_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Forbidden.'
            ], 403);
        }

        if ($serviceRequest->status !== 'Received') {
            return response()->json([
                'message' => 'Only received service requests can be cancelled.'
            ], 422);
        }

        $serviceRequest->update([
            'status' => 'Cancelled'
        ]);

        return response()->json([
            'message' => 'Service request cancelled successfully.',
            'data' => $serviceRequest,
        ]);
    }
}
