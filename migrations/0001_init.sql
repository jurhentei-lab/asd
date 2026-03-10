PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_eng TEXT,
  role TEXT NOT NULL,
  department TEXT,
  responsibility_level INTEGER NOT NULL CHECK (responsibility_level BETWEEN 1 AND 3),
  employment_status TEXT NOT NULL CHECK (employment_status IN ('active', 'probation', 'leave', 'terminated')),
  hire_date TEXT NOT NULL,
  okr_submitted INTEGER NOT NULL DEFAULT 0 CHECK (okr_submitted IN (0, 1)),
  late_arrival_count INTEGER NOT NULL DEFAULT 0,
  late_arrival_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS benefits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subsidy_percent INTEGER NOT NULL CHECK (subsidy_percent BETWEEN 0 AND 100),
  vendor_name TEXT,
  requires_contract INTEGER NOT NULL DEFAULT 0 CHECK (requires_contract IN (0, 1)),
  active_contract_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (active_contract_id) REFERENCES contracts(id)
);

CREATE TABLE IF NOT EXISTS eligibility_rules (
  id TEXT PRIMARY KEY,
  benefit_id TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  operator TEXT NOT NULL,
  value TEXT NOT NULL,
  error_message TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id)
);

CREATE TABLE IF NOT EXISTS benefit_eligibility (
  employee_id TEXT NOT NULL,
  benefit_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'eligible', 'locked', 'pending')),
  rule_evaluation_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  override_by TEXT,
  override_reason TEXT,
  override_expires_at TEXT,
  PRIMARY KEY (employee_id, benefit_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id),
  FOREIGN KEY (override_by) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS benefit_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  benefit_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  contract_version_accepted TEXT,
  contract_accepted_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id),
  FOREIGN KEY (reviewed_by) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  benefit_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  version TEXT NOT NULL,
  r2_object_key TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id),
  UNIQUE (benefit_id, version)
);

CREATE TABLE IF NOT EXISTS contract_acceptances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  benefit_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  contract_version_hash TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  employee_id TEXT,
  benefit_id TEXT,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id)
);

CREATE INDEX IF NOT EXISTS idx_rules_benefit_priority ON eligibility_rules(benefit_id, priority);
CREATE INDEX IF NOT EXISTS idx_eligibility_employee ON benefit_eligibility(employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_employee_status ON benefit_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_benefit_active ON contracts(benefit_id, is_active);
CREATE INDEX IF NOT EXISTS idx_acceptances_employee ON contract_acceptances(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_employee_created ON audit_log(employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_event_created ON audit_log(event_type, created_at);
