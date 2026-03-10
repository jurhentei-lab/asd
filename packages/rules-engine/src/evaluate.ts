export type Operator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';

export type RuleType =
  | 'employment_status'
  | 'okr_submitted'
  | 'attendance'
  | 'responsibility_level'
  | 'role'
  | 'tenure_days';

export type EligibilityRule = {
  id: string;
  benefitId: string;
  ruleType: RuleType;
  operator: Operator;
  value: unknown;
  errorMessage?: string | null;
  priority: number;
};

export type EmployeeProfile = {
  id: string;
  role: string;
  responsibilityLevel: number;
  employmentStatus: string;
  hireDate: string;
  okrSubmitted: boolean;
  lateArrivalCount: number;
};

export type RuleEvaluation = {
  ruleType: RuleType;
  passed: boolean;
  reason: string;
};

export function daysSince(isoDate: string, now = new Date()): number {
  const start = new Date(isoDate);
  const ms = now.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function compare(left: unknown, operator: Operator, right: unknown): boolean {
  switch (operator) {
    case 'eq':
      return left === right;
    case 'neq':
      return left !== right;
    case 'gt':
      return Number(left) > Number(right);
    case 'gte':
      return Number(left) >= Number(right);
    case 'lt':
      return Number(left) < Number(right);
    case 'lte':
      return Number(left) <= Number(right);
    case 'in':
      return Array.isArray(right) ? right.includes(left) : false;
    case 'not_in':
      return Array.isArray(right) ? !right.includes(left) : true;
    default:
      return false;
  }
}

function resolveLeftValue(profile: EmployeeProfile, ruleType: RuleType): unknown {
  switch (ruleType) {
    case 'employment_status':
      return profile.employmentStatus;
    case 'okr_submitted':
      return profile.okrSubmitted;
    case 'attendance':
      return profile.lateArrivalCount;
    case 'responsibility_level':
      return profile.responsibilityLevel;
    case 'role':
      return profile.role;
    case 'tenure_days':
      return daysSince(profile.hireDate);
    default:
      return null;
  }
}

export function evaluateRules(profile: EmployeeProfile, rules: EligibilityRule[]): RuleEvaluation[] {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  return sorted.map((rule) => {
    const leftValue = resolveLeftValue(profile, rule.ruleType);
    const passed = compare(leftValue, rule.operator, rule.value);

    return {
      ruleType: rule.ruleType,
      passed,
      reason: passed ? 'Passed' : (rule.errorMessage ?? 'Rule failed'),
    };
  });
}

export function computeEligibilityStatus(evaluations: RuleEvaluation[]): 'ELIGIBLE' | 'LOCKED' {
  return evaluations.every((e) => e.passed) ? 'ELIGIBLE' : 'LOCKED';
}
