<?php
namespace App\Reports;
class CrmActividadesReporte extends CrmListadoReporte { protected function configuracion(): array { return ['clave'=>'crm-actividades','nombre'=>'CRM: Seguimientos','descripcion'=>'Llamadas, reuniones, correos y tareas comerciales programadas.','tipo'=>'actividades']; } }
