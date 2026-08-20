<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\Contacto;
use App\Models\Oportunidad;
use App\Reports\Concerns\AplicaPaginacion;

abstract class CrmListadoReporte implements Reporte
{
    use AplicaPaginacion;
    use FiltersByEmpresa;

    abstract protected function configuracion(): array;
    public function clave(): string { return $this->configuracion()['clave']; }
    public function nombre(): string { return $this->configuracion()['nombre']; }
    public function descripcion(): string { return $this->configuracion()['descripcion']; }
    public function filtrosDisponibles(): array { return []; }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $tipo = $this->configuracion()['tipo'];
        $query = match ($tipo) {
            'contactos' => $this->paraEmpresaActual(Contacto::query())->with(['cliente:id,nombre', 'responsable:id,name'])->latest(),
            'oportunidades' => $this->paraEmpresaActual(Oportunidad::query())->with(['cliente:id,nombre', 'etapa:id,nombre', 'responsable:id,name'])->latest(),
            'actividades' => $this->paraEmpresaActual(Actividad::query())->with(['cliente:id,nombre', 'oportunidad:id,nombre', 'responsable:id,name'])->latest('programada_para'),
            default => $this->paraEmpresaActual(Automatizacion::query())->withCount('ejecuciones')->latest(),
        };
        ['filas' => $items, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);
        [$columnas, $filas] = match ($tipo) {
            'contactos' => [[['clave'=>'nombre','etiqueta'=>'Nombre'],['clave'=>'cliente','etiqueta'=>'Cliente'],['clave'=>'correo','etiqueta'=>'Correo'],['clave'=>'responsable','etiqueta'=>'Responsable'],['clave'=>'estado','etiqueta'=>'Estado']], array_map(fn (Contacto $x) => ['nombre'=>trim($x->nombre.' '.$x->apellido),'cliente'=>$x->cliente?->nombre ?? '—','correo'=>$x->email ?? '—','responsable'=>$x->responsable?->name ?? '—','estado'=>$x->estado], $items)],
            'oportunidades' => [[['clave'=>'nombre','etiqueta'=>'Oportunidad'],['clave'=>'cliente','etiqueta'=>'Cliente'],['clave'=>'etapa','etiqueta'=>'Etapa'],['clave'=>'monto','etiqueta'=>'Monto'],['clave'=>'responsable','etiqueta'=>'Responsable']], array_map(fn (Oportunidad $x) => ['nombre'=>$x->nombre,'cliente'=>$x->cliente?->nombre ?? '—','etapa'=>$x->etapa?->nombre ?? '—','monto'=>(float)$x->monto,'responsable'=>$x->responsable?->name ?? '—'], $items)],
            'actividades' => [[['clave'=>'asunto','etiqueta'=>'Asunto'],['clave'=>'cliente','etiqueta'=>'Cliente'],['clave'=>'oportunidad','etiqueta'=>'Oportunidad'],['clave'=>'programada','etiqueta'=>'Programada'],['clave'=>'estado','etiqueta'=>'Estado']], array_map(fn (Actividad $x) => ['asunto'=>$x->asunto,'cliente'=>$x->cliente?->nombre ?? '—','oportunidad'=>$x->oportunidad?->nombre ?? '—','programada'=>$x->programada_para?->format('Y-m-d H:i') ?? '—','estado'=>$x->estado], $items)],
            default => [[['clave'=>'nombre','etiqueta'=>'Automatización'],['clave'=>'evento','etiqueta'=>'Evento'],['clave'=>'estado','etiqueta'=>'Estado'],['clave'=>'ejecuciones','etiqueta'=>'Ejecuciones']], array_map(fn (Automatizacion $x) => ['nombre'=>$x->nombre,'evento'=>$x->evento,'estado'=>$x->activa ? 'Activa' : 'Inactiva','ejecuciones'=>$x->ejecuciones_count], $items)],
        };
        return new ReporteResultadoDTO(clave: $this->clave(), titulo: $this->nombre(), columnas: $columnas, filas: $filas, filtrosAplicados: $filtros, total: $total);
    }
}
