<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('service_request_id')
                ->constrained('service_requests')
                ->cascadeOnDelete();

            $table->foreignId('staff_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->text('diagnosis')->nullable();
            $table->text('work_performed')->nullable();
            $table->text('parts_used')->nullable();
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_records');
    }
};