export function can(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission);
}
