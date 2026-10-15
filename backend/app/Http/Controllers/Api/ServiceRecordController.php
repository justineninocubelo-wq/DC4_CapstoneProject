<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceRecord;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ServiceRecordController extends Controller
{
    private function isAdmin(Request $request): bool
    {
        return $request->user()->role === 'admin';
    }

    private function canView(Request $request, ServiceRecord $record): bool
    {
        if ($this->isAdmin($request)) {
            return true;
        }

        return $record->serviceRequest()
            ->whereHas('customer', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->exists();
    }

    public function index(Request $request)
    {
        $query = ServiceRecord::with([
            'serviceRequest.customer',
            'serviceRequest.service',
            'staff',
        ]);

        if (!$this->isAdmin($request)) {
            $query->whereHas('serviceRequest.customer', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            });
        }

        return response()->json(
            $query->latest()->get(),
            200
        );
    }

    public function store(Request $request)
    {
        if (!$this->isAdmin($request)) {
            return response()->json([
                'message' => 'Only administrators can create service records.'
            ], 403);
        }

        $validated = $request->validate([
            'service_request_id' => [
                'required',
                'integer',
                'exists:service_requests,id',
            ],
            'diagnosis' => 'nullable|string',
            'work_performed' => 'nullable|string',
            'parts_used' => 'nullable|string',
            'labor_cost' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
            'recorded_at' => 'sometimes|date',
        ]);

        $serviceRequest = ServiceRequest::findOrFail(
            $validated['service_request_id']
        );

        if ($serviceRequest->status === 'Cancelled') {
            return response()->json([
                'message' => 'Cannot add records to a cancelled service request.'
            ], 422);
        }

        $record = DB::transaction(function () use ($validated, $request) {
            $validated['staff_user_id'] = $request->user()->id;

            return ServiceRecord::create($validated);
        });

        return response()->json([
            'message' => 'Service record created successfully.',
            'data' => $record->load('serviceRequest', 'staff'),
        ], 201);
    }

    public function show(Request $request, ServiceRecord $serviceRecord)
    {
        if (!$this->canView($request, $serviceRecord)) {
            return response()->json([
                'message' => 'Forbidden.'
            ], 403);
        }

        return response()->json(
            $serviceRecord->load([
                'serviceRequest.customer',
                'serviceRequest.service',
                'staff',
            ]),
            200
        );
    }

    public function update(Request $request, ServiceRecord $serviceRecord)
    {
        if (!$this->isAdmin($request)) {
            return response()->json([
                'message' => 'Only administrators can update service records.'
            ], 403);
        }

        $validated = $request->validate([
            'diagnosis' => 'sometimes|nullable|string',
            'work_performed' => 'sometimes|nullable|string',
            'parts_used' => 'sometimes|nullable|string',
            'labor_cost' => 'sometimes|numeric|min:0',
            'notes' => 'sometimes|nullable|string',
            'recorded_at' => 'sometimes|date',
        ]);

        $serviceRecord->update($validated);

        return response()->json([
            'message' => 'Service record updated successfully.',
            'data' => $serviceRecord->fresh()->load('serviceRequest', 'staff'),
        ], 200);
    }

    public function destroy(Request $request, ServiceRecord $serviceRecord)
    {
        if (!$this->isAdmin($request)) {
            return response()->json([
                'message' => 'Only administrators can delete service records.'
            ], 403);
        }

        $serviceRecord->delete();

        return response()->json([
            'message' => 'Service record deleted successfully.'
        ], 200);
    }
}