<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('destination');
            $table->string('raison');
            $table->text('observation')->nullable();
            $table->date('date_depart');
            $table->date('date_retour');
            $table->string('moyen_transport');
            $table->string('marque_vehicule')->nullable();
            $table->string('matricule_vehicule')->nullable();
            $table->string('status')->default('Programmé');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};
