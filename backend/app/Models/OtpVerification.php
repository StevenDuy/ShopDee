<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    protected $fillable = [
        'email',
        'code',
        'purpose',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
