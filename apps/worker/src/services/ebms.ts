import {
  computeEligibilityStatus,
  evaluateRules,
  type EligibilityRule,
  type EmployeeProfile,
} from '../../../../packages/rules-engine/src/evaluate';

type JsonObject = Record<string, unknown>;

const ELIGIBILITY_CACHE_TTL_SECONDS = 60 * 5;

type ContractRow = {
  id: string;
  benefit_id: string;
  version: string;
  vendor_name: string;
  expiry_date: string;
  r2_object_key: string;
};

export type BenefitRow = {
  id: string;
  name: string;
  category: string;
  subsidy_percent: number;
  requires_contract: number;
  is_core?: number;
  contract_id?: string | null;
  contract_version?: string | null;
  contract_vendor_name?: string | null;
  contract_expiry_date?: string | null;
};

export type EmployeeRow = {
  id: string;
  email?: string;
  name: string;
  name_eng?: string | null;
  role: string;
  department?: string | null;
  responsibility_level: number;
  employment_status: string;
  okr_submitted: number;
  late_arrival_count: number;
  hire_date: string;
};

type RequestRow = {
  id: string;
  employee_id: string;
  benefit_id: string;
  status: string;
  created_at: string;
};

export type BenefitRequestDetails = {
  id: string;
  employee_id: string;
  benefit_id: string;
  status: string;
  contract_version_accepted: string | null;
  contract_accepted_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_role: string;
  event_type: string;
  employee_id: string | null;
  benefit_id: string | null;
  old_status: string | null;
  new_status: string | null;
  reason: string | null;
  metadata_json: string | null;
  created_at: string;
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function all<T>(db: D1Database, sql: string, bindings: unknown[] = []): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...bindings);
  const result = await stmt.all<T>();
  return result.results ?? [];
}

async function first<T>(db: D1Database, sql: string, bindings: unknown[] = []): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...bindings);
  const result = await stmt.first<T>();
  return result ?? null;
}

