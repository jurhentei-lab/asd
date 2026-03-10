import type { AuditEntry, Benefit } from '../types';
import { AUDIT_TYPE_CONFIG } from '../config';
import { fmt, fmtDate } from '../utils';
import { DetailCell, ErrorBanner, Skeleton, StatusBadge, AnimNum } from '../ui';

export function AuditTab({
  auditLog,
  allLog,
  loading,
  error,
  onRetry,
  benefitMap,
  auditFilter,
  setAuditFilter,
  auditSearch,
  setAuditSearch,
  expandedAudit,
  setExpandedAudit,
}: {
  auditLog: AuditEntry[];
  allLog: AuditEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  benefitMap: Record<string, Benefit>;
  auditFilter: string;
  setAuditFilter: (v: string) => void;
  auditSearch: string;
  setAuditSearch: (v: string) => void;
  expandedAudit: string | null;
  setExpandedAudit: (v: string | null) => void;
}) {
  const typeCounts: Record<string, number> = {};
  allLog.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  return (
    <div style={{ animation: 'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Eligibility Audit Log</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>Immutable record of key eligibility and request lifecycle events.</div>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {Object.entries(AUDIT_TYPE_CONFIG).map(([type, cfg], i) => (
          <div
            key={type}
            className="audit-type-card"
            onClick={() => setAuditFilter(auditFilter === type ? 'ALL' : type)}
            style={{
              background: '#fff',
              border: `1px solid ${auditFilter === type ? cfg.color + '66' : '#E2E8F0'}`,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: auditFilter === type ? `0 0 0 2px ${cfg.color}33` : 'none',
              animation: `fadeIn 0.4s ease ${i * 0.05}s both`,
            }}
          >
            <div
              style={{ fontSize: 22, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3) rotate(-8deg)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              {cfg.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color, letterSpacing: '-0.03em' }}>{loading ? <Skeleton w={24} h={20} /> : <AnimNum value={typeCounts[type] || 0} />}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{cfg.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 0 260px' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 }}>🔍</span>
          <input
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder="Search benefit, actor, event…"
            style={{
              width: '100%',
              padding: '8px 10px 8px 30px',
              border: '1.5px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 13,
              color: '#374151',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#93C5FD';
              e.currentTarget.style.boxShadow = '0 0 0 3px #DBEAFE';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="filter-pill"
            onClick={() => setAuditFilter('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: auditFilter === 'ALL' ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
              background: auditFilter === 'ALL' ? '#EFF6FF' : '#fff',
              color: auditFilter === 'ALL' ? '#2563EB' : '#64748B',
              fontSize: 12,
              fontWeight: auditFilter === 'ALL' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            All Events
          </button>
          {Object.entries(AUDIT_TYPE_CONFIG).map(([type, cfg]) => (
            <button
              key={type}
              className="filter-pill"
              onClick={() => setAuditFilter(auditFilter === type ? 'ALL' : type)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: auditFilter === type ? `1.5px solid ${cfg.color}` : '1.5px solid #E2E8F0',
                background: auditFilter === type ? cfg.bg : '#fff',
                color: auditFilter === type ? cfg.color : '#64748B',
                fontSize: 12,
                fontWeight: auditFilter === type ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>{auditLog.length} record{auditLog.length !== 1 ? 's' : ''}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, animation: `fadeIn 0.35s ease ${i * 0.07}s both` }}>
              <Skeleton w={34} h={34} style={{ borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton w="35%" h={13} style={{ marginBottom: 6 }} />
                <Skeleton w="55%" h={11} />
              </div>
              <Skeleton w={80} h={11} />
            </div>
          ))}

        {!loading && auditLog.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, animation: 'scaleIn 0.3s ease both' }}>
            No audit records match your search.
          </div>
        )}

        {!loading &&
          auditLog.map((entry, i) => {
            const benefit = benefitMap[String(entry.benefitId ?? entry.benefit_id ?? '')];
            const typeCfg = AUDIT_TYPE_CONFIG[entry.type] ?? { label: entry.type, color: '#64748B', bg: '#F8FAFC', icon: '📋' };
            const isExpanded = expandedAudit === entry.id;
            return (
              <div key={entry.id} className="audit-row" style={{ background: '#fff', border: `1px solid ${isExpanded ? '#93C5FD' : '#E2E8F0'}`, borderRadius: 12, overflow: 'hidden', boxShadow: isExpanded ? '0 0 0 3px #DBEAFE' : 'none', animation: `fadeIn 0.35s ease ${i * 0.04}s both` }}>
                <div onClick={() => setExpandedAudit(isExpanded ? null : entry.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: typeCfg.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        flexShrink: 0,
                        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2) rotate(-6deg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                    >
                      {typeCfg.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{benefit?.name ?? entry.benefitId ?? entry.benefit_id ?? '—'}</span>
                        <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: typeCfg.bg, color: typeCfg.color, fontWeight: 600 }}>{typeCfg.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.detail}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 12 }}>
                    {(entry.oldStatus || entry.newStatus) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {entry.oldStatus && <StatusBadge status={entry.oldStatus} small />}
                        <span style={{ color: '#CBD5E1', fontSize: 10 }}>→</span>
                        {entry.newStatus && <StatusBadge status={entry.newStatus} small />}
                      </div>
                    )}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{fmtDate(entry.timestamp)}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="expanded-content" style={{ borderTop: '1px solid #F1F5F9', padding: '16px 18px 18px', background: '#FAFBFC' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
                      {[
                        { label: 'Entry ID', value: entry.id },
                        { label: 'Timestamp', value: fmt(entry.timestamp) },
                        { label: 'Triggered By', value: String(entry.triggeredBy ?? entry.triggered_by ?? '—') },
                        { label: 'Actor', value: String(entry.actor ?? '—') },
                        { label: 'Benefit', value: benefit?.name ?? entry.benefitId ?? '—' },
                        { label: 'Category', value: benefit?.category ?? '—' },
                      ].map((cell, idx) => (
                        <div key={idx} style={{ animation: `fadeIn 0.25s ease ${idx * 0.04}s both` }}>
                          <DetailCell label={cell.label} value={cell.value} />
                        </div>
                      ))}
                    </div>

                    {(entry.oldStatus || entry.newStatus) && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, padding: '10px 14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, animation: 'fadeIn 0.3s both' }}>
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Status transition:</span>
                        {entry.oldStatus ? <StatusBadge status={entry.oldStatus} /> : <span style={{ fontSize: 12, color: '#94A3B8' }}>—</span>}
                        <span style={{ color: '#CBD5E1' }}>→</span>
                        {entry.newStatus ? <StatusBadge status={entry.newStatus} /> : <span style={{ fontSize: 12, color: '#94A3B8' }}>—</span>}
                      </div>
                    )}

                    {entry.ruleTrace && entry.ruleTrace.length > 0 && (
                      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', marginBottom: 14, animation: 'fadeIn 0.3s 0.05s both' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rule Trace</div>
                        {entry.ruleTrace.map((r, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: idx < entry.ruleTrace!.length - 1 ? '1px solid #F1F5F9' : 'none', animation: `rowIn 0.25s ease ${idx * 0.07}s both` }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: r.result === 'PASS' ? '#16a34a' : '#ef4444', minWidth: 34 }}>{r.result}</span>
                            <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{r.label}</span>
                            {r.from && <code style={{ fontSize: 10, color: '#94A3B8', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{r.from}</code>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', animation: 'fadeIn 0.3s 0.1s both' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Event Detail</div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{entry.detail}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#94A3B8', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>🔒</span>
        <span>This audit log is intended to be immutable and append-only. Retention and compliance policies depend on your deployment configuration.</span>
      </div>
    </div>
  );
}

