<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 191);
            $table->text('description')->nullable();
            $table->enum('visibility', ['private', 'public'])->default('private');
            $table->decimal('position', 10, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'position']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boards');
    }
};
