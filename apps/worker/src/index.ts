import { Hono } from 'hono';
import { createYoga } from 'graphql-yoga';
import { parseAuthHeader } from './auth';
import { ebmsSchema } from './graphql/schema';
import {
  computeAndPersistEligibility,
  invalidateEligibilityCache,
  getBenefitRequestDetails,
  getEmployeeById,
  getMyBenefitsCached,
  listAuditEntriesDetailed,
  listBenefitRequestsForEmployee,
  listBenefits,
  resolveContractDownload,
  updateEmployeeSignals,
  uploadContract,
  confirmBenefitRequest as confirmBenefitRequestSvc,
  createBenefitRequest as createBenefitRequestSvc,
  cancelBenefitRequest as cancelBenefitRequestSvc,
} from './services/ebms';

export type Env = {
  DB: D1Database;
  EBMS_KV: KVNamespace;
  CONTRACTS_BUCKET: R2Bucket;
  CONTRACT_SIGNING_SECRET: string;
  SYNC_API_KEY?: string;
};

const app = new Hono<{ Bindings: Env }>();

function getBaseUrl(request: Request): string {
  return new URL(request.url).origin;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function requireUser(authHeader: string | null) {
  const user = parseAuthHeader(authHeader);
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

const yoga = createYoga<{
  Bindings: Env;
}>({
  schema: ebmsSchema,
  graphqlEndpoint: '/graphql',
  context: ({ request, env }) => ({
    env,
    request,
    user: parseAuthHeader(request.headers.get('authorization')),
  }),
  landingPage: false,
});

app.on(['GET', 'POST'], '/graphql', (c) => yoga.fetch(c.req.raw, c.env));

// ─── REST COMPAT API (for simple front-end prototypes) ───────────────────────
app.use('/api/*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

app.get('/api/employee', async (c) => {
  try {
    const user = requireUser(c.req.header('authorization') ?? null);
    const emp = await getEmployeeById(c.env.DB, user.id);
    if (!emp) return c.json({ error: 'EMPLOYEE_NOT_FOUND' }, 404);

    const hireDate = new Date(emp.hire_date);
    const tenureDays = Number.isFinite(hireDate.getTime())
      ? Math.max(0, Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const avatar = (emp.name_eng ?? emp.name ?? '?').trim().slice(0, 1).toUpperCase() || '?';

    return c.json({
      id: emp.id,
      employeeCode: emp.id,
      name: emp.name,
      nameEng: emp.name_eng ?? emp.name,
      role: emp.role,
      department: emp.department ?? null,
      level: emp.responsibility_level,
      status: emp.employment_status.toUpperCase(),
      okr: Boolean(emp.okr_submitted),
      lateArrivals: emp.late_arrival_count,
      tenure: `${tenureDays}d`,
      avatar,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHORIZED' ? 401 : 500;
    return c.json({ error: msg }, status);
  }
});

app.get('/api/employee/benefits', async (c) => {
  try {
    const user = requireUser(c.req.header('authorization') ?? null);
    const baseUrl = getBaseUrl(c.req.raw);
    const signingSecret = c.env.CONTRACT_SIGNING_SECRET;

    const computed = await getMyBenefitsCached(c.env.DB, c.env.EBMS_KV, user.id, {
      baseUrl,
      signingSecret,
    });

    const iconByCategory: Record<string, string> = {
      wellness: '🧘',
      equipment: '💻',
      career: '🚀',
      financial: '💰',
      flexibility: '🏝️',
    };

    const result = computed.map((entry) => {
      const failed = (entry.ruleEvaluations ?? []).find((r) => !r.passed);
      const subsidy = entry.benefit.subsidyPercent > 0 ? `${entry.benefit.subsidyPercent}%` : '—';
      const vendor = entry.benefit.activeContract?.vendorName ?? null;
      return {
        id: entry.benefit.id,
        slug: entry.benefit.id,
        name: entry.benefit.name,
        category: entry.benefit.category.charAt(0).toUpperCase() + entry.benefit.category.slice(1),
        vendor,
        subsidy,
        status: entry.status,
        requiresContract: entry.benefit.requiresContract,
        contract: entry.benefit.activeContract,
        icon: iconByCategory[entry.benefit.category] ?? '🎁',
        rules: (entry.ruleEvaluations ?? []).map((r) => ({
          label: r.ruleType.replace(/_/g, ' '),
          passed: r.passed,
          note: r.reason,
        })),
        lockReason: entry.status === 'LOCKED' ? (failed?.reason ?? null) : null,
      };
    });

    return c.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHORIZED' ? 401 : 500;
    return c.json({ error: msg }, status);
  }
});

app.get('/api/employee/requests', async (c) => {
  try {
    const user = requireUser(c.req.header('authorization') ?? null);
    const rows = await listBenefitRequestsForEmployee(c.env.DB, user.id);
    return c.json(
      rows.map((r) => ({
        id: r.id,
        employee_id: r.employee_id,
        benefit_id: r.benefit_id,
        status: r.status.toUpperCase(),
        contractVersion: r.contract_version_accepted,
        contractAcceptedAt: r.contract_accepted_at,
        reviewedBy: r.reviewed_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHORIZED' ? 401 : 500;
    return c.json({ error: msg }, status);
  }
});

app.post('/api/employee/requests', async (c) => {
  try {
    const user = requireUser(c.req.header('authorization') ?? null);
    const body = await c.req.json<{ benefitId?: string; contractAccepted?: boolean }>();
    if (!body.benefitId) return c.json({ error: 'benefitId is required' }, 400);

    const created = await createBenefitRequestSvc(c.env.DB, user.id, body.benefitId);
    const reqId = created?.id;
    if (!reqId) return c.json({ error: 'REQUEST_CREATE_FAILED' }, 500);

    // single-step UX: confirm immediately (logs acceptance if contract is required)
    await confirmBenefitRequestSvc(c.env.DB, user.id, reqId, Boolean(body.contractAccepted));
    await invalidateEligibilityCache(c.env.EBMS_KV, user.id);

    const full = await getBenefitRequestDetails(c.env.DB, reqId);
    if (!full) return c.json({ error: 'REQUEST_NOT_FOUND' }, 404);

    return c.json({
      id: full.id,
      employee_id: full.employee_id,
      benefit_id: full.benefit_id,
      status: full.status.toUpperCase(),
      contractVersion: full.contract_version_accepted,
      contractAcceptedAt: full.contract_accepted_at,
      reviewedBy: full.reviewed_by,
      created_at: full.created_at,
      updated_at: full.updated_at,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status =
      msg === 'UNAUTHORIZED' ? 401 :
      msg === 'BENEFIT_NOT_ELIGIBLE' ? 400 :
      msg === 'CONTRACT_ACCEPTANCE_REQUIRED' ? 400 :
      msg === 'ACTIVE_CONTRACT_NOT_FOUND' ? 409 :
      msg === 'FORBIDDEN' ? 403 :
      500;
    return c.json({ error: msg }, status);
  }
});

app.patch('/api/employee/requests/:id', async (c) => {
  try {
    const user = requireUser(c.req.header('authorization') ?? null);
    const reqId = c.req.param('id');
    const body = await c.req.json<{ action?: string }>().catch(() => ({}));
    if (body.action !== 'cancel') return c.json({ error: 'Unsupported action' }, 400);

    await cancelBenefitRequestSvc(c.env.DB, user.id, reqId);
    await invalidateEligibilityCache(c.env.EBMS_KV, user.id);

    const full = await getBenefitRequestDetails(c.env.DB, reqId);
    if (!full) return c.json({ error: 'REQUEST_NOT_FOUND' }, 404);

    return c.json({
      id: full.id,
      employee_id: full.employee_id,
      benefit_id: full.benefit_id,
      status: full.status.toUpperCase(),
      contractVersion: full.contract_version_accepted,
      contractAcceptedAt: full.contract_accepted_at,
      reviewedBy: full.reviewed_by,
      created_at: full.created_at,
      updated_at: full.updated_at,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status =
      msg === 'UNAUTHORIZED' ? 401 :
      msg === 'ONLY_PENDING_CAN_BE_CANCELLED' ? 409 :
      msg === 'FORBIDDEN' ? 403 :
      500;
    return c.json({ error: msg }, status);
  }
});

app.get('/api/employee/audit', async (c) => {
  try {
    const user = requireUser(c.req.header('authorization') ?? null);
    const rows = await listAuditEntriesDetailed(c.env.DB, { employeeId: user.id });
    const benefits = await listBenefits(c.env.DB);
    const benefitNameById = new Map(benefits.map((b) => [b.id, b.name]));

    function mapEventType(row: { event_type: string; new_status: string | null }) {
      if (row.event_type === 'eligibility_overridden') return 'HR_OVERRIDE';
      if (row.event_type === 'benefit_request_created') return 'REQUEST_SUBMITTED';
      if (row.event_type === 'benefit_request_cancelled') return 'REQUEST_CANCELLED';
      if (row.event_type === 'benefit_request_reviewed') {
        if (row.new_status === 'approved') return 'REQUEST_APPROVED';
        if (row.new_status === 'rejected') return 'REQUEST_REJECTED';
        return 'REQUEST_REVIEWED';
      }
      if (row.event_type === 'contract_downloaded') return 'CONTRACT_DOWNLOADED';
      if (row.event_type === 'benefit_request_confirmed') return 'REQUEST_CONFIRMED';
      return row.event_type.toUpperCase();
    }

    return c.json(rows.map((r) => {
      const meta = safeJsonParse<Record<string, unknown>>(r.metadata_json);
      const benefitName = r.benefit_id ? (benefitNameById.get(r.benefit_id) ?? r.benefit_id) : null;
      const detail = r.reason
        ?? (benefitName ? `${mapEventType(r as any)}: ${benefitName}` : mapEventType(r as any));
      return {
        id: r.id,
        type: mapEventType(r as any),
        detail,
        timestamp: r.created_at,
        benefitId: r.benefit_id,
        oldStatus: r.old_status ? r.old_status.toUpperCase() : null,
        newStatus: r.new_status ? r.new_status.toUpperCase() : null,
        actor: r.actor_role,
        triggeredBy: r.actor_id,
        ruleTrace: meta && Array.isArray((meta as any).ruleTrace) ? (meta as any).ruleTrace : null,
      };
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHORIZED' ? 401 : 500;
    return c.json({ error: msg }, status);
  }
});

app.post('/contracts/upload', async (c) => {
  const user = parseAuthHeader(c.req.header('authorization') ?? null);
  if (!user || user.role !== 'hr_admin') return c.text('Forbidden', 403);

  const form = await c.req.formData();
  const benefitId = String(form.get('benefitId') ?? '');
  const vendorName = String(form.get('vendorName') ?? '');
  const version = String(form.get('version') ?? '');
  const file = form.get('file');

  if (!benefitId || !vendorName || !version || !(file instanceof File)) {
    return c.json({ error: 'Missing required fields: benefitId, vendorName, version, file' }, 400);
  }

  const uploaded = await uploadContract(c.env.DB, c.env.CONTRACTS_BUCKET, {
    benefitId,
    vendorName,
    version,
    filename: file.name,
    body: await file.arrayBuffer(),
  });

  return c.json(uploaded);
});

app.get('/contracts/download', async (c) => {
  const contractId = c.req.query('contractId');
  const employeeId = c.req.query('employeeId');
  const exp = c.req.query('exp');
  const sig = c.req.query('sig');

  if (!contractId || !employeeId || !exp || !sig) {
    return c.text('Missing query params', 400);
  }

  const user = parseAuthHeader(c.req.header('authorization') ?? null);
  if (user && user.id !== employeeId && user.role === 'employee') {
    return c.text('Forbidden', 403);
  }

  return resolveContractDownload(
    c.env.DB,
    c.env.CONTRACTS_BUCKET,
    { contractId, employeeId, exp, sig },
    c.env.CONTRACT_SIGNING_SECRET,
  );
});

app.get('/healthz', (c) => c.json({ ok: true, service: 'ebms-worker' }));

app.post('/api/v1/okr-sync', async (c) => {
  const syncKey = c.req.header('x-ebms-sync-key');
  if (c.env.SYNC_API_KEY && syncKey !== c.env.SYNC_API_KEY) {
    return c.text('Unauthorized', 401);
  }

  const body = await c.req.json<{ employeeId?: string; okrSubmitted?: boolean }>();
  if (!body.employeeId || typeof body.okrSubmitted !== 'boolean') {
    return c.json({ error: 'employeeId and okrSubmitted(boolean) are required' }, 400);
  }

  await updateEmployeeSignals(c.env.DB, body.employeeId, { okrSubmitted: body.okrSubmitted });
  await invalidateEligibilityCache(c.env.EBMS_KV, body.employeeId);
  const benefits = await computeAndPersistEligibility(c.env.DB, body.employeeId);
  return c.json({ ok: true, employeeId: body.employeeId, recomputed: benefits.length });
});

app.post('/api/v1/attendance-sync', async (c) => {
  const syncKey = c.req.header('x-ebms-sync-key');
  if (c.env.SYNC_API_KEY && syncKey !== c.env.SYNC_API_KEY) {
    return c.text('Unauthorized', 401);
  }

  const body = await c.req.json<{ employeeId?: string; lateArrivalCount?: number }>();
  if (!body.employeeId || typeof body.lateArrivalCount !== 'number') {
    return c.json({ error: 'employeeId and lateArrivalCount(number) are required' }, 400);
  }

  await updateEmployeeSignals(c.env.DB, body.employeeId, { lateArrivalCount: body.lateArrivalCount });
  await invalidateEligibilityCache(c.env.EBMS_KV, body.employeeId);
  const benefits = await computeAndPersistEligibility(c.env.DB, body.employeeId);
  return c.json({ ok: true, employeeId: body.employeeId, recomputed: benefits.length });
});

export default app;
