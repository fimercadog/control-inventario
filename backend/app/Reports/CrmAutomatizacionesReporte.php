<?php
namespace App\Reports;
class CrmAutomatizacionesReporte extends CrmListadoReporte { protected function configuracion(): array { return ['clave'=>'crm-automatizaciones','nombre'=>'CRM: Automatizaciones','descripcion'=>'Reglas comerciales y cantidad de ejecuciones registradas.','tipo'=>'automatizaciones']; } }
