import { useAppSelector } from "@/store/hooks";
import { can } from "@/lib/permissions/can";

export function usePermission(permission: string): boolean {
  const permissions = useAppSelector((state) => state.session.user?.permissions ?? []);
  return can(permissions, permission);
}

export function useSessionUser() {
  return useAppSelector((state) => state.session.user);
}
