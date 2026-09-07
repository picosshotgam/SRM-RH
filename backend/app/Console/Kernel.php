<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Renouvellement annuel des soldes de congé : chaque 1er janvier à minuit
        // Ajoute 22 jours au solde restant de chaque employé (report + nouvelle dotation annuelle)
        $schedule->command('conge:renouveler')->yearlyOn(1, 1, '00:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
