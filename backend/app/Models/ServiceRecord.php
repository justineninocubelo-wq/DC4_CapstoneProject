<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_request_id',
        'staff_user_id',
        'diagnosis',
        'work_performed',
        'parts_used',
        'labor_cost',
        'notes',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'labor_cost' => 'decimal:2',
            'recorded_at' => 'datetime',
        ];
    }

    public function serviceRequest()
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_user_id');
    }
}