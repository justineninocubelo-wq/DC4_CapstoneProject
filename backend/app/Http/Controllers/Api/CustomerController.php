<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'sometimes|nullable|string|max:255',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = Customer::with('user:id,name,email,role');

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('address', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'customers' => $query->latest()
                ->paginate($validated['per_page'] ?? 10)
        ], 200);
    }

    public function show(Request $request, Customer $customer)
    {
        if (
            $request->user()->role !== 'admin' &&
            $customer->user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'You are not authorized to access this resource.'
            ], 403);
        }

        return response()->json([
            'customer' => $customer->load('user:id,name,email,role')
        ]);
    }

    public function me(Request $request)
    {
        $customer = Customer::with('user:id,name,email,role')
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$customer) {
            return response()->json([
                'message' => 'Customer profile not found.'
            ], 404);
        }

        return response()->json([
            'customer' => $customer
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $user = $request->user();

        if (
            $user->role !== 'admin' &&
            $customer->user_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You are not authorized to access this resource.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($customer->user_id)
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($customer, $validated) {
            $customer->user->update(
                array_intersect_key(
                    $validated,
                    array_flip(['name', 'email'])
                )
            );

            $customer->update(
                array_intersect_key(
                    $validated,
                    array_flip(['phone', 'address'])
                )
            );
        });

        return response()->json([
            'message' => 'Customer updated successfully.',
            'customer' => $customer->fresh()->load('user:id,name,email,role')
        ]);
    }

    public function destroy(Customer $customer)
    {
        DB::transaction(function () use ($customer) {
            $customer->user()->firstOrFail()->delete();
        });

        return response()->json([
            'message' => 'Customer deleted successfully.'
        ]);
    }
}
