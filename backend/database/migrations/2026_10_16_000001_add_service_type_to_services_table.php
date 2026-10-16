<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('service_type')->nullable();
        });

        // Only exact, known official names are classified. Test services remain legacy.
        DB::table('services')
            ->whereRaw('LOWER(TRIM(service_name)) = ?', ['document printing and photocopying'])
            ->update(['service_type' => 'printing']);

        DB::table('services')
            ->whereRaw('LOWER(TRIM(service_name)) = ?', ['printer repair'])
            ->update(['service_type' => 'repair']);
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('service_type');
        });
    }
};
