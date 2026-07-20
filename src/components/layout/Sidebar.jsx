import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const nav = [
  { section: 'Principal', items: [
    { to: '/', label: 'Mapa de quartos', emoji: '🏠' },
    { to: '/reservas', label: 'Reservas', emoji: '📅' },
    { to: '/hospedes', label: 'Hóspedes', emoji: '👥' },
  ]},
  { section: 'Financeiro', items: [
    { to: '/pagamentos', label: 'Recebimentos', emoji: '💳' },
    { to: '/consumos', label: 'Produtos e serviços', emoji: '🛍️' },
    { to: '/gastos', label: 'Gastos do hotel', emoji: '💰' },
    { to: '/recibos', label: 'Vouchers e recibos', emoji: '🧾' },
  ]},
  { section: 'Gestão', items: [
    { to: '/quartos', label: 'Gestão de quartos', emoji: '🛏️' },
    { to: '/relatorios', label: 'Relatórios', emoji: '📊' },
    { to: '/usuarios', label: 'Usuários', emoji: '👤' },
    { to: '/configuracoes', label: 'Configurações', emoji: '⚙️' },
  ]},
]

export default function Sidebar({ user, onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botão hamburguer - só mobile */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', top: 14, left: 14, zIndex: 1100,
        width: 40, height: 40, borderRadius: 8,
        background: 'var(--primary,#2d5a1b)', border: 'none',
        color: 'white', fontSize: 20, cursor: 'pointer',
        display: 'none', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
      }} className="hamburguer">
        {open ? '✕' : '☰'}
      </button>

      {/* Overlay escuro quando aberto no mobile */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1050, display: 'none'
        }} className="mob-overlay" />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <div>
              <div className="sidebar-hotel-name">Hotel Barbosa</div>
              <div className="sidebar-hotel-sub">24 Horas</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {nav.map(group => (
            <div key={group.section} className="sidebar-section">
              <div className="sidebar-section-title">{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => 'sidebar-item' + (isActive ? ' active' : '')}
                >
                  <span style={{ fontSize: 16, minWidth: 22 }}>{item.emoji}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{(user?.nome || 'A')[0].toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{user?.nome || 'Admin'}</div>
              <div className="sidebar-user-role">{user?.cargo || 'gestor'}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>Sair</button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .hamburguer { display: flex !important; }
          .mob-overlay { display: block !important; }
          .sidebar {
            position: fixed !important;
            left: -260px !important;
            top: 0 !important;
            height: 100vh !important;
            z-index: 1080 !important;
            transition: left 0.25s ease !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.3) !important;
          }
          .sidebar.sidebar-open {
            left: 0 !important;
          }
          .main { margin-left: 0 !important; }
          .topbar { padding-left: 64px !important; }
        }
      `}</style>
    </>
  )
}
