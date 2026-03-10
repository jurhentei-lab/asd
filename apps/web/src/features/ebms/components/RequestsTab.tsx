import { useState } from 'react';
import type { Benefit, BenefitRequest } from '../types';
import { fmt, fmtDate } from '../utils';
import { DetailCell, ErrorBanner, Skeleton, StatusBadge, AnimNum } from '../ui';
import { STATUS_CONFIG } from '../config';

export function RequestsTab({
  requests,
  loading,
  error,
  onRetry,
  benefitMap,
  onCancel,
}: {
  requests: BenefitRequest[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  benefitMap: Record<string, Benefit>;
  onCancel: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);
  const summary = (['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).reduce(
    (acc, s) => {
      acc[s] = requests.filter((r) => r.status === s).length;
      return acc;
    },
    {} as Record<'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED', number>,
  );

  return (
    <div style={{ animation: 'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>My Benefit Requests</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>Track all submitted benefit requests, review contract acceptance records, and manage pending submissions.</div>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { key: 'total', label: 'Total Requests', val: requests.length, color: '#0F172A', dot: '#94A3B8' },
          { key: 'PENDING', label: 'Pending', val: summary.PENDING, color: '#d97706', dot: '#f59e0b' },
          { key: 'APPROVED', label: 'Approved', val: summary.APPROVED, color: '#16a34a', dot: '#22c55e' },
          { key: 'REJECTED', label: 'Rejected', val: summary.REJECTED, color: '#dc2626', dot: '#ef4444' },
          { key: 'CANCELLED', label: 'Cancelled', val: summary.CANCELLED, color: '#9ca3af', dot: '#d1d5db' },
        ].map((s, i) => (
          <div key={s.key} className="stat-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', animation: `fadeIn 0.4s ease ${i * 0.06}s both` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.04em' }}>{loading ? <Skeleton w={28} h={24} /> : <AnimNum value={s.val} />}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, marginTop: 6 }} />
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="filter-pill"
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: filter === f ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
              background: filter === f ? '#EFF6FF' : '#fff',
              color: filter === f ? '#2563EB' : '#64748B',
              fontWeight: filter === f ? 600 : 400,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12, animation: `fadeIn 0.35s ease ${i * 0.07}s both` }}>
              <Skeleton w={38} h={38} style={{ borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton w="40%" h={14} style={{ marginBottom: 6 }} />
                <Skeleton w="60%" h={11} />
              </div>
              <Skeleton w={70} h={22} style={{ borderRadius: 20 }} />
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, animation: 'scaleIn 0.3s ease both' }}>No requests match this filter.</div>
        )}

        {!loading &&
          filtered.map((req, i) => {
            const benefit = benefitMap[req.benefitId ?? req.benefit_id ?? ''];
            const cfg = STATUS_CONFIG[req.status] ?? { color: '#64748B' };
            const isExpanded = expanded === req.id;
            const createdAt = req.createdAt ?? req.created_at ?? '';
            const updatedAt = req.updatedAt ?? req.updated_at ?? createdAt;
            const reviewedBy = req.reviewedBy ?? req.reviewed_by;
            return (
              <div key={req.id} className="request-row" style={{ background: '#fff', border: `1px solid ${isExpanded ? '#93C5FD' : '#E2E8F0'}`, borderRadius: 12, overflow: 'hidden', boxShadow: isExpanded ? '0 0 0 3px #DBEAFE' : 'none', animation: `fadeIn 0.35s ease ${i * 0.05}s both` }}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : req.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                    >
                      {benefit?.icon ?? '📋'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{benefit?.name ?? req.benefitId ?? req.benefit_id}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                        {benefit?.category ?? '—'} · {benefit?.vendor ?? '—'} · {req.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Submitted</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{createdAt ? fmtDate(createdAt) : '—'}</div>
                    </div>
                    <StatusBadge status={req.status} />
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="expanded-content" style={{ borderTop: '1px solid #F1F5F9', padding: '16px 20px 20px', background: '#FAFBFC' }}>
                    <div style={{ display: 'flex', gap: 0, marginBottom: 20, overflow: 'hidden', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      {[
                        { step: 'Submitted', done: true, date: createdAt ? fmtDate(createdAt) : null },
                        { step: 'Under Review', done: req.status !== 'PENDING', date: req.status !== 'PENDING' && updatedAt ? fmtDate(updatedAt) : null },
                        {
                          step: req.status === 'REJECTED' ? 'Rejected' : req.status === 'CANCELLED' ? 'Cancelled' : 'Approved',
                          done: ['APPROVED', 'REJECTED', 'CANCELLED'].includes(req.status),
                          date: ['APPROVED', 'REJECTED', 'CANCELLED'].includes(req.status) && updatedAt ? fmtDate(updatedAt) : null,
                        },
                      ].map((s, idx) => (
                        <div key={idx} style={{ flex: 1, padding: '10px 14px', background: s.done ? '#F0FDF4' : '#F8FAFC', borderRight: idx < 2 ? '1px solid #E2E8F0' : 'none', textAlign: 'center', animation: `fadeIn 0.3s ease ${idx * 0.08}s both` }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: s.done ? '#16a34a' : '#94A3B8' }}>
                            {s.done ? '✓ ' : ''}
                            {s.step}
                          </div>
                          {s.date && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{s.date}</div>}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
                      {[
                        { label: 'Request ID', value: req.id },
                        { label: 'Status', value: req.status, colored: cfg.color },
                        { label: 'Subsidy', value: benefit?.subsidy ?? '—' },
                        { label: 'Submitted', value: createdAt ? fmt(createdAt) : '—' },
                        { label: 'Last Updated', value: updatedAt ? fmt(updatedAt) : '—' },
                        { label: 'Reviewed By', value: reviewedBy ?? 'Awaiting review', muted: !reviewedBy },
                      ].map((cell, idx) => (
                        <div key={idx} style={{ animation: `fadeIn 0.3s ease ${idx * 0.05}s both` }}>
                          <DetailCell label={cell.label} value={String(cell.value)} colored={(cell as any).colored} muted={(cell as any).muted} />
                        </div>
                      ))}
                    </div>

                    {req.contractVersion && (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 14px', marginBottom: 14, animation: 'fadeIn 0.3s both' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contract Acceptance Record</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <DetailCell label="Contract Version" value={`v${req.contractVersion}`} />
                          <DetailCell label="Accepted At" value={req.contractAcceptedAt ? fmt(req.contractAcceptedAt) : '—'} />
                        </div>
                        <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 8 }}>Logged with employee ID, IP address, and SHA-256 contract hash (when available).</div>
                      </div>
                    )}

                    {req.status === 'REJECTED' && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginTop: 10, animation: 'scaleIn 0.25s both' }}>
                        <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>This request was rejected. You may contact HR to appeal or re-submit after the restriction is resolved.</div>
                      </div>
                    )}

                    {req.status === 'PENDING' && (
                      <button className="cancel-btn" onClick={() => onCancel(req.id)} style={{ padding: '8px 18px', border: '1.5px solid #FCA5A5', borderRadius: 8, background: '#fff', color: '#DC2626', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

