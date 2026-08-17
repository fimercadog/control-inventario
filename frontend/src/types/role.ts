export interface Role {
  id: number;
  name: string;
  estado: string;
  permisos?: string[];
  permisos_count?: number;
  usuarios_count?: number;
  created_at: string;
  updated_at: string;
}