async function run(db: D1Database, sql: string, bindings: unknown[] = []): Promise<void> {
  await db.prepare(sql).bind(...bindings).run();
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toProfile(employee: EmployeeRow): EmployeeProfile {
  return {
    id: employee.id,
    role: employee.role,
    responsibilityLevel: employee.responsibility_level,
    employmentStatus: employee.employment_status,
    hireDate: employee.hire_date,
    okrSubmitted: Boolean(employee.okr_submitted),
    lateArrivalCount: employee.late_arrival_count,
  };
}

function mapRequestStatusToBenefitStatus(status?: string): 'ACTIVE' | 'PENDING' | null {
  if (!status) return null;
  if (status === 'approved') return 'ACTIVE';
  if (status === 'pending') return 'PENDING';
  return null;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64Url(new Uint8Array(signature));
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function eligibilityCacheKey(employeeId: string): string {
  return `eligibility:${employeeId}`;
}

async function getActiveContractsForBenefitIds(db: D1Database, benefitIds: string[]): Promise<Record<string, ContractRow>> {
  if (benefitIds.length === 0) return {};

  const placeholders = benefitIds.map(() => '?').join(', ');
  const rows = await all<ContractRow>(
    db,
    `SELECT c.id, c.benefit_id, c.version, c.vendor_name, c.expiry_date, c.r2_object_key
     FROM contracts c
     WHERE c.is_active = 1 AND c.benefit_id IN (${placeholders})`,
    benefitIds,
  );

  const map: Record<string, ContractRow> = {};
  for (const row of rows) map[row.benefit_id] = row;
  return map;
}

async function createContractSignedUrl(
  baseUrl: string,
  contractId: string,
  employeeId: string,
  secret: string,
  ttlSeconds = 60 * 60 * 24 * 7,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${contractId}:${employeeId}:${exp}`;
  const sig = await signPayload(payload, secret);
  const url = new URL('/contracts/download', baseUrl);
  url.searchParams.set('contractId', contractId);
  url.searchParams.set('employeeId', employeeId);
  url.searchParams.set('exp', String(exp));
  url.searchParams.set('sig', sig);
  return url.toString();
}

export async function buildContractSignedUrl(
  baseUrl: string,
  contractId: string,
  employeeId: string,
  secret: string,
): Promise<string> {
  return createContractSignedUrl(baseUrl, contractId, employeeId, secret);
}

export async function getEmployeeById(db: D1Database, employeeId: string): Promise<EmployeeRow | null> {
  return first<EmployeeRow>(
    db,
    `SELECT id, email, name, name_eng, role, department, responsibility_level, employment_status, okr_submitted, late_arrival_count, hire_date
     FROM employees WHERE id = ?`,
    [employeeId],
  );
}

export async function listBenefitRequestsForEmployee(db: D1Database, employeeId: string): Promise<BenefitRequestDetails[]> {
  return all<BenefitRequestDetails>(
    db,
    `SELECT id, employee_id, benefit_id, status,
            contract_version_accepted, contract_accepted_at, reviewed_by,
            created_at, updated_at
     FROM benefit_requests
     WHERE employee_id = ?
     ORDER BY created_at DESC
     LIMIT 200`,
    [employeeId],
  );
}

export async function getBenefitRequestDetails(db: D1Database, requestId: string): Promise<BenefitRequestDetails | null> {
  return first<BenefitRequestDetails>(
    db,
    `SELECT id, employee_id, benefit_id, status,
            contract_version_accepted, contract_accepted_at, reviewed_by,
            created_at, updated_at
     FROM benefit_requests
     WHERE id = ?`,
    [requestId],
  );
}

export async function listBenefits(db: D1Database, category?: string | null): Promise<BenefitRow[]> {
  if (category) {
    return all<BenefitRow>(
      db,
      `SELECT b.id, b.name, b.category, b.subsidy_percent, b.requires_contract, b.is_core,
              c.id AS contract_id, c.version AS contract_version, c.vendor_name AS contract_vendor_name, c.expiry_date AS contract_expiry_date
       FROM benefits b
       LEFT JOIN contracts c ON c.id = b.active_contract_id
       WHERE b.is_active = 1 AND b.category = ?
       ORDER BY b.name`,
      [category],
    );
  }

  return all<BenefitRow>(
    db,
    `SELECT b.id, b.name, b.category, b.subsidy_percent, b.requires_contract, b.is_core,
            c.id AS contract_id, c.version AS contract_version, c.vendor_name AS contract_vendor_name, c.expiry_date AS contract_expiry_date
     FROM benefits b
     LEFT JOIN contracts c ON c.id = b.active_contract_id
     WHERE b.is_active = 1
     ORDER BY b.category, b.name`,
  );
}

export async function listRulesForBenefitIds(db: D1Database, benefitIds: string[]): Promise<Record<string, EligibilityRule[]>> {
  if (benefitIds.length === 0) return {};
  const placeholders = benefitIds.map(() => '?').join(', ');
  const rows = await all<{
    id: string;
    benefit_id: string;
    rule_type: EligibilityRule['ruleType'];
    operator: EligibilityRule['operator'];
    value: string;
    error_message: string | null;
    priority: number;
  }>(
    db,
    `SELECT id, benefit_id, rule_type, operator, value, error_message, priority
     FROM eligibility_rules
     WHERE is_active = 1 AND benefit_id IN (${placeholders})
     ORDER BY benefit_id, priority`,
    benefitIds,
  );

  const grouped: Record<string, EligibilityRule[]> = {};

  for (const row of rows) {
    const mapped: EligibilityRule = {
      id: row.id,
      benefitId: row.benefit_id,
      ruleType: row.rule_type,
      operator: row.operator,
      value: safeJsonParse(row.value),
      errorMessage: row.error_message,
      priority: row.priority,
    };

    if (!grouped[row.benefit_id]) grouped[row.benefit_id] = [];
    grouped[row.benefit_id].push(mapped);
  }

  return grouped;
}

export async function getLatestRequestStatuses(db: D1Database, employeeId: string): Promise<Map<string, string>> {
  const rows = await all<{ benefit_id: string; status: string }>(
    db,
    `SELECT br.benefit_id, br.status
     FROM benefit_requests br
     INNER JOIN (
       SELECT benefit_id, MAX(created_at) AS latest_created_at
       FROM benefit_requests
       WHERE employee_id = ?
       GROUP BY benefit_id
     ) latest ON latest.benefit_id = br.benefit_id AND latest.latest_created_at = br.created_at
     WHERE br.employee_id = ?`,
    [employeeId, employeeId],
  );

  const map = new Map<string, string>();
  for (const row of rows) map.set(row.benefit_id, row.status);
  return map;
}

export type ComputedEligibility = {
  benefit: {
    id: string;
    name: string;
    category: string;
    subsidyPercent: number;
    requiresContract: boolean;
    activeContract: {
      id: string;
      version: string;
      vendorName: string;
      expiryDate: string;
      signedUrl: string | null;
    } | null;
  };
  status: 'ACTIVE' | 'ELIGIBLE' | 'LOCKED' | 'PENDING';
  ruleEvaluations: Array<{ ruleType: string; passed: boolean; reason: string }>;
  computedAt: string;
};

export async function computeAndPersistEligibility(
  db: D1Database,
  employeeId: string,
  opts?: { baseUrl?: string; signingSecret?: string },
): Promise<ComputedEligibility[]> {
  const employee = await getEmployeeById(db, employeeId);
  if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');

  const benefitRows = await listBenefits(db);
  const rulesByBenefit = await listRulesForBenefitIds(db, benefitRows.map((b) => b.id));
  const requestStatuses = await getLatestRequestStatuses(db, employeeId);
  const activeContracts = await getActiveContractsForBenefitIds(db, benefitRows.map((b) => b.id));

  const profile = toProfile(employee);
  const nowIso = new Date().toISOString();
  const result: ComputedEligibility[] = [];

  for (const benefit of benefitRows) {
    const rules = rulesByBenefit[benefit.id] ?? [];
    const ruleEvaluations = evaluateRules(profile, rules);
    const derivedStatus = computeEligibilityStatus(ruleEvaluations);
    const requestState = mapRequestStatusToBenefitStatus(requestStatuses.get(benefit.id));
    const finalStatus = requestState ?? derivedStatus;
    const contract = activeContracts[benefit.id];

    let signedUrl: string | null = null;
    if (contract && opts?.baseUrl && opts?.signingSecret) {
      signedUrl = await createContractSignedUrl(opts.baseUrl, contract.id, employeeId, opts.signingSecret);
    }

    await run(
      db,
      `INSERT INTO benefit_eligibility
        (employee_id, benefit_id, status, rule_evaluation_json, computed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(employee_id, benefit_id) DO UPDATE SET
        status = excluded.status,
        rule_evaluation_json = excluded.rule_evaluation_json,
        computed_at = excluded.computed_at`,
      [employeeId, benefit.id, finalStatus.toLowerCase(), JSON.stringify(ruleEvaluations), nowIso],
    );

    result.push({
      benefit: {
        id: benefit.id,
        name: benefit.name,
        category: benefit.category,
        subsidyPercent: benefit.subsidy_percent,
        requiresContract: Boolean(benefit.requires_contract),
        activeContract: contract
          ? {
              id: contract.id,
              version: contract.version,
              vendorName: contract.vendor_name,
              expiryDate: contract.expiry_date,
              signedUrl,
            }
          : null,
      },
      status: finalStatus,
      ruleEvaluations,
      computedAt: nowIso,
    });
  }

  return result;
}

export async function getMyBenefitsCached(
  db: D1Database,
  kv: KVNamespace,
  employeeId: string,
  opts?: { baseUrl?: string; signingSecret?: string },
): Promise<ComputedEligibility[]> {
  const key = eligibilityCacheKey(employeeId);
  const cached = await kv.get<ComputedEligibility[]>(key, { type: 'json' });
  if (cached) return cached;

  const computed = await computeAndPersistEligibility(db, employeeId, opts);
  await kv.put(key, JSON.stringify(computed), { expirationTtl: ELIGIBILITY_CACHE_TTL_SECONDS });
  return computed;
}

export async function invalidateEligibilityCache(kv: KVNamespace, employeeId: string): Promise<void> {
  await kv.delete(eligibilityCacheKey(employeeId));
}

export async function listAuditEntries(
  db: D1Database,
  filters: { employeeId?: string | null; benefitId?: string | null; dateFrom?: string | null; dateTo?: string | null },
) {
  const clauses: string[] = [];
  const bindings: unknown[] = [];

  if (filters.employeeId) {
    clauses.push('employee_id = ?');
    bindings.push(filters.employeeId);
  }
  if (filters.benefitId) {
    clauses.push('benefit_id = ?');
    bindings.push(filters.benefitId);
  }
  if (filters.dateFrom) {
    clauses.push('created_at >= ?');
    bindings.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push('created_at <= ?');
    bindings.push(filters.dateTo);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return all<{ id: string; event_type: string; actor_role: string; reason: string | null; created_at: string }>(
    db,
    `SELECT id, event_type, actor_role, reason, created_at
     FROM audit_log ${whereSql}
     ORDER BY created_at DESC
     LIMIT 500`,
    bindings,
  );
}

export async function listAuditEntriesDetailed(
  db: D1Database,
  filters: { employeeId?: string | null; benefitId?: string | null; dateFrom?: string | null; dateTo?: string | null },
): Promise<AuditLogRow[]> {
  const clauses: string[] = [];
  const bindings: unknown[] = [];

  if (filters.employeeId) {
    clauses.push('employee_id = ?');
    bindings.push(filters.employeeId);
  }
  if (filters.benefitId) {
    clauses.push('benefit_id = ?');
    bindings.push(filters.benefitId);
  }
  if (filters.dateFrom) {
    clauses.push('created_at >= ?');
    bindings.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push('created_at <= ?');
    bindings.push(filters.dateTo);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return all<AuditLogRow>(
    db,
    `SELECT id, actor_id, actor_role, event_type, employee_id, benefit_id,
            old_status, new_status, reason, metadata_json, created_at
     FROM audit_log ${whereSql}
     ORDER BY created_at DESC
     LIMIT 500`,
    bindings,
  );
}

export async function createBenefitRequest(db: D1Database, employeeId: string, benefitId: string) {
  const eligibilities = await computeAndPersistEligibility(db, employeeId);
  const target = eligibilities.find((e) => e.benefit.id === benefitId);
  if (!target) throw new Error('BENEFIT_NOT_FOUND');
  if (target.status !== 'ELIGIBLE') throw new Error('BENEFIT_NOT_ELIGIBLE');

  const id = genId('req');
  const now = new Date().toISOString();
  await run(
    db,
    `INSERT INTO benefit_requests (id, employee_id, benefit_id, status, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
    [id, employeeId, benefitId, now, now],
  );

  await insertAudit(db, {
    actorId: employeeId,
    actorRole: 'employee',
    eventType: 'benefit_request_created',
    employeeId,
    benefitId,
    newStatus: 'pending',
    reason: 'Employee submitted benefit request',
  });

  return first<RequestRow>(db, 'SELECT id, employee_id, benefit_id, status, created_at FROM benefit_requests WHERE id = ?', [id]);
}

export async function confirmBenefitRequest(db: D1Database, employeeId: string, requestId: string, contractAccepted: boolean, ipAddress?: string | null) {
  const req = await first<{
    id: string;
    employee_id: string;
    benefit_id: string;
    status: string;
    requires_contract: number;
  }>(
    db,
    `SELECT br.id, br.employee_id, br.benefit_id, br.status, b.requires_contract
     FROM benefit_requests br
     JOIN benefits b ON b.id = br.benefit_id
     WHERE br.id = ?`,
    [requestId],
  );

  if (!req) throw new Error('REQUEST_NOT_FOUND');
  if (req.employee_id !== employeeId) throw new Error('FORBIDDEN');
  if (req.status !== 'pending') throw new Error('REQUEST_NOT_PENDING');

  let contractVersion: string | null = null;
  let contractAcceptedAt: string | null = null;

  if (Boolean(req.requires_contract)) {
    if (!contractAccepted) throw new Error('CONTRACT_ACCEPTANCE_REQUIRED');

    const contract = await first<{ id: string; sha256_hash: string }>(
      db,
      `SELECT id, sha256_hash FROM contracts WHERE benefit_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1`,
      [req.benefit_id],
    );

    if (!contract) throw new Error('ACTIVE_CONTRACT_NOT_FOUND');

    contractVersion = contract.sha256_hash;
    contractAcceptedAt = new Date().toISOString();

    await run(
      db,
      `INSERT INTO contract_acceptances
        (id, employee_id, benefit_id, contract_id, contract_version_hash, accepted_at, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [genId('ca'), employeeId, req.benefit_id, contract.id, contract.sha256_hash, contractAcceptedAt, ipAddress ?? null],
    );
  }

  const now = new Date().toISOString();
  await run(
    db,
    `UPDATE benefit_requests
     SET contract_version_accepted = ?, contract_accepted_at = ?, updated_at = ?
     WHERE id = ?`,
    [contractVersion, contractAcceptedAt, now, requestId],
  );

  await insertAudit(db, {
    actorId: employeeId,
    actorRole: 'employee',
    eventType: 'benefit_request_confirmed',
    employeeId,
    benefitId: req.benefit_id,
    newStatus: 'pending',
    reason: 'Benefit request confirmed by employee',
  });

  return first<RequestRow>(db, 'SELECT id, employee_id, benefit_id, status, created_at FROM benefit_requests WHERE id = ?', [requestId]);
}

export async function cancelBenefitRequest(db: D1Database, employeeId: string, requestId: string) {
  const req = await first<RequestRow>(db, 'SELECT id, employee_id, benefit_id, status, created_at FROM benefit_requests WHERE id = ?', [requestId]);
  if (!req) throw new Error('REQUEST_NOT_FOUND');
  if (req.employee_id !== employeeId) throw new Error('FORBIDDEN');
  if (req.status !== 'pending') throw new Error('ONLY_PENDING_CAN_BE_CANCELLED');

  const now = new Date().toISOString();
  await run(db, `UPDATE benefit_requests SET status = 'cancelled', updated_at = ? WHERE id = ?`, [now, requestId]);

  await insertAudit(db, {
    actorId: employeeId,
    actorRole: 'employee',
    eventType: 'benefit_request_cancelled',
    employeeId,
    benefitId: req.benefit_id,
    oldStatus: req.status,
    newStatus: 'cancelled',
    reason: 'Benefit request cancelled by employee',
  });

  return first<RequestRow>(db, 'SELECT id, employee_id, benefit_id, status, created_at FROM benefit_requests WHERE id = ?', [requestId]);
}

export async function overrideEligibility(
  db: D1Database,
  actorId: string,
  input: { employeeId: string; benefitId: string; status: 'ACTIVE' | 'ELIGIBLE' | 'LOCKED' | 'PENDING'; reason: string; expiresAt?: string | null },
) {
  const now = new Date().toISOString();

  await run(
    db,
    `INSERT INTO benefit_eligibility
      (employee_id, benefit_id, status, rule_evaluation_json, computed_at, override_by, override_reason, override_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(employee_id, benefit_id) DO UPDATE SET
      status = excluded.status,
      rule_evaluation_json = excluded.rule_evaluation_json,
      computed_at = excluded.computed_at,
      override_by = excluded.override_by,
      override_reason = excluded.override_reason,
      override_expires_at = excluded.override_expires_at`,
    [
      input.employeeId,
      input.benefitId,
      input.status.toLowerCase(),
      JSON.stringify([{ ruleType: 'manual_override', passed: true, reason: input.reason }]),
      now,
      actorId,
      input.reason,
      input.expiresAt ?? null,
    ],
  );

  await insertAudit(db, {
    actorId,
    actorRole: 'hr_admin',
    eventType: 'eligibility_overridden',
    employeeId: input.employeeId,
    benefitId: input.benefitId,
    newStatus: input.status.toLowerCase(),
    reason: input.reason,
  });
}

export async function uploadContract(
  db: D1Database,
  bucket: R2Bucket,
  input: { benefitId: string; vendorName: string; version: string; filename: string; body?: ArrayBuffer | string },
) {
  const id = genId('contract');
  const now = new Date().toISOString();
  const objectKey = `contracts/${input.benefitId}/${input.version}/${input.filename}`;
  const body = input.body ?? `EBMS placeholder contract for ${input.benefitId} ${input.version}`;

  const hashSource = typeof body === 'string' ? new TextEncoder().encode(body) : body;
  const hashBuffer = await crypto.subtle.digest('SHA-256', hashSource);
  const sha256Hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

  await bucket.put(objectKey, body, {
    httpMetadata: { contentType: 'application/pdf' },
  });

  await run(db, `UPDATE contracts SET is_active = 0, updated_at = ? WHERE benefit_id = ?`, [now, input.benefitId]);

  await run(
    db,
    `INSERT INTO contracts
      (id, benefit_id, vendor_name, version, r2_object_key, sha256_hash, effective_date, expiry_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, input.benefitId, input.vendorName, input.version, objectKey, sha256Hash, now, now, now, now],
  );

  await run(db, `UPDATE benefits SET active_contract_id = ?, updated_at = ? WHERE id = ?`, [id, now, input.benefitId]);

  return first<{ id: string; version: string; vendor_name: string; expiry_date: string }>(
    db,
    `SELECT id, version, vendor_name, expiry_date FROM contracts WHERE id = ?`,
    [id],
  );
}

export async function updateEmployeeSignals(
  db: D1Database,
  employeeId: string,
  patch: {
    okrSubmitted?: boolean;
    lateArrivalCount?: number;
    responsibilityLevel?: number;
    employmentStatus?: 'active' | 'probation' | 'leave' | 'terminated';
    role?: string;
    hireDate?: string;
  },
) {
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (typeof patch.okrSubmitted === 'boolean') {
    updates.push('okr_submitted = ?');
    bindings.push(patch.okrSubmitted ? 1 : 0);
  }
  if (typeof patch.lateArrivalCount === 'number') {
    updates.push('late_arrival_count = ?');
    bindings.push(patch.lateArrivalCount);
    updates.push('late_arrival_updated_at = ?');
    bindings.push(new Date().toISOString());
  }
  if (typeof patch.responsibilityLevel === 'number') {
    updates.push('responsibility_level = ?');
    bindings.push(patch.responsibilityLevel);
  }
  if (patch.employmentStatus) {
    updates.push('employment_status = ?');
    bindings.push(patch.employmentStatus);
  }
  if (patch.role) {
    updates.push('role = ?');
    bindings.push(patch.role);
  }
  if (patch.hireDate) {
    updates.push('hire_date = ?');
    bindings.push(patch.hireDate);
  }

  if (updates.length === 0) {
    throw new Error('NO_TRIGGER_FIELDS');
  }

  updates.push('updated_at = ?');
  bindings.push(new Date().toISOString());
  bindings.push(employeeId);

  await run(
    db,
    `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`,
    bindings,
  );
}

export async function reviewBenefitRequest(
  db: D1Database,
  actorId: string,
  actorRole: 'hr_admin' | 'finance_manager',
  input: { requestId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; reason?: string | null },
) {
  const existing = await first<RequestRow>(db, `SELECT id, employee_id, benefit_id, status, created_at FROM benefit_requests WHERE id = ?`, [input.requestId]);
  if (!existing) throw new Error('REQUEST_NOT_FOUND');

  const next = input.status.toLowerCase();
  const now = new Date().toISOString();
  await run(
    db,
    `UPDATE benefit_requests SET status = ?, reviewed_by = ?, updated_at = ? WHERE id = ?`,
    [next, actorId, now, input.requestId],
  );

  await insertAudit(db, {
    actorId,
    actorRole,
    eventType: 'benefit_request_reviewed',
    employeeId: existing.employee_id,
    benefitId: existing.benefit_id,
    oldStatus: existing.status,
    newStatus: next,
    reason: input.reason ?? null,
  });

  return first<RequestRow>(db, `SELECT id, employee_id, benefit_id, status, created_at FROM benefit_requests WHERE id = ?`, [input.requestId]);
}

export async function getEmployeeSnapshot(
  db: D1Database,
  employeeId: string,
  opts?: { baseUrl?: string; signingSecret?: string; useCache?: boolean; kv?: KVNamespace },
) {
  const employee = await getEmployeeById(db, employeeId);
  if (!employee) return null;

  const benefits = opts?.useCache && opts.kv
    ? await getMyBenefitsCached(db, opts.kv, employeeId, { baseUrl: opts.baseUrl, signingSecret: opts.signingSecret })
    : await computeAndPersistEligibility(db, employeeId, { baseUrl: opts?.baseUrl, signingSecret: opts?.signingSecret });

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    responsibilityLevel: employee.responsibility_level,
    employmentStatus: employee.employment_status.toUpperCase(),
    okrSubmitted: Boolean(employee.okr_submitted),
    lateArrivalCount: employee.late_arrival_count,
    benefits,
  };
}

export async function resolveContractDownload(
  db: D1Database,
  bucket: R2Bucket,
  params: { contractId: string; employeeId: string; exp: string; sig: string },
  signingSecret: string,
): Promise<Response> {
  const expUnix = Number(params.exp);
  if (!Number.isFinite(expUnix) || expUnix <= Math.floor(Date.now() / 1000)) {
    return new Response('Link expired', { status: 401 });
  }

  const expected = await signPayload(`${params.contractId}:${params.employeeId}:${params.exp}`, signingSecret);
  if (!timingSafeEq(expected, params.sig)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const contract = await first<{ id: string; r2_object_key: string; version: string }>(
    db,
    `SELECT id, r2_object_key, version FROM contracts WHERE id = ?`,
    [params.contractId],
  );
  if (!contract) return new Response('Contract not found', { status: 404 });

  const object = await bucket.get(contract.r2_object_key);
  if (!object) return new Response('Contract object not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('content-disposition', `inline; filename="contract_${contract.id}.pdf"`);

  await insertAudit(db, {
    actorId: params.employeeId,
    actorRole: 'employee',
    eventType: 'contract_downloaded',
    metadata: { contractId: params.contractId, version: contract.version },
  });

  return new Response(object.body, { headers });
}

async function insertAudit(
  db: D1Database,
  input: {
    actorId?: string | null;
    actorRole: string;
    eventType: string;
    employeeId?: string | null;
    benefitId?: string | null;
    oldStatus?: string | null;
    newStatus?: string | null;
    reason?: string | null;
    metadata?: JsonObject;
  },
) {
  await run(
    db,
    `INSERT INTO audit_log
      (id, actor_id, actor_role, event_type, employee_id, benefit_id, old_status, new_status, reason, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      genId('audit'),
      input.actorId ?? null,
      input.actorRole,
      input.eventType,
      input.employeeId ?? null,
      input.benefitId ?? null,
      input.oldStatus ?? null,
      input.newStatus ?? null,
      input.reason ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      new Date().toISOString(),
    ],
  );
}
