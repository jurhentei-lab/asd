export type BenefitStatus = 'ACTIVE' | 'ELIGIBLE' | 'LOCKED' | 'PENDING';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'LEAVE' | 'TERMINATED';

export type RuleEvaluation = {
  ruleType: string;
  passed: boolean;
  reason: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  role: 'employee' | 'hr_admin' | 'finance_manager';
};
