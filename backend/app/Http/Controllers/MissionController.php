<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MissionController extends Controller
{
    public function index(): JsonResponse
    {
        $missions = Mission::with('employee.department')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($missions);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'employee_matricule' => 'required|string|exists:employees,matricule',
            'destination' => 'required|string',
            'raison' => 'required|string',
            'observation' => 'nullable|string',
            'date_depart' => 'required|date',
            'date_retour' => 'required|date|after_or_equal:date_depart',
            'moyen_transport' => 'required|string',
            'marque_vehicule' => 'nullable|required_if:moyen_transport,vehicule_service|string',
            'matricule_vehicule' => 'nullable|required_if:moyen_transport,vehicule_service|string'
        ]);

        $employee = Employee::where('matricule', strtoupper(trim($request->input('employee_matricule'))))->firstOrFail();

        $mission = Mission::create([
            'employee_id' => $employee->id,
            'destination' => trim($request->input('destination')),
            'raison' => trim($request->input('raison')),
            'observation' => trim($request->input('observation')),
            'date_depart' => $request->input('date_depart'),
            'date_retour' => $request->input('date_retour'),
            'moyen_transport' => $request->input('moyen_transport'),
            'marque_vehicule' => $request->input('marque_vehicule'),
            'matricule_vehicule' => $request->input('matricule_vehicule')
        ]);

        // Load relations
        $mission->load('employee.department');

        return response()->json([
            'success' => true,
            'message' => 'Ordre de mission enregistré avec succès.',
            'mission' => $mission
        ], 211);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json([
                'success' => false,
                'message' => 'Ordre de mission introuvable.'
            ], 404);
        }

        $request->validate([
            'employee_matricule' => 'required|string|exists:employees,matricule',
            'destination' => 'required|string',
            'raison' => 'required|string',
            'observation' => 'nullable|string',
            'date_depart' => 'required|date',
            'date_retour' => 'required|date|after_or_equal:date_depart',
            'moyen_transport' => 'required|string',
            'marque_vehicule' => 'nullable|required_if:moyen_transport,vehicule_service|string',
            'matricule_vehicule' => 'nullable|required_if:moyen_transport,vehicule_service|string'
        ]);

        $employee = Employee::where('matricule', strtoupper(trim($request->input('employee_matricule'))))->firstOrFail();

        $mission->update([
            'employee_id' => $employee->id,
            'destination' => trim($request->input('destination')),
            'raison' => trim($request->input('raison')),
            'observation' => trim($request->input('observation')),
            'date_depart' => $request->input('date_depart'),
            'date_retour' => $request->input('date_retour'),
            'moyen_transport' => $request->input('moyen_transport'),
            'marque_vehicule' => $request->input('marque_vehicule'),
            'matricule_vehicule' => $request->input('matricule_vehicule')
        ]);

        $mission->load('employee.department');

        return response()->json([
            'success' => true,
            'message' => 'Ordre de mission mis à jour avec succès.',
            'mission' => $mission
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json([
                'success' => false,
                'message' => 'Ordre de mission introuvable.'
            ], 404);
        }

        $mission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ordre de mission supprimé avec succès.'
        ]);
    }
}
