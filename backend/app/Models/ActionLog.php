<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActionLog extends Model
{
    public $timestamps = true;

    protected $table = 'action_logs';

    protected $fillable = [
        'user_id',
        'type',
        'path',
        'prev_path',
        'nav_time_ms',
        'lat',
        'lng',
        'duration_ms',
        'wrong_password_attempts',
        'purchase_quantity',
        'purchase_value',
        'avg_purchase_value',
        'distance_km',
        'is_anomaly',
        'is_fraud_labeled',
        'confidence_score',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_anomaly' => 'boolean',
        'is_fraud_labeled' => 'boolean',
        'purchase_value' => 'decimal:2',
        'avg_purchase_value' => 'decimal:2',
        'confidence_score' => 'decimal:4',
    ];
}
