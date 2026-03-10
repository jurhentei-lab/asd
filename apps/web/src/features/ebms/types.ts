export type Employee = {
  id: string;
  employeeCode?: string;
  name: string;
  nameEng?: string;
  avatar?: string;
  role?: string;
  department?: string | null;
  level?: number;
  tenure?: string;
  okr?: boolean;
  lateArrivals?: number;
  status?: string;
};

export type BenefitRule = { label: string; passed: boolean; note?: string };

export type Benefit = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  vendor?: string | null;
  subsidy?: string;
  status: 'ACTIVE' | 'ELIGIBLE' | 'LOCKED' | 'PENDING';
  icon?: string;
  requiresContract?: boolean;
  lockReason?: string | null;
  rules?: BenefitRule[];
  contract?: {
    id: string;
    version: string;
    vendorName: string;
    expiryDate: string;
    signedUrl?: string | null;
  } | null;
};

export type BenefitRequest = {
  id: string;
  benefitId?: string;
  benefit_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  reviewedBy?: string | null;
  reviewed_by?: string | null;
  contractVersion?: string | null;
  contractAcceptedAt?: string | null;
  note?: string | null;
};

export type AuditEntry = {
  id: string;
  type: string;
  detail?: string;
  timestamp: string;
  benefitId?: string | null;
  benefit_id?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  triggeredBy?: string | null;
  triggered_by?: string | null;
  actor?: string | null;
  ruleTrace?: Array<{ result: string; label: string; from?: string }> | null;
};

