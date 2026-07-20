import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt, statusReservaMap } from '../utils/format'
import { baixarRecibo, gerarLinkWhatsApp, gerarReciboPDF } from '../utils/pdf'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function Recibos() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [mes, setMes] = useState(dayjs().format('YYYY-MM'))

  const load = async () => {
    setLoading(true)
    const inicio = dayjs(mes).startOf('month').toISOString()
    const fim = dayjs(mes).endOf('month').toISOString()
    let q = supabase.from('reservas')
      .select('*, hospedes(*), quartos(*), consumos(*), pagamentos(*)')
      .gte('criado_em', inicio).lte('criado_em', fim)
      .order('criado_em', { ascending: false })
    if (busca) q = q.or(`hospedes.nome.ilike.%${busca}%,codigo.ilike.%${busca}%`)
    const { data } = await q
    setReservas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [mes, busca])

  const gerarPDF = async (r) => {
    const { data: consumos } = await supabase.from('consumos').select('*').eq('reserva_id', r.id)
    const { data: pagamentos } = await supabase.from('pagamentos').select('*').eq('reserva_id', r.id)
    const rCompleta = { ...r, hospedes: r.hospedes, quartos: r.quartos }
    baixarRecibo(rCompleta, consumos || [], pagamentos || [])
    toast.success('PDF gerado!')
  }

  const enviarWhatsapp = async (r) => {
    if (!r.hospedes?.telefone) return toast.error('Hóspede sem telefone cadastrado')
    const { data: consumos } = await supabase.from('consumos').select('*').eq('reserva_id', r.id)
    const { data: pagamentos } = await supabase.from('pagamentos').select('*').eq('reserva_id', r.id)
    const doc = gerarReciboPDF(r, consumos || [], pagamentos || [])
    doc.save(`recibo-${r.codigo}.pdf`)
    const link = gerarLinkWhatsApp(r.hospedes.telefone, r)
    window.open(link, '_blank')
    toast.success('PDF baixado! WhatsApp aberto para envio.')
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <div className="flex gap-2">
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: 'auto' }} />
          <input placeholder="🔍 Buscar por hóspede ou código..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 260 }} />
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> :
         reservas.length === 0 ? <div className="empty-state"><div className="empty-icon">🧾</div><p>Nenhuma reserva neste período</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Hóspede</th><th>Quarto</th><th>Período</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {reservas.map(r => {
                  const s = statusReservaMap[r.status]
                  return (
                    <tr key={r.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>{r.codigo}</span></td>
                      <td>
                        <strong>{r.hospedes?.nome}</strong>
                        {r.hospedes?.telefone && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.hospedes.telefone}</div>}
                      </td>
                      <td>#{r.quartos?.numero}</td>
                      <td style={{ fontSize: 12 }}>{fmt.date(r.data_entrada)} → {fmt.date(r.data_saida)}<div style={{ color: 'var(--text3)', fontSize: 11 }}>{r.total_diarias} noite(s)</div></td>
                      <td><strong style={{ color: 'var(--green)' }}>{fmt.money(r.valor_total)}</strong></td>
                      <td><span className={`badge ${s?.badge}`}>{s?.label}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => gerarPDF(r)}>⬇️ PDF</button>
                          <button className="btn btn-success btn-sm" onClick={() => enviarWhatsapp(r)}>📱 WhatsApp</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
