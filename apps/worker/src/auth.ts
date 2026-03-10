import type { CurrentUser } from '../../../packages/shared/src/types';

export type UserRole = CurrentUser['role'];

export type AuthContext = {
  user: CurrentUser | null;
};

export function parseAuthHeader(authHeader: string | null): CurrentUser | null {
  if (!authHeader) return null;

  // MVP stub: replace with Clerk/Auth.js JWT verification.
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  if (token === 'demo-hr') {
    return { id: 'hr-001', email: 'hr@pinequest.mn', role: 'hr_admin' };
  }
  if (token === 'demo-finance') {
    return { id: 'finance-001', email: 'finance@pinequest.mn', role: 'finance_manager' };
  }

  return { id: 'emp-001', email: 'employee@pinequest.mn', role: 'employee' };
}

export function requireRole(user: CurrentUser | null, roles: UserRole[]): void {
  if (!user || !roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
}
