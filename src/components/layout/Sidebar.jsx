import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calendar, Users, CreditCard, ShoppingBag, Wallet, Receipt, BedDouble, BarChart3, User, Settings, Menu, X } from 'lucide-react'

const nav = [
  { section: 'Principal', items: [
    { to: '/', label: 'Mapa de quartos', Icon: Home },
    { to: '/reservas', label: 'Reservas', Icon: Calendar },
    { to: '/hospedes', label: 'Hóspedes', Icon: Users },
  ]},
  { section: 'Financeiro', items: [
    { to: '/pagamentos', label: 'Recebimentos', Icon: CreditCard },
    { to: '/consumos', label: 'Produtos e serviços', Icon: ShoppingBag },
    { to: '/gastos', label: 'Gastos do hotel', Icon: Wallet },
    { to: '/recibos', label: 'Vouchers e recibos', Icon: Receipt },
  ]},
  { section: 'Gestão', items: [
    { to: '/quartos', label: 'Gestão de quartos', Icon: BedDouble },
    { to: '/relatorios', label: 'Relatórios', Icon: BarChart3 },
    { to: '/usuarios', label: 'Usuários', Icon: User },
    { to: '/configuracoes', label: 'Configurações', Icon: Settings },
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
        {open ? <X size={20} /> : <Menu size={20} />}
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
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Home size={22} color="white" strokeWidth={2} />
          </div>
          <div>
            <div className="sidebar-hotel-name">Hotel Barbosa</div>
            <div className="sidebar-hotel-sub">24 Horas</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {nav.map(group => (
            <div key={group.section}>
              <div className="sidebar-section-title">{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => 'sidebar-item' + (isActive ? ' active' : '')}
                >
                  <item.Icon size={16} style={{ minWidth: 16 }} />
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
    </>
  )
}
