import type { Benefit } from '../types';

export function ContractModal({
  benefit,
  onCancel,
  onAcceptAndSubmit,
}: {
  benefit: Benefit;
  onCancel: () => void;
  onAcceptAndSubmit: () => void;
}) {
  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0F172A99',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        className="modal-box"
        style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', boxShadow: '0 24px 64px #0F172A33' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Vendor Contract Review</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
          {benefit.name} · {benefit.vendor ?? benefit.contract?.vendorName ?? '—'}
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, marginBottom: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8, animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>📄</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{benefit.contract?.version ? `Contract v${benefit.contract.version}` : 'Active contract'}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Please review and accept to submit your request.</div>
          {benefit.contract?.signedUrl && (
            <a
              href={benefit.contract.signedUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: 12,
                padding: '6px 14px',
                background: '#EFF6FF',
                borderRadius: 6,
                display: 'inline-block',
                fontSize: 11,
                color: '#2563EB',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              🔗 Open contract PDF
            </a>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, marginBottom: 18 }}>
          By accepting, you confirm you have read the <strong>{benefit.vendor ?? benefit.contract?.vendorName ?? 'vendor'}</strong> vendor contract. Your acceptance will be logged with your employee ID, timestamp, and (when available) IP address.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 10,
              border: '1.5px solid #E2E8F0',
              borderRadius: 8,
              background: '#fff',
              color: '#64748B',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            Cancel
          </button>
          <button
            className="request-btn"
            onClick={onAcceptAndSubmit}
            style={{
              flex: 2,
              padding: 10,
              border: 'none',
              borderRadius: 8,
              background: 'linear-gradient(135deg,#2563EB,#1d4ed8)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Accept Contract & Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

