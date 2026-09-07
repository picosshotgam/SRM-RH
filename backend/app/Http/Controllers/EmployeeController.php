<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmployeeController extends Controller
{
    public function index(): JsonResponse
    {
        $employees = Employee::with('department')->orderBy('nom', 'asc')->get();
        return response()->json($employees);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'matricule' => 'required|string|unique:employees,matricule',
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'fonction' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'direction_province' => 'nullable|string'
        ]);

        $employee = Employee::create([
            'matricule' => strtoupper(trim($request->input('matricule'))),
            'nom' => strtoupper(trim($request->input('nom'))),
            'prenom' => trim($request->input('prenom')),
            'fonction' => trim($request->input('fonction')),
            'department_id' => $request->input('department_id'),
            'direction_province' => $request->input('direction_province') ?: 'TAZA'
        ]);

        // Reload with relation
        $employee->load('department');

        return response()->json([
            'success' => true,
            'message' => 'Employé enregistré avec succès.',
            'employee' => $employee
        ], 211); // Laravel status 201 Created or 200
    }

    public function showByMatricule($matricule): JsonResponse
    {
        $employee = Employee::with('department')
            ->where('matricule', strtoupper(trim($matricule)))
            ->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun employé trouvé avec ce matricule.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'employee' => $employee
        ]);
    }

    public function getHistoryByMatricule($matricule): JsonResponse
    {
        $employee = Employee::with([
            'department',
            'conges.employee.department',
            'conges.interimEmployee.department',
            'missions.employee.department'
        ])
            ->where('matricule', strtoupper(trim($matricule)))
            ->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun employé trouvé avec ce matricule.'
            ], 404);
        }

        $totalDaysTaken = $employee->conges->sum(function ($conge) {
            if ($conge->status === 'Annulé') {
                return 0;
            }
            if ($conge->status === 'Terminé' && $conge->nombre_jours_effectif !== null) {
                return (int) $conge->nombre_jours_effectif;
            }
            return (int) $conge->nombre_jours;
        });

        return response()->json([
            'success' => true,
            'employee' => $employee,
            'initial_balance' => 22,
            'total_days_taken' => $totalDaysTaken,
            'remaining_balance' => $employee->solde_conge,
            'conges' => $employee->conges->sortByDesc('created_at')->values(),
            'missions' => $employee->missions->sortByDesc('created_at')->values(),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employé introuvable.'
            ], 404);
        }

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employé supprimé de la base de données.'
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employé introuvable.'
            ], 404);
        }

        $request->validate([
            'matricule' => 'required|string|unique:employees,matricule,' . $id,
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'fonction' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'direction_province' => 'nullable|string'
        ]);

        $employee->update([
            'matricule' => strtoupper(trim($request->input('matricule'))),
            'nom' => strtoupper(trim($request->input('nom'))),
            'prenom' => trim($request->input('prenom')),
            'fonction' => trim($request->input('fonction')),
            'department_id' => $request->input('department_id'),
            'direction_province' => $request->input('direction_province') ?: 'TAZA'
        ]);

        $employee->load('department');

        return response()->json([
            'success' => true,
            'message' => 'Employé mis à jour avec succès.',
            'employee' => $employee
        ]);
    }
}
