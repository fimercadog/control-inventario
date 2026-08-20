<?php
namespace App\Reports;
class CrmOportunidadesReporte extends CrmListadoReporte { protected function configuracion(): array { return ['clave'=>'crm-oportunidades','nombre'=>'CRM: Pipeline de Oportunidades','descripcion'=>'Oportunidades comerciales por cliente, etapa y responsable.','tipo'=>'oportunidades']; } }
