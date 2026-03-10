import { useEffect, useState, type CSSProperties } from 'react';
import { STATUS_CONFIG } from './config';

export function useCountUp(target: number, duration = 600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) {
      setCount(0);
      return;
    }
    let cur = 0;
    const step = target / (duration / 16);
    const t = window.setInterval(() => {
      cur += step;
      if (cur >= target) {
        setCount(target);
        window.clearInterval(t);
      } else {
        setCount(Math.floor(cur));
      }
    }, 16);
    return () => window.clearInterval(t);
  }, [target, duration]);
  return count;
}

export function AnimNum({ value }: { value: number | null | undefined }) {
  return <>{useCountUp(value ?? 0)}</>;
}

export function Skeleton({ w = '100%', h = 16, style = {} }: { w?: string | number; h?: number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }} />;
}

export function ProfileSkeleton() {
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
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Skeleton w={48} h={48} style={{ borderRadius: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton w={160} h={18} />
          <Skeleton w={240} h={13} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        {[80, 70, 80, 70].map((w, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <Skeleton w={w} h={14} />
            <Skeleton w={50} h={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      style={{
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'scaleIn 0.25s ease both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Өгөгдөл татахад алдаа гарлаа</div>
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '6px 14px',
            border: '1.5px solid #FECACA',
            borderRadius: 8,
            background: '#fff',
            color: '#dc2626',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
        >
          Дахин оролдох
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#64748B', bg: '#F8FAFC', dot: '#94A3B8' };
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: small ? '2px 7px' : '3px 10px',
        borderRadius: 20,
        background: cfg.bg,
        border: `1px solid ${cfg.dot}44`,
        flexShrink: 0,
        animation: 'badgeIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      <div style={{ width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%', background: cfg.dot }} />
      <span style={{ fontSize: small ? 10 : 11, fontWeight: 600, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>
    </div>
  );
}

export function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div
      style={{ textAlign: 'center', transition: 'transform 0.2s ease', cursor: 'default' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: warn ? '#d97706' : accent ? '#2563EB' : '#0F172A' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{label}</div>
    </div>
  );
}

export function DetailCell({
  label,
  value,
  colored,
  muted,
}: {
  label: string;
  value: string;
  colored?: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 8, padding: '9px 12px', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#BFDBFE';
        e.currentTarget.style.boxShadow = '0 1px 6px rgba(37,99,235,0.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#F1F5F9';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: colored || (muted ? '#94A3B8' : '#374151'),
          fontStyle: muted ? 'italic' : 'normal',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}
