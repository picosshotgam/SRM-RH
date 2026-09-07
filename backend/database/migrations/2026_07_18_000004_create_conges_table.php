<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->integer('nombre_jours');
            $table->date('date_depart');
            $table->date('date_retour');
            $table->date('date_reprise');
            $table->string('motif')->default('Congé annuel');
            $table->foreignId('interim_employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('status')->default('Approuvé');
            $table->date('date_retour_effective')->nullable();
            $table->integer('nombre_jours_effectif')->nullable();
            $table->integer('jours_restitues')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conges');
    }
};
