import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import Sidebar from './components/layout/Sidebar'
import Login from './pages/Login'
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
  '/':'Mapa de quartos','/reservas':'Reservas','/hospedes':'Hóspedes',
  '/quartos':'Gestão de quartos','/pagamentos':'Recebimentos',
  '/consumos':'Produtos e serviços','/gastos':'Gastos do hotel',
  '/recibos':'Vouchers e recibos','/relatorios':'Relatórios',
  '/usuarios':'Usuários','/configuracoes':'Configurações',
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const titulo = titulos[location.pathname] || 'Hotel Barbosa 24 Horas'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const sair = async () => { await supabase.auth.signOut() }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f1520'}}><div style={{width:24,height:24,border:'3px solid rgba(99,102,241,0.3)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>
  if (!session) return <Login />

  const user = { nome: session.user.email?.split('@')[0] || 'Usuário', cargo: 'gestor' }

  return (
    <div className="layout">
      <Sidebar user={user} onLogout={sair} />
      <main className="main">
        <div className="topbar">
          <div><div className="topbar-title">{titulo}</div><div className="topbar-sub">{dayjs().format('dddd, DD [de] MMMM [de] YYYY')}</div></div>
          <div className="topbar-right">
            <span style={{fontSize:12,color:'var(--text3)'}}>{session.user.email}</span>
            <button className="btn btn-secondary btn-sm" onClick={sair}>Sair</button>
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
      <Toaster position="top-right" toastOptions={{style:{fontSize:13,borderRadius:10}}} />
    </div>
  )
}
