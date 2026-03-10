export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  ACTIVE: { label: 'Active', color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  ELIGIBLE: { label: 'Eligible', color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
  LOCKED: { label: 'Locked', color: '#9ca3af', bg: '#f9fafb', dot: '#d1d5db' },
  PENDING: { label: 'Pending', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  APPROVED: { label: 'Approved', color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  CANCELLED: { label: 'Cancelled', color: '#9ca3af', bg: '#f9fafb', dot: '#d1d5db' }
};

export const AUDIT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  ELIGIBILITY_CHANGE: { label: 'Eligibility Change', color: '#2563eb', bg: '#eff6ff', icon: '⚡' },
  REQUEST_SUBMITTED: { label: 'Request Submitted', color: '#7c3aed', bg: '#f5f3ff', icon: '📋' },
  REQUEST_APPROVED: { label: 'Request Approved', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  REQUEST_REJECTED: { label: 'Request Rejected', color: '#dc2626', bg: '#fef2f2', icon: '❌' },
  REQUEST_CANCELLED: { label: 'Request Cancelled', color: '#9ca3af', bg: '#f9fafb', icon: '🧾' },
  REQUEST_REVIEWED: { label: 'Request Reviewed', color: '#0ea5e9', bg: '#f0f9ff', icon: '🧑‍⚖️' },
  REQUEST_CONFIRMED: { label: 'Request Confirmed', color: '#0891b2', bg: '#ecfeff', icon: '🧷' },
  HR_OVERRIDE: { label: 'HR Override', color: '#d97706', bg: '#fffbeb', icon: '🔧' },
  CONTRACT_DOWNLOADED: { label: 'Contract Downloaded', color: '#0891b2', bg: '#ecfeff', icon: '📄' }
};

export const CATEGORIES = ['All', 'Wellness', 'Equipment', 'Career', 'Financial', 'Flexibility'] as const;

