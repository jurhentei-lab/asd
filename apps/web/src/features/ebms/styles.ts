export const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes expandDown {
    from { opacity: 0; max-height: 0; transform: translateY(-6px); }
    to   { opacity: 1; max-height: 1200px; transform: translateY(0); }
  }
  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.88); }
    70%  { transform: scale(1.03); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.4); opacity: 0.7; }
  }
  @keyframes skeletonPulse {
    0%, 100% { opacity: 0.35; }
    50%       { opacity: 0.7; }
  }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.9) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes badgeIn {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .nav-tab { transition: background 0.18s ease, color 0.18s ease, transform 0.15s ease; }
  .nav-tab:hover { background: #F1F5F9 !important; color: #374151 !important; transform: translateY(-1px); }
  .nav-tab.active:hover { background: #DBEAFE !important; color: #1d4ed8 !important; }
  .category-pill { transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); }
  .category-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.12); }
  .benefit-card { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.18s ease; }
  .benefit-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 32px rgba(37,99,235,0.10) !important; }
  .benefit-card:active { transform: translateY(-1px) scale(0.99); }
  .request-btn { transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); }
  .request-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.30) !important; filter: brightness(1.05); }
  .request-btn:active:not(:disabled) { transform: translateY(0px) scale(0.98); }
  .request-row { transition: border-color 0.18s ease, box-shadow 0.18s ease; }
  .request-row:hover { border-color: #BFDBFE !important; box-shadow: 0 2px 12px rgba(37,99,235,0.07) !important; }
  .audit-row { transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.15s ease; }
  .audit-row:hover { border-color: #BFDBFE !important; background: #FAFEFF !important; }
  .audit-type-card { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .audit-type-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
  .cancel-btn { transition: all 0.18s ease; }
  .cancel-btn:hover { background: #FEF2F2 !important; border-color: #EF4444 !important; transform: translateY(-1px); }
  .filter-pill { transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); }
  .filter-pill:hover { transform: translateY(-1px); }
  .stat-card { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease; }
  .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.07) !important; }
  .expanded-content { animation: expandDown 0.28s cubic-bezier(0.16,1,0.3,1) forwards; overflow: hidden; }
  .modal-overlay { animation: overlayIn 0.22s ease forwards; }
  .modal-box { animation: modalIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards; }
  .skeleton { animation: skeletonPulse 1.4s ease-in-out infinite; background: #E2E8F0; border-radius: 6px; }
`;

