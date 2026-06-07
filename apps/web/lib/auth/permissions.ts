/**
 * The 9 roles in the platform.
 * Defined here to avoid cross-package TypeScript resolution issues.
 */
export type UserRole =
  | 'super_admin'
  | 'company_owner'
  | 'company_admin'
  | 'dispatcher'
  | 'accounting'
  | 'driver'
  | 'customer'
  | 'corporate_manager'
  | 'corporate_user'

/**
 * Role hierarchy — higher index = more privilege within company scope.
 * super_admin is global and outside the hierarchy.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  company_owner: 90,
  company_admin: 80,
  dispatcher: 60,
  accounting: 50,
  corporate_manager: 40,
  corporate_user: 30,
  driver: 20,
  customer: 10,
}

/** Roles that can access the admin dashboard */
export const ADMIN_ROLES: UserRole[] = [
  'super_admin',
  'company_owner',
  'company_admin',
  'dispatcher',
  'accounting',
]

/** Roles that can manage fleet and assign drivers */
export const DISPATCHER_ROLES: UserRole[] = [
  'super_admin',
  'company_owner',
  'company_admin',
  'dispatcher',
]

/** Roles that can view financial data */
export const ACCOUNTING_ROLES: UserRole[] = [
  'super_admin',
  'company_owner',
  'company_admin',
  'accounting',
]

/** Roles that can manage company settings */
export const OWNER_ROLES: UserRole[] = ['super_admin', 'company_owner', 'company_admin']

/** Roles that can book trips */
export const BOOKING_ROLES: UserRole[] = [
  'super_admin',
  'company_owner',
  'company_admin',
  'dispatcher',
  'customer',
  'corporate_manager',
  'corporate_user',
]

/** Returns true if the user has at least one of the required roles */
export function hasRole(userRole: UserRole, ...requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/** Returns true if user's role level is >= the minimum required role */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/** Returns true if user can access the admin section */
export function canAccessAdmin(role: UserRole): boolean {
  return hasRole(role, ...ADMIN_ROLES)
}

/** Returns true if user can dispatch (assign drivers, update bookings) */
export function canDispatch(role: UserRole): boolean {
  return hasRole(role, ...DISPATCHER_ROLES)
}

/** Returns true if user can view financial reports */
export function canViewFinancials(role: UserRole): boolean {
  return hasRole(role, ...ACCOUNTING_ROLES)
}

/** Returns true if user can manage company settings */
export function canManageCompany(role: UserRole): boolean {
  return hasRole(role, ...OWNER_ROLES)
}

/** Returns the default dashboard route after login based on role */
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin/dashboard'
    case 'company_owner':
    case 'company_admin':
      return '/admin/dashboard'
    case 'dispatcher':
      return '/dispatcher/dashboard'
    case 'accounting':
      return '/admin/reports'
    case 'driver':
      return '/driver/trips'
    case 'corporate_manager':
      return '/corporate/dashboard'
    case 'corporate_user':
      return '/corporate/book'
    case 'customer':
      return '/account/bookings'
    default:
      return '/admin/dashboard'
  }
}
