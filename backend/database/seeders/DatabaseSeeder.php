<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Departments
        $departments = [
            ['name' => 'Département support', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Département clientèle', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Département eau potable', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Département Assainissement', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('departments')->insert($departments);

        // Fetch inserted departments to map IDs
        $deptSupport = DB::table('departments')->where('name', 'Département support')->first()->id;
        $deptClientele = DB::table('departments')->where('name', 'Département clientèle')->first()->id;
        $deptEau = DB::table('departments')->where('name', 'Département eau potable')->first()->id;
        $deptAssainissement = DB::table('departments')->where('name', 'Département Assainissement')->first()->id;

        // 2. Seed Employees
        $employees = [
            [
                'matricule' => 'M1001',
                'nom' => 'EL ALAMI',
                'prenom' => 'Yassine',
                'fonction' => 'Chef de Service Réseau',
                'department_id' => $deptEau,
                'direction_province' => 'TAZA',
                'solde_conge' => 15, // 30 - 15 days taken
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'matricule' => 'M1002',
                'nom' => 'BENJELLOUN',
                'prenom' => 'Meriem',
                'fonction' => 'Responsable RH',
                'department_id' => $deptSupport,
                'direction_province' => 'TAZA',
                'solde_conge' => 30,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'matricule' => 'M1003',
                'nom' => 'CHAMI',
                'prenom' => 'Amine',
                'fonction' => 'Technicien d\'Exploitation',
                'department_id' => $deptClientele,
                'direction_province' => 'TAZA',
                'solde_conge' => 30,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'matricule' => 'M1004',
                'nom' => 'TADLAOUI',
                'prenom' => 'Khadija',
                'fonction' => 'Comptable Senior',
                'department_id' => $deptSupport,
                'direction_province' => 'TAZA',
                'solde_conge' => 30,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'matricule' => 'M1005',
                'nom' => 'EL FASSI',
                'prenom' => 'Karim',
                'fonction' => 'Agent Logistique',
                'department_id' => $deptAssainissement,
                'direction_province' => 'TAZA',
                'solde_conge' => 30,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('employees')->insert($employees);

        // Fetch inserted employees
        $empChami = DB::table('employees')->where('matricule', 'M1003')->first()->id;
        $empFassi = DB::table('employees')->where('matricule', 'M1005')->first()->id;
        $empAlami = DB::table('employees')->where('matricule', 'M1001')->first()->id;

        // 3. Seed some default Missions
        DB::table('missions')->insert([
            [
                'employee_id' => $empChami,
                'destination' => 'FÈS',
                'raison' => 'Maintenance préventive des stations de pompage',
                'observation' => 'Urgent - À effectuer en collaboration avec la direction régionale de Fès.',
                'date_depart' => '2026-06-15',
                'date_retour' => '2026-06-18',
                'moyen_transport' => 'vehicule_service',
                'marque_vehicule' => 'Dacia Duster',
                'matricule_vehicule' => '1234-A-8',
                'status' => 'Effectué',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'employee_id' => $empFassi,
                'destination' => 'MEKNÈS',
                'raison' => 'Livraison de fournitures de bureau et consommables',
                'observation' => 'Vérifier la décharge à la livraison.',
                'date_depart' => '2026-06-20',
                'date_retour' => '2026-06-20',
                'moyen_transport' => 'vehicule_service',
                'marque_vehicule' => 'Renault Express',
                'matricule_vehicule' => '5678-B-12',
                'status' => 'Effectué',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // 4. Seed a default Congé
        DB::table('conges')->insert([
            [
                'employee_id' => $empAlami,
                'nombre_jours' => 15,
                'date_depart' => '2026-07-01',
                'date_retour' => '2026-07-15',
                'date_reprise' => '2026-07-16',
                'motif' => 'Congé annuel',
                'interim_employee_id' => $empChami,
                'status' => 'Approuvé',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }
}
