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
    private const STATUSES = [
        'Received',
        'Diagnosing',
        'Repairing',
        'Ready',
        'Released',
        'Cancelled',
    ];

    private const NEXT_STATUSES = [
        'Received' => ['Diagnosing', 'Cancelled'],
        'Diagnosing' => ['Repairing'],
        'Repairing' => ['Ready'],
        'Ready' => ['Released'],
        'Released' => [],
        'Cancelled' => [],
    ];

    private function isPrintingService(Service $service): bool
    {
        return $service->service_type === 'printing';
    }

    private function requestRules(bool $printing, bool $updating = false): array
    {
        $prefix = $updating ? 'sometimes|' : '';

        return [
            'printer_brand' => $prefix . ($printing
                ? 'nullable|string|max:255'
                : 'required|string|max:255'),
            'printer_model' => $prefix . 'nullable|string|max:255',
            'issue_description' => $prefix . ($printing
                ? 'nullable|string'
                : 'required|string'),
            'document_description' => $prefix . ($printing
                ? 'required|string|max:255'
                : 'nullable|string|max:255'),
            'number_of_copies' => $prefix . ($printing
                ? 'required|integer|min:1|max:100000'
                : 'nullable|integer|min:1|max:100000'),
            'paper_size' => [
                $updating ? 'sometimes' : 'nullable',
                $printing ? 'required' : 'nullable',
                Rule::in(['A4', 'Letter', 'Legal', 'Short', 'Long', 'Other']),
            ],
            'color_mode' => [
                $updating ? 'sometimes' : 'nullable',
                $printing ? 'required' : 'nullable',
                Rule::in(['Black and White', 'Colored']),
            ],
            'printing_instructions' => $prefix . 'nullable|string',
        ];
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'sometimes|nullable|string|max:255',
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = ServiceRequest::with([
            'customer.user:id,name,email,role',
            'service',
        ]);

        if ($request->user()->role !== 'admin') {
            $customer = Customer::where(
                'user_id',
                $request->user()->id
            )->first();

            if (!$customer) {
                return response()->json([
                    'message' => 'Customer profile not found.',
                ], 404);
            }

            $query->where('customer_id', $customer->id);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('printer_brand', 'like', "%{$search}%")
                    ->orWhere('printer_model', 'like', "%{$search}%")
                    ->orWhere('issue_description', 'like', "%{$search}%")
                    ->orWhere('document_description', 'like', "%{$search}%")
                    ->orWhere('printing_instructions', 'like', "%{$search}%")
                    ->orWhereHas('customer.user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        return response()->json(
            $query->latest()->paginate($validated['per_page'] ?? 10)
        );
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
            $customer = Customer::where(
                'user_id',
                $user->id
            )->first();

            if (!$customer) {
                return response()->json([
                    'message' => 'Customer profile not found.',
                ], 404);
            }

            $customerId = $customer->id;
        }

        $request->validate([
            'service_id' => 'required|exists:services,id',
        ]);

        $service = Service::findOrFail($request->service_id);

        if (
            !$service->is_active ||
            !in_array($service->service_type, ['printing', 'repair'], true)
        ) {
            return response()->json([
                'message' => 'This service is currently unavailable.',
            ], 422);
        }

        $printing = $this->isPrintingService($service);

        $validated = $request->validate(
            $this->requestRules($printing)
        );

        $serviceRequest = ServiceRequest::create([
            'customer_id' => $customerId,
            'service_id' => $service->id,
            'printer_brand' => $printing
                ? null
                : ($validated['printer_brand'] ?? null),
            'printer_model' => $printing
                ? null
                : ($validated['printer_model'] ?? null),
            'issue_description' => $printing
                ? ($validated['printing_instructions'] ?? 'Printing or photocopying request')
                : $validated['issue_description'],
            'document_description' => $printing
                ? $validated['document_description']
                : null,
            'number_of_copies' => $printing
                ? $validated['number_of_copies']
                : null,
            'paper_size' => $printing
                ? $validated['paper_size']
                : null,
            'color_mode' => $printing
                ? $validated['color_mode']
                : null,
            'printing_instructions' => $printing
                ? ($validated['printing_instructions'] ?? null)
                : null,
            'status' => 'Received',
            'received_at' => now(),
        ]);

        return response()->json([
            'message' => 'Service request created successfully.',
            'data' => $serviceRequest->load([
                'customer.user:id,name,email,role',
                'service',
            ]),
        ], 201);
    }

    public function show(Request $request, ServiceRequest $serviceRequest)
    {
        if (
            $request->user()->role !== 'admin' &&
            $serviceRequest->customer->user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        return response()->json(
            $serviceRequest->load([
                'customer.user:id,name,email,role',
                'service',
            ])
        );
    }

    public function update(Request $request, ServiceRequest $serviceRequest)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only administrators can update service requests.',
            ], 403);
        }

        $validatedService = $request->validate([
            'service_id' => 'sometimes|required|exists:services,id',
        ]);

        $service = isset($validatedService['service_id'])
            ? Service::findOrFail($validatedService['service_id'])
            : $serviceRequest->service;

        if (
            isset($validatedService['service_id']) &&
            (
                !$service->is_active ||
                !in_array($service->service_type, ['printing', 'repair'], true)
            )
        ) {
            return response()->json([
                'message' => 'This service is currently unavailable.',
            ], 422);
        }

        $printing = $this->isPrintingService($service);

        $validated = $request->validate([
            ...$this->requestRules($printing, true),
            'status' => [
                'sometimes',
                'required',
                Rule::in(self::STATUSES),
            ],
        ]);

        if (isset($validated['status'])) {
            $currentStatus = $serviceRequest->status;
            $newStatus = $validated['status'];

            if ($currentStatus !== $newStatus) {
                $allowed = self::NEXT_STATUSES[$currentStatus] ?? [];

                if (!in_array($newStatus, $allowed, true)) {
                    return response()->json([
                        'message' => 'Invalid status transition.',
                        'current_status' => $currentStatus,
                        'requested_status' => $newStatus,
                        'allowed_next_statuses' => $allowed,
                    ], 422);
                }
            }
        }

        $serviceRequest->update([
            ...$validated,
            ...$validatedService,
        ]);

        return response()->json([
            'message' => 'Service request updated successfully.',
            'data' => $serviceRequest->fresh()->load([
                'customer.user:id,name,email,role',
                'service',
            ]),
        ]);
    }

    public function destroy(Request $request, ServiceRequest $serviceRequest)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only administrators can delete service requests.',
            ], 403);
        }

        if ($serviceRequest->serviceRecords()->exists()) {
            return response()->json([
                'message' => 'This request has service records and cannot be deleted.',
            ], 409);
        }

        $serviceRequest->delete();

        return response()->json([
            'message' => 'Service request deleted successfully.',
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
                'message' => 'Forbidden.',
            ], 403);
        }

        if ($serviceRequest->status !== 'Received') {
            return response()->json([
                'message' => 'Only received service requests can be cancelled.',
            ], 422);
        }

        $serviceRequest->update([
            'status' => 'Cancelled',
        ]);

        return response()->json([
            'message' => 'Service request cancelled successfully.',
            'data' => $serviceRequest,
        ]);
    }
}
