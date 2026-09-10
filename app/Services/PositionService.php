<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PositionService
{
    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    public function next(Builder $query): float
    {
        $max = $query->max('position');

        return $max === null ? 1.0 : min((float) $max + 1.0, 99999999.0);
    }
}
