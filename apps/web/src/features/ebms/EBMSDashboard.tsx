import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';
import { globalStyles } from './styles';
import { useApi } from './useApi';
import type { AuditEntry, Benefit, BenefitRequest, Employee } from './types';
import { ErrorBanner } from './ui';
import { NavBar } from './components/NavBar';
import { ProfileBanner } from './components/ProfileBanner';
import { DashboardTab } from './components/DashboardTab';
import { RequestsTab } from './components/RequestsTab';
import { AuditTab } from './components/AuditTab';
import { ContractModal } from './components/ContractModal';
import { CancelConfirmModal } from './components/CancelConfirmModal';

export default function EBMSDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'audit'>('dashboard');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [showContract, setShowContract] = useState<Benefit | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [tabKey, setTabKey] = useState(0);

  const employee = useApi<Employee>('/api/employee');
  const benefits = useApi<Benefit[]>('/api/employee/benefits');
  const requests = useApi<BenefitRequest[]>('/api/employee/requests');
  const audit = useApi<AuditEntry[]>('/api/employee/audit');

  const [localRequests, setLocalRequests] = useState<BenefitRequest[] | null>(null);
  const displayRequests = localRequests ?? requests.data ?? [];

  useEffect(() => {
    if (requests.data) setLocalRequests(requests.data);
  }, [requests.data]);

  function switchTab(id: 'dashboard' | 'requests' | 'audit') {
    setActiveTab(id);
    setTabKey((k) => k + 1);
  }

  const benefitMap = useMemo(() => {
    const map: Record<string, Benefit> = {};
    (benefits.data ?? []).forEach((b) => {
      map[b.slug ?? b.id] = b;
      map[b.id] = b;
    });
    return map;
  }, [benefits.data]);

  const pendingBenefitIds = useMemo(() => {
    return new Set(
      displayRequests
        .filter((r) => r.status === 'PENDING')
        .map((r) => String(r.benefitId ?? r.benefit_id ?? '')),
    );
  }, [displayRequests]);

  async function submitRequest(benefit: Benefit, contractAccepted = false) {
    try {
      const newReq = await apiFetch<BenefitRequest>('/api/employee/requests', {
        method: 'POST',
        body: JSON.stringify({ benefitId: benefit.id, contractAccepted }),
      });
      setLocalRequests((prev) => [newReq, ...(prev ?? [])]);
      setShowContract(null);
      void benefits.refetch();
      void audit.refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Хүсэлт илгээхэд алдаа: ${msg}`);
    }
  }

  async function cancelRequest(reqId: string) {
    try {
      await apiFetch(`/api/employee/requests/${reqId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' }),
      });
      setLocalRequests((prev) =>
        (prev ?? []).map((r) =>
          r.id === reqId ? { ...r, status: 'CANCELLED', updated_at: new Date().toISOString() } : r,
        ),
      );
      setCancelConfirm(null);
      void benefits.refetch();
      void audit.refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Цуцлахад алдаа: ${msg}`);
    }
  }

  const counts = useMemo(() => {
    const all = benefits.data ?? [];
    return {
      ACTIVE: all.filter((b) => b.status === 'ACTIVE').length,
      ELIGIBLE: all.filter((b) => b.status === 'ELIGIBLE').length,
      PENDING: all.filter((b) => b.status === 'PENDING').length,
      LOCKED: all.filter((b) => b.status === 'LOCKED').length,
    };
  }, [benefits.data]);

  const pendingCount = useMemo(() => displayRequests.filter((r) => r.status === 'PENDING').length, [displayRequests]);

  const filteredAudit = useMemo(() => {
    const all = audit.data ?? [];
    return all.filter((a) => {
      if (auditFilter !== 'ALL' && a.type !== auditFilter) return false;
      const q = auditSearch.toLowerCase().trim();
      if (!q) return true;
      const benefitName = (benefitMap[String(a.benefitId ?? a.benefit_id ?? '')]?.name ?? '').toLowerCase();
      return (
        (a.detail ?? '').toLowerCase().includes(q) ||
        benefitName.includes(q) ||
        (a.actor ?? '').toLowerCase().includes(q)
      );
    });
  }, [audit.data, auditFilter, auditSearch, benefitMap]);

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: '#F1F4F9', minHeight: '100vh', color: '#0F172A' }}>
      <style>{globalStyles}</style>

      <NavBar
        activeTab={activeTab}
        onSwitchTab={switchTab}
        pendingCount={pendingCount}
        employeeLoading={employee.loading}
        emp={employee.data}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        <ProfileBanner
          employeeLoading={employee.loading}
          employeeError={employee.error}
          onRetry={employee.refetch}
          emp={employee.data}
        />

        {activeTab === 'dashboard' && (
          <DashboardTab
            benefits={benefits.data ?? []}
            loading={benefits.loading}
            error={benefits.error}
            onRetry={benefits.refetch}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            selectedBenefit={selectedBenefit}
            setSelectedBenefit={setSelectedBenefit}
            pendingBenefitIds={pendingBenefitIds}
            onRequest={submitRequest}
            onOpenContract={(b) => setShowContract(b)}
            counts={counts}
            tabKey={tabKey}
          />
        )}

        {activeTab === 'requests' && (
          <RequestsTab
            requests={displayRequests}
            loading={requests.loading}
            error={requests.error}
            onRetry={requests.refetch}
            benefitMap={benefitMap}
            onCancel={(id) => setCancelConfirm(id)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTab
            auditLog={filteredAudit}
            allLog={audit.data ?? []}
            loading={audit.loading}
            error={audit.error}
            onRetry={audit.refetch}
            benefitMap={benefitMap}
            auditFilter={auditFilter}
            setAuditFilter={setAuditFilter}
            auditSearch={auditSearch}
            setAuditSearch={setAuditSearch}
            expandedAudit={expandedAudit}
            setExpandedAudit={setExpandedAudit}
          />
        )}

        {(benefits.error || requests.error || audit.error) && activeTab === 'dashboard' && (
          <ErrorBanner message={benefits.error ?? requests.error ?? audit.error ?? 'Unknown error'} />
        )}
      </div>

      {showContract && (
        <ContractModal
          benefit={showContract}
          onCancel={() => setShowContract(null)}
          onAcceptAndSubmit={() => submitRequest(showContract, true)}
        />
      )}

      {cancelConfirm && (
        <CancelConfirmModal
          onClose={() => setCancelConfirm(null)}
          onConfirm={() => cancelRequest(cancelConfirm)}
        />
      )}
    </div>
  );
}

