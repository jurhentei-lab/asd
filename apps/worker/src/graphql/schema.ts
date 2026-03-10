import { createSchema } from 'graphql-yoga';
import { requireRole } from '../auth';
import {
  buildContractSignedUrl,
  cancelBenefitRequest,
  computeAndPersistEligibility,
  confirmBenefitRequest,
  createBenefitRequest,
  getEmployeeSnapshot,
  getMyBenefitsCached,
  invalidateEligibilityCache,
  listAuditEntries,
  listBenefits,
  overrideEligibility,
  reviewBenefitRequest,
  uploadContract,
} from '../services/ebms';

type AppContext = {
  user: {
    id: string;
    email: string;
    role: 'employee' | 'hr_admin' | 'finance_manager';
  } | null;
  env: {
    DB: D1Database;
    EBMS_KV: KVNamespace;
    CONTRACTS_BUCKET: R2Bucket;
    CONTRACT_SIGNING_SECRET?: string;
  };
  request: Request;
};

function getBaseUrl(request: Request): string {
  return new URL(request.url).origin;
}

const typeDefs = /* GraphQL */ `
  enum BenefitStatus { ACTIVE ELIGIBLE LOCKED PENDING }
  enum RequestStatus { PENDING APPROVED REJECTED CANCELLED }
  enum EmploymentStatus { ACTIVE PROBATION LEAVE TERMINATED }

  type Employee {
    id: ID!
    name: String!
    role: String!
    responsibilityLevel: Int!
    employmentStatus: EmploymentStatus!
    okrSubmitted: Boolean!
    lateArrivalCount: Int!
    benefits: [BenefitEligibility!]!
  }

  type BenefitEligibility {
    benefit: Benefit!
    status: BenefitStatus!
    ruleEvaluations: [RuleEvaluation!]!
    computedAt: String!
  }

  type RuleEvaluation {
    ruleType: String!
    passed: Boolean!
    reason: String!
  }

  type Benefit {
    id: ID!
    name: String!
    category: String!
    subsidyPercent: Int!
    requiresContract: Boolean!
    activeContract: Contract
  }

  type Contract {
    id: ID!
    version: String!
    vendorName: String!
    expiryDate: String!
    signedUrl: String
  }

  type AuditEntry {
    id: ID!
    eventType: String!
    actorRole: String!
    reason: String
    createdAt: String!
  }

  type BenefitRequest {
    id: ID!
    employeeId: ID!
    benefitId: ID!
    status: RequestStatus!
    createdAt: String!
  }

  input AuditFilters {
    employeeId: ID
    benefitId: ID
    dateFrom: String
    dateTo: String
  }

  input BenefitRequestInput {
    benefitId: ID!
  }

  input OverrideInput {
    employeeId: ID!
    benefitId: ID!
    status: BenefitStatus!
    reason: String!
    expiresAt: String
  }

  input ContractInput {
    benefitId: ID!
    vendorName: String!
    version: String!
    filename: String!
  }

  input ReviewInput {
    requestId: ID!
    status: RequestStatus!
    reason: String
  }

  type Query {
    me: Employee!
    myBenefits: [BenefitEligibility!]!
    benefits(category: String): [Benefit!]!
    employee(id: ID!): Employee
    auditLog(filters: AuditFilters!): [AuditEntry!]!
  }

  type Mutation {
    requestBenefit(input: BenefitRequestInput!): BenefitRequest!
    confirmBenefitRequest(requestId: ID!, contractAccepted: Boolean!): BenefitRequest!
    cancelBenefitRequest(requestId: ID!): BenefitRequest!
    overrideEligibility(input: OverrideInput!): BenefitEligibility!
    uploadContract(input: ContractInput!): Contract!
    reviewBenefitRequest(input: ReviewInput!): BenefitRequest!
  }
`;

