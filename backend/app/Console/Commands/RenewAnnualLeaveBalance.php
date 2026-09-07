<?php

namespace App\Console\Commands;

use App\Models\Employee;
use Illuminate\Console\Command;

class RenewAnnualLeaveBalance extends Command
{
    /**
     * The name and signature of the console command.
     * Run manually: php artisan conge:renouveler
     */
    protected $signature = 'conge:renouveler';

    /**
     * The console command description.
     */
    protected $description = 'Renouvellement annuel des soldes de congé : ajoute 22 jours au solde restant de chaque employé (report + nouvelle dotation).';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $annualAllowance = 22;

        $employees = Employee::all();

        if ($employees->isEmpty()) {
            $this->warn('Aucun employé trouvé dans la base de données.');
            return;
        }

        foreach ($employees as $employee) {
            // Carry-over: keep remaining days + add new 22 days
            $oldBalance = $employee->solde_conge;
            $newBalance = $oldBalance + $annualAllowance;

            $employee->solde_conge = $newBalance;
            $employee->save();

            $this->info("✅ {$employee->matricule} - {$employee->nom} {$employee->prenom} : {$oldBalance} j restants + {$annualAllowance} j = {$newBalance} j");
        }

        $this->newLine();
        $this->info("✅ Renouvellement terminé pour {$employees->count()} employé(s). Chaque employé a reçu +{$annualAllowance} jours.");
    }
}
