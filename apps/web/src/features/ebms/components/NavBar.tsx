import { Skeleton } from '../ui';
import type { Employee } from '../types';

export function NavBar({
  activeTab,
  onSwitchTab,
  pendingCount,
  employeeLoading,
  emp,
}: {
  activeTab: string;
  onSwitchTab: (id: 'dashboard' | 'requests' | 'audit') => void;
  pendingCount: number;
  employeeLoading: boolean;
  emp: Employee | null;
}) {
  return (
    <nav
      style={{
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        animation: 'fadeInDown 0.35s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg,#2563EB,#1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(-6deg) scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>E</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>EBMS</span>
        <span style={{ color: '#CBD5E1', margin: '0 4px' }}>|</span>
        <span style={{ color: '#64748B', fontSize: 13 }}>Employee Benefits</span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { id: 'dashboard' as const, label: 'Dashboard' },
          { id: 'requests' as const, label: 'My Requests' },
          { id: 'audit' as const, label: 'Audit Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSwitchTab(tab.id)}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === tab.id ? '#EFF6FF' : 'transparent',
              color: activeTab === tab.id ? '#2563EB' : '#64748B',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {tab.label}
            {tab.id === 'requests' && pendingCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: '#2563EB',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '1px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  animation: 'badgeIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'dotPulse 2s ease-in-out infinite' }} />
        {employeeLoading ? (
          <Skeleton w={36} h={36} style={{ borderRadius: '50%' }} />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#DBEAFE',
              border: '2px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#2563EB',
              cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
          >
            {emp?.avatar ?? '?'}
          </div>
        )}
        <div>
          {employeeLoading ? (
            <>
              <Skeleton w={110} h={13} style={{ marginBottom: 4 }} />
              <Skeleton w={80} h={11} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{emp?.nameEng ?? emp?.name ?? ''}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                {emp?.role ?? '—'} · {emp?.department ?? '—'}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

