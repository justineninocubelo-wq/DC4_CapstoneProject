<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->string('printer_brand')->nullable()->change();

            $table->string('document_description')->nullable();
            $table->unsignedInteger('number_of_copies')->nullable();
            $table->string('paper_size')->nullable();
            $table->string('color_mode')->nullable();
            $table->text('printing_instructions')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn([
                'document_description',
                'number_of_copies',
                'paper_size',
                'color_mode',
                'printing_instructions',
            ]);
        });

        // Existing printing requests may have null printer brands.
        // Restore NOT NULL only after those rows have been addressed.
    }
};