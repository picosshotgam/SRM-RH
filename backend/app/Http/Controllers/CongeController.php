<?php

namespace App\Http\Controllers;

use App\Models\Conge;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CongeController extends Controller
{
    public function index(): JsonResponse
    {
        $conges = Conge::with(['employee.department', 'interimEmployee.department'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($conges);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'employee_matricule' => 'required|string|exists:employees,matricule',
            'nombre_jours' => 'required|integer|min:1',
            'date_depart' => 'required|date',
            'date_retour' => 'required|date|after_or_equal:date_depart',
            'date_reprise' => 'required|date|after:date_retour',
            'motif' => 'required|string',
            'interim_matricule' => 'required|string|exists:employees,matricule'
        ]);

        $employee = Employee::where('matricule', strtoupper(trim($request->input('employee_matricule'))))->firstOrFail();
        $interim = Employee::where('matricule', strtoupper(trim($request->input('interim_matricule'))))->firstOrFail();

        if ($employee->id === $interim->id) {
            return response()->json([
                'success' => false,
                'message' => 'L\'intérimaire ne peut pas être la même personne que le demandeur de congé.'
            ], 422);
        }

        $requestedDays = (int) $request->input('nombre_jours');
        if ($employee->solde_conge < $requestedDays) {
            return response()->json([
                'success' => false,
                'message' => "Le nombre de jours demandés ({$requestedDays} jours) dépasse le solde de congé restant de l'employé ({$employee->solde_conge} jours)."
            ], 422);
        }

        $conge = Conge::create([
            'employee_id' => $employee->id,
            'nombre_jours' => $requestedDays,
            'date_depart' => $request->input('date_depart'),
            'date_retour' => $request->input('date_retour'),
            'date_reprise' => $request->input('date_reprise'),
            'motif' => trim($request->input('motif')),
            'interim_employee_id' => $interim->id,
            'status' => 'Approuvé'
        ]);

        // Deduct from employee leave balance
        $employee->solde_conge -= $requestedDays;
        $employee->save();

        // Load relations
        $conge->load(['employee.department', 'interimEmployee.department']);

        return response()->json([
            'success' => true,
            'message' => 'Demande de congé enregistrée avec succès.',
            'conge' => $conge
        ], 211);
    }

    public function closeConge(Request $request, $id): JsonResponse
    {
        $request->validate([
            'date_retour_effective' => 'required|date'
        ]);

        $conge = Conge::with('employee')->find($id);

        if (!$conge) {
            return response()->json([
                'success' => false,
                'message' => 'Demande de congé introuvable.'
            ], 404);
        }

        if ($conge->status !== 'Approuvé') {
            return response()->json([
                'success' => false,
                'message' => 'Seule une demande au statut Approuvé peut être clôturée.'
            ], 400);
        }

        $startDate = \Carbon\Carbon::parse($conge->date_depart);
        $actualReturnDate = \Carbon\Carbon::parse($request->input('date_retour_effective'));

        if ($actualReturnDate->lt($startDate)) {
            return response()->json([
                'success' => false,
                'message' => 'La date de retour effective ne peut pas être antérieure à la date de départ.'
            ], 422);
        }

        // Calculate actual days used (inclusive between start date and actual return date)
        $actualDaysUsed = (int) $request->input('nombre_jours_effectif', $startDate->diffInDays($actualReturnDate) + 1);
        $actualDaysUsed = max(1, $actualDaysUsed);

        $approvedDays = (int) $conge->nombre_jours;
        $unusedDays = max(0, $approvedDays - $actualDaysUsed);

        // Restore unused days to employee balance
        $employee = $conge->employee;
        if ($employee && $unusedDays > 0) {
            $employee->solde_conge += $unusedDays;
            $employee->save();
        }

        // Update congé record
        $conge->update([
            'date_retour_effective' => $actualReturnDate->format('Y-m-d'),
            'nombre_jours_effectif' => $actualDaysUsed,
            'jours_restitues' => $unusedDays,
            'status' => 'Terminé'
        ]);

        $conge->load(['employee.department', 'interimEmployee.department']);

        return response()->json([
            'success' => true,
            'message' => "Le congé a été clôturé avec succès. {$unusedDays} jour(s) ont été restitué(s) au solde de l'employé.",
            'conge' => $conge,
            'remaining_balance' => $employee ? $employee->solde_conge : null
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $conge = Conge::with('employee')->find($id);

        if (!$conge) {
            return response()->json([
                'success' => false,
                'message' => 'Demande de congé introuvable.'
            ], 404);
        }

        $request->validate([
            'employee_matricule' => 'required|string|exists:employees,matricule',
            'nombre_jours' => 'required|integer|min:1',
            'date_depart' => 'required|date',
            'date_retour' => 'required|date|after_or_equal:date_depart',
            'date_reprise' => 'required|date|after:date_retour',
            'motif' => 'required|string',
            'interim_matricule' => 'required|string|exists:employees,matricule'
        ]);

        $employee = Employee::where('matricule', strtoupper(trim($request->input('employee_matricule'))))->firstOrFail();
        $interim = Employee::where('matricule', strtoupper(trim($request->input('interim_matricule'))))->firstOrFail();

        if ($employee->id === $interim->id) {
            return response()->json([
                'success' => false,
                'message' => 'L\'intérimaire ne peut pas être la même personne que le demandeur de congé.'
            ], 422);
        }

        $newRequestedDays = (int) $request->input('nombre_jours');
        $oldRequestedDays = (int) $conge->nombre_jours;
        $daysDiff = $newRequestedDays - $oldRequestedDays;

        if ($daysDiff > 0 && $employee->solde_conge < $daysDiff) {
            return response()->json([
                'success' => false,
                'message' => "La modification exige {$daysDiff} jour(s) de congé supplémentaire(s), dépassant le solde restant de l'employé ({$employee->solde_conge} jours)."
            ], 422);
        }

        // Adjust leave balance
        $employee->solde_conge -= $daysDiff;
        $employee->save();

        $conge->update([
            'employee_id' => $employee->id,
            'nombre_jours' => $newRequestedDays,
            'date_depart' => $request->input('date_depart'),
            'date_retour' => $request->input('date_retour'),
            'date_reprise' => $request->input('date_reprise'),
            'motif' => trim($request->input('motif')),
            'interim_employee_id' => $interim->id
        ]);

        $conge->load(['employee.department', 'interimEmployee.department']);

        return response()->json([
            'success' => true,
            'message' => 'Demande de congé mise à jour avec succès.',
            'conge' => $conge
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $conge = Conge::with('employee')->find($id);

        if (!$conge) {
            return response()->json([
                'success' => false,
                'message' => 'Demande de congé introuvable.'
            ], 404);
        }

        $employee = $conge->employee;
        if ($employee) {
            // Restore days taken back to employee balance
            $daysToRestore = ($conge->status === 'Terminé' && $conge->nombre_jours_effectif)
                ? (int) $conge->nombre_jours_effectif
                : (int) $conge->nombre_jours;

            $employee->solde_conge += $daysToRestore;
            $employee->save();
        }

        $conge->delete();

        return response()->json([
            'success' => true,
            'message' => 'Demande de congé supprimée et jours restitués au solde de l\'employé.'
        ]);
    }
}