const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: AppContext) => {
      requireRole(ctx.user, ['employee', 'hr_admin', 'finance_manager']);
      const snapshot = await getEmployeeSnapshot(ctx.env.DB, ctx.user!.id, {
        useCache: true,
        kv: ctx.env.EBMS_KV,
        baseUrl: getBaseUrl(ctx.request),
        signingSecret: ctx.env.CONTRACT_SIGNING_SECRET,
      });
      if (!snapshot) throw new Error('EMPLOYEE_NOT_FOUND');
      return snapshot;
    },
    myBenefits: async (_: unknown, __: unknown, ctx: AppContext) => {
      requireRole(ctx.user, ['employee', 'hr_admin', 'finance_manager']);
      return getMyBenefitsCached(ctx.env.DB, ctx.env.EBMS_KV, ctx.user!.id, {
        baseUrl: getBaseUrl(ctx.request),
        signingSecret: ctx.env.CONTRACT_SIGNING_SECRET,
      });
    },
    benefits: async (_: unknown, args: { category?: string | null }, ctx: AppContext) => {
      const rows = await listBenefits(ctx.env.DB, args.category ?? null);
      const baseUrl = getBaseUrl(ctx.request);
      return Promise.all(rows.map(async (row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        subsidyPercent: row.subsidy_percent,
        requiresContract: Boolean(row.requires_contract),
        activeContract: row.contract_id ? {
          id: row.contract_id,
          version: row.contract_version,
          vendorName: row.contract_vendor_name,
          expiryDate: row.contract_expiry_date,
          signedUrl: ctx.user && ctx.env.CONTRACT_SIGNING_SECRET
            ? await buildContractSignedUrl(baseUrl, row.contract_id, ctx.user.id, ctx.env.CONTRACT_SIGNING_SECRET)
            : null,
        } : null,
      })));
    },
    employee: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      requireRole(ctx.user, ['hr_admin']);
      return getEmployeeSnapshot(ctx.env.DB, args.id, {
        useCache: false,
        baseUrl: getBaseUrl(ctx.request),
        signingSecret: ctx.env.CONTRACT_SIGNING_SECRET,
      });
    },
    auditLog: async (_: unknown, args: { filters: { employeeId?: string; benefitId?: string; dateFrom?: string; dateTo?: string } }, ctx: AppContext) => {
      requireRole(ctx.user, ['hr_admin']);
      const rows = await listAuditEntries(ctx.env.DB, args.filters);
      return rows.map((r) => ({
        id: r.id,
        eventType: r.event_type,
        actorRole: r.actor_role,
        reason: r.reason,
        createdAt: r.created_at,
      }));
    },
  },
  Mutation: {
    requestBenefit: async (_: unknown, args: { input: { benefitId: string } }, ctx: AppContext) => {
      requireRole(ctx.user, ['employee']);
      const req = await createBenefitRequest(ctx.env.DB, ctx.user!.id, args.input.benefitId);
      await invalidateEligibilityCache(ctx.env.EBMS_KV, ctx.user!.id);
      if (!req) throw new Error('REQUEST_CREATE_FAILED');
      return {
        id: req.id,
        employeeId: req.employee_id,
        benefitId: req.benefit_id,
        status: req.status.toUpperCase(),
        createdAt: req.created_at,
      };
    },
    confirmBenefitRequest: async (_: unknown, args: { requestId: string; contractAccepted: boolean }, ctx: AppContext) => {
      requireRole(ctx.user, ['employee']);
      const ipAddress = ctx.request.headers.get('cf-connecting-ip') ?? null;
      const req = await confirmBenefitRequest(ctx.env.DB, ctx.user!.id, args.requestId, args.contractAccepted, ipAddress);
      await invalidateEligibilityCache(ctx.env.EBMS_KV, ctx.user!.id);
      if (!req) throw new Error('REQUEST_CONFIRM_FAILED');
      return {
        id: req.id,
        employeeId: req.employee_id,
        benefitId: req.benefit_id,
        status: req.status.toUpperCase(),
        createdAt: req.created_at,
      };
    },
    cancelBenefitRequest: async (_: unknown, args: { requestId: string }, ctx: AppContext) => {
      requireRole(ctx.user, ['employee']);
      const req = await cancelBenefitRequest(ctx.env.DB, ctx.user!.id, args.requestId);
      await invalidateEligibilityCache(ctx.env.EBMS_KV, ctx.user!.id);
      if (!req) throw new Error('REQUEST_CANCEL_FAILED');
      return {
        id: req.id,
        employeeId: req.employee_id,
        benefitId: req.benefit_id,
        status: req.status.toUpperCase(),
        createdAt: req.created_at,
      };
    },
    overrideEligibility: async (
      _: unknown,
      args: { input: { employeeId: string; benefitId: string; status: 'ACTIVE' | 'ELIGIBLE' | 'LOCKED' | 'PENDING'; reason: string; expiresAt?: string | null } },
      ctx: AppContext,
    ) => {
      requireRole(ctx.user, ['hr_admin']);
      await overrideEligibility(ctx.env.DB, ctx.user!.id, args.input);
      await invalidateEligibilityCache(ctx.env.EBMS_KV, args.input.employeeId);
      const all = await computeAndPersistEligibility(ctx.env.DB, args.input.employeeId, {
        baseUrl: getBaseUrl(ctx.request),
        signingSecret: ctx.env.CONTRACT_SIGNING_SECRET,
      });
      const item = all.find((entry) => entry.benefit.id === args.input.benefitId);
      if (!item) throw new Error('BENEFIT_NOT_FOUND');
      return item;
    },
    uploadContract: async (_: unknown, args: { input: { benefitId: string; vendorName: string; version: string; filename: string } }, ctx: AppContext) => {
      requireRole(ctx.user, ['hr_admin']);
      const contract = await uploadContract(ctx.env.DB, ctx.env.CONTRACTS_BUCKET, args.input);
      if (!contract) throw new Error('CONTRACT_UPLOAD_FAILED');
      return {
        id: contract.id,
        version: contract.version,
        vendorName: contract.vendor_name,
        expiryDate: contract.expiry_date,
        signedUrl: null,
      };
    },
    reviewBenefitRequest: async (
      _: unknown,
      args: { input: { requestId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; reason?: string | null } },
      ctx: AppContext,
    ) => {
      requireRole(ctx.user, ['hr_admin', 'finance_manager']);
      const req = await reviewBenefitRequest(ctx.env.DB, ctx.user!.id, ctx.user!.role, args.input);
      if (!req) throw new Error('REQUEST_REVIEW_FAILED');
      await invalidateEligibilityCache(ctx.env.EBMS_KV, req.employee_id);
      return {
        id: req.id,
        employeeId: req.employee_id,
        benefitId: req.benefit_id,
        status: req.status.toUpperCase(),
        createdAt: req.created_at,
      };
    },
  },
};

export const ebmsSchema = createSchema({
  typeDefs,
  resolvers,
});
