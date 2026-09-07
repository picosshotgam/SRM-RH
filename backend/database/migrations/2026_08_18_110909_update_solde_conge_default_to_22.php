<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Change the column default to 22 for future new employees
        Schema::table('employees', function (Blueprint $table) {
            $table->integer('solde_conge')->default(22)->change();
        });

        // 2. Update all existing employees who still have exactly 30 days
        //    (meaning they haven't used any days yet — still at the original default)
        DB::table('employees')
            ->where('solde_conge', 30)
            ->update(['solde_conge' => 22]);
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->integer('solde_conge')->default(30)->change();
        });
    }
};
