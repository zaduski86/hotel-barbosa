import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/layout/Sidebar'
import MapaQuartos from './pages/MapaQuartos'
import { Reservas, Hospedes, Quartos } from './pages/Pages'
import Pagamentos from './pages/Pagamentos'
import Consumos from './pages/Consumos'
import Gastos from './pages/Gastos'
import Recibos from './pages/Recibos'
import Relatorios from './pages/Relatorios'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const titulos = {
  '/': 'Mapa de quartos', '/reservas': 'Reservas', '/hospedes': 'Hóspedes',
  '/quartos': 'Gestão de quartos', '/pagamentos': 'Recebimentos',
  '/consumos': 'Produtos e serviços', '/gastos': 'Gastos do hotel',
  '/recibos': 'Vouchers e recibos', '/relatorios': 'Relatórios',
  '/usuarios': 'Usuários', '/configuracoes': 'Configurações',
}

const user = { nome: 'Administrador', cargo: 'gestor' }

export default function App() {
  const location = useLocation()
  const titulo = titulos[location.pathname] || 'Hotel Barbosa 24 Horas'
  return (
    <div className="layout">
      <Sidebar user={user} />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{titulo}</div>
            <div className="topbar-sub">{dayjs().format('dddd, DD [de] MMMM [de] YYYY')}</div>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Hotel Barbosa 24 Horas</span>
          </div>
        </div>
        <div className="page">
          <Routes>
            <Route path="/" element={<MapaQuartos />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/hospedes" element={<Hospedes />} />
            <Route path="/quartos" element={<Quartos />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
            <Route path="/consumos" element={<Consumos />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/recibos" element={<Recibos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </div>
      </main>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13, borderRadius: 10 } }} />
    </div>
  )
}
