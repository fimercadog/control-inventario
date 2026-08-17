export interface Empresa {
  id: number;
  nombre: string;
}

/** Matches AuthenticatedUserResource (backend). Also the shape of UserResource minus a few admin-only fields. */
export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  empresa_id: number;
  empresa: Empresa | null;
  is_platform_admin: boolean;
  avatar_path: string | null;
  avatar_url: string | null;
  theme: string;
  language: string;
  timezone: string;
  role: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthenticatedUser;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}
