import type { Benefit } from '../types';
import { CATEGORIES, STATUS_CONFIG } from '../config';
import { AnimNum, ErrorBanner, Skeleton, StatusBadge } from '../ui';

export function DashboardTab({
  benefits,
  loading,
  error,
  onRetry,
  activeCategory,
  setActiveCategory,
  selectedBenefit,
  setSelectedBenefit,
  pendingBenefitIds,
  onRequest,
  onOpenContract,
  counts,
  tabKey,
}: {
  benefits: Benefit[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  activeCategory: string;
  setActiveCategory: (v: string) => void;
  selectedBenefit: Benefit | null;
  setSelectedBenefit: (b: Benefit | null) => void;
  pendingBenefitIds: Set<string>;
  onRequest: (benefit: Benefit, contractAccepted: boolean) => void;
  onOpenContract: (benefit: Benefit) => void;
  counts: Record<'ACTIVE' | 'ELIGIBLE' | 'PENDING' | 'LOCKED', number>;
  tabKey: number;
}) {
  return (
    <div key={`dashboard-${tabKey}`}>
      {error && <ErrorBanner message={error} onRetry={onRetry} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {(Object.keys(counts) as Array<keyof typeof counts>).map((status, i) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div
              key={status}
              className="stat-card"
              style={{
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '16px 20px',
                animation: `fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color, letterSpacing: '-0.04em' }}>
                  {loading ? <Skeleton w={32} h={28} /> : <AnimNum value={counts[status]} />}
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, marginTop: 6 }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{cfg.label} Benefits</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', animation: 'fadeIn 0.4s 0.15s both' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="category-pill"
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: activeCategory === cat ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
              background: activeCategory === cat ? '#EFF6FF' : '#fff',
              color: activeCategory === cat ? '#2563EB' : '#64748B',
              fontWeight: activeCategory === cat ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: 20,
                animation: `fadeIn 0.4s ease ${i * 0.05}s both`,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <Skeleton w={40} h={40} style={{ borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton w="70%" h={14} style={{ marginBottom: 6 }} />
                  <Skeleton w="50%" h={11} />
                </div>
              </div>
              <Skeleton w="100%" h={10} style={{ marginBottom: 8 }} />
              <Skeleton w="100%" h={36} style={{ borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {benefits
            .filter((b) => activeCategory === 'All' || b.category === activeCategory)
            .map((benefit, i) => {
              const alreadyPending = pendingBenefitIds.has(benefit.id) || (benefit.slug ? pendingBenefitIds.has(benefit.slug) : false);
              const isSelected = selectedBenefit?.id === benefit.id;
              return (
                <div
                  key={benefit.id}
                  className="benefit-card"
                  onClick={() => setSelectedBenefit(isSelected ? null : benefit)}
                  style={{
                    background: '#fff',
                    border: `1px solid ${isSelected ? '#93C5FD' : '#E2E8F0'}`,
                    borderRadius: 14,
                    padding: 20,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 3px #DBEAFE' : 'none',
                    opacity: benefit.status === 'LOCKED' ? 0.78 : 1,
                    animation: `fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: benefit.status === 'LOCKED' ? '#F1F5F9' : '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2) rotate(-5deg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                      >
                        {benefit.icon ?? '🎁'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{benefit.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{benefit.vendor ?? '—'}</div>
                      </div>
                    </div>
                    <StatusBadge status={benefit.status} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, padding: '2px 8px' }}>{benefit.category}</span>
                    {benefit.subsidy && benefit.subsidy !== '—' && <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>{benefit.subsidy} subsidy</span>}
                  </div>

                  {benefit.status === 'LOCKED' && benefit.lockReason && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 11, color: '#94A3B8', display: 'flex', gap: 6 }}>
                      <span>🔒</span>
                      <span>{benefit.lockReason}</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="expanded-content" style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Rule Evaluation
                      </div>
                      {(benefit.rules ?? []).map((rule, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '5px 0',
                            borderBottom: idx < (benefit.rules?.length ?? 0) - 1 ? '1px solid #F1F5F9' : 'none',
                            animation: `rowIn 0.25s ease ${idx * 0.06}s both`,
                          }}
                        >
                          <span style={{ fontSize: 13, color: rule.passed ? '#16a34a' : '#ef4444' }}>{rule.passed ? '✓' : '✗'}</span>
                          <span style={{ fontSize: 12, color: rule.passed ? '#374151' : '#ef4444', flex: 1 }}>{rule.label}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>{rule.note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {benefit.status === 'ELIGIBLE' && (
                    <button
                      className="request-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        benefit.requiresContract ? onOpenContract(benefit) : onRequest(benefit, false);
                      }}
                      disabled={alreadyPending}
                      style={{
                        width: '100%',
                        padding: '9px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: alreadyPending ? '#F1F5F9' : 'linear-gradient(135deg,#2563EB,#1d4ed8)',
                        color: alreadyPending ? '#94A3B8' : '#fff',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: alreadyPending ? 'default' : 'pointer',
                        marginTop: 4,
                      }}
                    >
                      {alreadyPending ? '⏳ Request Pending' : benefit.requiresContract ? 'Review Contract & Request' : 'Request Benefit'}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

