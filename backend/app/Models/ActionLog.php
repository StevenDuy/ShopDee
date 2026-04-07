<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActionLog extends Model
{
    public $timestamps = false;

    protected $table = 'action_logs';

    protected $fillable = [
        'user_id',
        'type',
        'lat',
        'lng',
        'is_anomaly',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_anomaly' => 'boolean',
    ];
}
