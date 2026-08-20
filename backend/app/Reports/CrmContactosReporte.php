<?php
namespace App\Reports;
class CrmContactosReporte extends CrmListadoReporte { protected function configuracion(): array { return ['clave'=>'crm-contactos','nombre'=>'CRM: Contactos','descripcion'=>'Contactos comerciales, clientes asociados y responsables.','tipo'=>'contactos']; } }
