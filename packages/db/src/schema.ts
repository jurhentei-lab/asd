import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  nameEng: text('name_eng'),
  role: text('role').notNull(),
  department: text('department'),
  responsibilityLevel: integer('responsibility_level').notNull(),
  employmentStatus: text('employment_status').notNull(),
  hireDate: text('hire_date').notNull(),
  okrSubmitted: integer('okr_submitted', { mode: 'boolean' }).notNull().default(false),
  lateArrivalCount: integer('late_arrival_count').notNull().default(0),
  lateArrivalUpdatedAt: text('late_arrival_updated_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  emailUnique: uniqueIndex('employees_email_unique').on(table.email),
}));

export const benefits = sqliteTable('benefits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subsidyPercent: integer('subsidy_percent').notNull(),
  vendorName: text('vendor_name'),
  requiresContract: integer('requires_contract', { mode: 'boolean' }).notNull().default(false),
  isCore: integer('is_core', { mode: 'boolean' }).notNull().default(false),
  activeContractId: text('active_contract_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const eligibilityRules = sqliteTable('eligibility_rules', {
  id: text('id').primaryKey(),
  benefitId: text('benefit_id').notNull().references(() => benefits.id),
  ruleType: text('rule_type').notNull(),
  operator: text('operator').notNull(),
  value: text('value').notNull(),
  errorMessage: text('error_message'),
  priority: integer('priority').notNull().default(100),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  benefitPriorityIdx: index('idx_rules_benefit_priority').on(table.benefitId, table.priority),
}));

export const benefitEligibility = sqliteTable('benefit_eligibility', {
  employeeId: text('employee_id').notNull().references(() => employees.id),
  benefitId: text('benefit_id').notNull().references(() => benefits.id),
  status: text('status').notNull(),
  ruleEvaluationJson: text('rule_evaluation_json').notNull(),
  computedAt: text('computed_at').notNull(),
  overrideBy: text('override_by').references(() => employees.id),
  overrideReason: text('override_reason'),
  overrideExpiresAt: text('override_expires_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.employeeId, table.benefitId] }),
  employeeIdx: index('idx_eligibility_employee').on(table.employeeId),
}));

export const benefitRequests = sqliteTable('benefit_requests', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  benefitId: text('benefit_id').notNull().references(() => benefits.id),
  status: text('status').notNull(),
  contractVersionAccepted: text('contract_version_accepted'),
  contractAcceptedAt: text('contract_accepted_at'),
  reviewedBy: text('reviewed_by').references(() => employees.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  employeeStatusIdx: index('idx_requests_employee_status').on(table.employeeId, table.status),
}));

export const contracts = sqliteTable('contracts', {
  id: text('id').primaryKey(),
  benefitId: text('benefit_id').notNull().references(() => benefits.id),
  vendorName: text('vendor_name').notNull(),
  version: text('version').notNull(),
  r2ObjectKey: text('r2_object_key').notNull(),
  sha256Hash: text('sha256_hash').notNull(),
  effectiveDate: text('effective_date').notNull(),
  expiryDate: text('expiry_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  benefitVersionUnique: uniqueIndex('contracts_benefit_version_unique').on(table.benefitId, table.version),
  benefitActiveIdx: index('idx_contracts_benefit_active').on(table.benefitId, table.isActive),
}));

export const contractAcceptances = sqliteTable('contract_acceptances', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  benefitId: text('benefit_id').notNull().references(() => benefits.id),
  contractId: text('contract_id').notNull().references(() => contracts.id),
  contractVersionHash: text('contract_version_hash').notNull(),
  acceptedAt: text('accepted_at').notNull(),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  employeeIdx: index('idx_acceptances_employee').on(table.employeeId),
}));

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  actorRole: text('actor_role').notNull(),
  eventType: text('event_type').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  benefitId: text('benefit_id').references(() => benefits.id),
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  reason: text('reason'),
  metadataJson: text('metadata_json'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  employeeCreatedIdx: index('idx_audit_employee_created').on(table.employeeId, table.createdAt),
  eventCreatedIdx: index('idx_audit_event_created').on(table.eventType, table.createdAt),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  eligibilities: many(benefitEligibility),
  requests: many(benefitRequests),
  acceptances: many(contractAcceptances),
  auditEntries: many(auditLog),
}));

export const benefitsRelations = relations(benefits, ({ many, one }) => ({
  rules: many(eligibilityRules),
  eligibilities: many(benefitEligibility),
  requests: many(benefitRequests),
  contracts: many(contracts),
  activeContract: one(contracts, {
    fields: [benefits.activeContractId],
    references: [contracts.id],
  }),
}));
