<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Conge extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'nombre_jours',
        'date_depart',
        'date_retour',
        'date_reprise',
        'motif',
        'interim_employee_id',
        'status',
        'date_retour_effective',
        'nombre_jours_effectif',
        'jours_restitues'
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function interimEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'interim_employee_id');
    }
}
