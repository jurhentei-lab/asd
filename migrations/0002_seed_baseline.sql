ALTER TABLE benefits ADD COLUMN is_core INTEGER NOT NULL DEFAULT 0 CHECK (is_core IN (0, 1));

INSERT INTO employees (id, email, name, name_eng, role, department, responsibility_level, employment_status, hire_date, okr_submitted, late_arrival_count)
VALUES
  ('emp-001', 'employee@pinequest.mn', 'Demo Employee', 'Demo Employee', 'engineer', 'engineering', 1, 'active', '2025-01-01', 0, 1),
  ('hr-001', 'hr@pinequest.mn', 'HR Admin', 'HR Admin', 'hr_admin', 'hr', 3, 'active', '2020-01-01', 1, 0),
  ('finance-001', 'finance@pinequest.mn', 'Finance Manager', 'Finance Manager', 'finance_manager', 'finance', 3, 'active', '2020-01-01', 1, 0)
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  department = excluded.department,
  responsibility_level = excluded.responsibility_level,
  employment_status = excluded.employment_status,
  hire_date = excluded.hire_date,
  okr_submitted = excluded.okr_submitted,
  late_arrival_count = excluded.late_arrival_count,
  updated_at = datetime('now');

INSERT INTO benefits (id, name, category, subsidy_percent, vendor_name, requires_contract, is_active, is_core)
VALUES
  ('gym_pinefit', 'Gym - PineFit 50%', 'wellness', 50, 'PineFit', 1, 1, 0),
  ('private_insurance', 'Private Insurance 50%', 'wellness', 50, 'PineCare', 1, 1, 0),
  ('digital_wellness', 'Digital Wellness 100%', 'wellness', 100, NULL, 0, 1, 1),
  ('macbook', 'MacBook 50%', 'equipment', 50, 'Apple Reseller', 1, 1, 0),
  ('extra_responsibility', 'Extra Responsibility', 'career', 100, NULL, 0, 1, 0),
  ('ux_tools', 'UX Engineer Tools', 'career', 100, NULL, 0, 1, 0),
  ('down_payment', 'Down Payment Assistance', 'financial', 50, NULL, 0, 1, 0),
  ('shit_happened_days', 'Shit Happened Days', 'flexibility', 100, NULL, 0, 1, 1),
  ('remote_work', 'Remote Work', 'flexibility', 100, NULL, 0, 1, 0),
  ('travel', 'Travel 50%', 'flexibility', 50, 'Travel Partner', 1, 1, 0),
  ('bonus_okr', 'Bonus Based on OKR', 'financial', 100, NULL, 0, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  category = excluded.category,
  subsidy_percent = excluded.subsidy_percent,
  vendor_name = excluded.vendor_name,
  requires_contract = excluded.requires_contract,
  is_active = excluded.is_active,
  is_core = excluded.is_core,
  updated_at = datetime('now');

DELETE FROM eligibility_rules;

INSERT INTO eligibility_rules (id, benefit_id, rule_type, operator, value, error_message, priority, is_active)
VALUES
  ('r_gym_1', 'gym_pinefit', 'employment_status', 'eq', '"active"', 'Not available during probation or leave.', 10, 1),
  ('r_gym_2', 'gym_pinefit', 'okr_submitted', 'eq', 'true', 'Submit OKR to unlock this benefit.', 20, 1),
  ('r_gym_3', 'gym_pinefit', 'attendance', 'lt', '3', 'Attendance threshold exceeded this month.', 30, 1),

  ('r_ins_1', 'private_insurance', 'employment_status', 'eq', '"active"', 'Not available during probation or leave.', 10, 1),
  ('r_ins_2', 'private_insurance', 'okr_submitted', 'eq', 'true', 'Submit OKR to unlock this benefit.', 20, 1),
  ('r_ins_3', 'private_insurance', 'attendance', 'lt', '3', 'Attendance threshold exceeded this month.', 30, 1),

  ('r_dig_1', 'digital_wellness', 'employment_status', 'neq', '"terminated"', 'Not available after termination.', 10, 1),

  ('r_mac_1', 'macbook', 'tenure_days', 'gte', '180', 'Available after 6 months of employment.', 10, 1),
  ('r_mac_2', 'macbook', 'employment_status', 'eq', '"active"', 'Active employment required.', 20, 1),
  ('r_mac_3', 'macbook', 'okr_submitted', 'eq', 'true', 'Submit OKR to unlock this benefit.', 30, 1),
  ('r_mac_4', 'macbook', 'responsibility_level', 'gte', '1', 'Responsibility level requirement not met.', 40, 1),

  ('r_ext_1', 'extra_responsibility', 'employment_status', 'eq', '"active"', 'Not available during probation.', 10, 1),
  ('r_ext_2', 'extra_responsibility', 'okr_submitted', 'eq', 'true', 'OKR submission required.', 20, 1),
  ('r_ext_3', 'extra_responsibility', 'attendance', 'lt', '3', 'Attendance threshold exceeded.', 30, 1),
  ('r_ext_4', 'extra_responsibility', 'responsibility_level', 'gte', '2', 'Requires Senior level (2+).', 40, 1),

  ('r_ux_1', 'ux_tools', 'role', 'eq', '"ux_engineer"', 'Available to UX/Design role only.', 10, 1),
  ('r_ux_2', 'ux_tools', 'employment_status', 'eq', '"active"', 'Active employment required.', 20, 1),
  ('r_ux_3', 'ux_tools', 'okr_submitted', 'eq', 'true', 'OKR submission required.', 30, 1),

  ('r_down_1', 'down_payment', 'tenure_days', 'gte', '730', 'Available after 2 years of employment.', 10, 1),
  ('r_down_2', 'down_payment', 'employment_status', 'eq', '"active"', 'Active employment required.', 20, 1),
  ('r_down_3', 'down_payment', 'responsibility_level', 'gte', '2', 'Requires Senior level (2+).', 30, 1),
  ('r_down_4', 'down_payment', 'okr_submitted', 'eq', 'true', 'OKR submission required.', 40, 1),

  ('r_shd_1', 'shit_happened_days', 'employment_status', 'in', '["active", "probation", "leave"]', 'Not available after termination.', 10, 1),

  ('r_rem_1', 'remote_work', 'employment_status', 'eq', '"active"', 'Not available during probation.', 10, 1),
  ('r_rem_2', 'remote_work', 'okr_submitted', 'eq', 'true', 'OKR submission required.', 20, 1),
  ('r_rem_3', 'remote_work', 'attendance', 'lt', '3', 'Attendance threshold exceeded.', 30, 1),

  ('r_trav_1', 'travel', 'tenure_days', 'gte', '365', 'Available after 12 months of employment.', 10, 1),
  ('r_trav_2', 'travel', 'responsibility_level', 'gte', '1', 'Responsibility level requirement not met.', 20, 1),
  ('r_trav_3', 'travel', 'okr_submitted', 'eq', 'true', 'OKR submission required.', 30, 1),

  ('r_bonus_1', 'bonus_okr', 'okr_submitted', 'eq', 'true', 'OKR not submitted or score below threshold.', 10, 1),
  ('r_bonus_2', 'bonus_okr', 'attendance', 'lt', '3', 'Attendance threshold exceeded.', 20, 1),
  ('r_bonus_3', 'bonus_okr', 'employment_status', 'eq', '"active"', 'Active employment required.', 30, 1);
