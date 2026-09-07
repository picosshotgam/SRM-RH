<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Mission;
use App\Models\Conge;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        $employeesCount = Employee::count();
        $missionsCount = Mission::count();
        $congesCount = Conge::count();
        
        // Unique destinations (case-insensitive distinct destinations)
        $destinationsCount = Mission::select(DB::raw('upper(destination) as dest'))
            ->distinct()
            ->get()
            ->count();

        // Recent Missions (last 3, loaded with employee)
        $recentMissions = Mission::with('employee.department')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get();

        // Recent Congés (last 3, loaded with employee)
        $recentConges = Conge::with(['employee.department', 'interimEmployee.department'])
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get();

        return response()->json([
            'employeesCount' => $employeesCount,
            'missionsCount' => $missionsCount,
            'congesCount' => $congesCount,
            'destinationsCount' => $destinationsCount ?: 1,
            'recentMissions' => $recentMissions,
            'recentConges' => $recentConges
        ]);
    }
}
