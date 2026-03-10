import type { Employee } from '../types';
import { ErrorBanner, ProfileSkeleton, Stat } from '../ui';

export function ProfileBanner({
  employeeLoading,
  employeeError,
  onRetry,
  emp,
}: {
  employeeLoading: boolean;
  employeeError: string | null;
  onRetry: () => void;
  emp: Employee | null;
}) {
  if (employeeLoading) return <ProfileSkeleton />;
  if (employeeError) return <ErrorBanner message={employeeError} onRetry={onRetry} />;
  if (!emp) return null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: '18px 28px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        animation: 'fadeInDown 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: '#2563EB',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            cursor: 'default',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1) rotate(-4deg)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          {emp.avatar ?? (emp.nameEng ?? emp.name).slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
            {emp.role ?? '—'} · {emp.department ?? '—'} · Level {emp.level ?? '—'} · {emp.employeeCode ?? emp.id}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <Stat label="Tenure" value={emp.tenure ?? '—'} />
        <Stat label="OKR Status" value={emp.okr ? 'Submitted' : 'Pending'} accent={Boolean(emp.okr)} warn={!emp.okr} />
        <Stat label="Late Arrivals" value={`${emp.lateArrivals ?? 0}/3`} warn={(emp.lateArrivals ?? 0) >= 2} />
        <Stat label="Employment" value={emp.status ?? '—'} accent />
      </div>
    </div>
  );
}

