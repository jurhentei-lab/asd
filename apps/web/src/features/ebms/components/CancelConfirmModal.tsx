export function CancelConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
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
      onClick={onClose}
    >
      <div
        className="modal-box"
        style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%', boxShadow: '0 24px 64px #0F172A33' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Cancel this request?</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
          This will mark the request as <strong>Cancelled</strong>. The action is logged in the audit trail and cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
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
            Keep Request
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: 10,
              border: 'none',
              borderRadius: 8,
              background: '#DC2626',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#B91C1C';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#DC2626';
              e.currentTarget.style.transform = '';
            }}
          >
            Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
}

