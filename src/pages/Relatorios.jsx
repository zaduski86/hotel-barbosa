import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../utils/format'
import dayjs from 'dayjs'
import { Download, ClipboardList } from 'lucide-react'

export default function Relatorios() {
  const [mes, setMes] = useState(dayjs().format('YYYY-MM'))
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const inicio = dayjs(mes).startOf('month').toISOString()
    const fim = dayjs(mes).endOf('month').toISOString()
    const inicioDt = dayjs(mes).startOf('month').format('YYYY-MM-DD')
    const fimDt = dayjs(mes).endOf('month').format('YYYY-MM-DD')

    const [{ data: reservas }, { data: pagamentos }, { data: consumos }, { data: gastos }, { data: atividades }] = await Promise.all([
      supabase.from('reservas').select('*, hospedes(nome), quartos(numero, tipo)').gte('criado_em', inicio).lte('criado_em', fim).neq('status', 'cancelada'),
      supabase.from('pagamentos').select('*').eq('status', 'pago').gte('criado_em', inicio).lte('criado_em', fim),
      supabase.from('consumos').select('*').gte('criado_em', inicio).lte('criado_em', fim),
      supabase.from('gastos').select('*').gte('data_gasto', inicioDt).lte('data_gasto', fimDt),
      supabase.from('atividades').select('*').gte('criado_em', inicio).lte('criado_em', fim).order('criado_em', { ascending: false }).limit(20),
    ])

    const totalReceitas = (pagamentos || []).reduce((s, p) => s + Number(p.valor), 0)
    const totalGastos = (gastos || []).reduce((s, g) => s + Number(g.valor), 0)
    const totalConsumos = (consumos || []).reduce((s, c) => s + Number(c.valor_total), 0)

    // Receita por tipo de quarto
    const porTipo = {}
    ;(reservas || []).forEach(r => {
      const tipo = r.quartos?.tipo || 'outros'
      if (!porTipo[tipo]) porTipo[tipo] = { count: 0, valor: 0 }
      porTipo[tipo].count++
      porTipo[tipo].valor += Number(r.valor_total)
    })

    // Gastos por categoria
    const porCategoria = {}
    ;(gastos || []).forEach(g => {
      if (!porCategoria[g.categoria]) porCategoria[g.categoria] = 0
      porCategoria[g.categoria] += Number(g.valor)
    })

    // Checkins por dia
    const porDia = {}
    ;(reservas || []).forEach(r => {
      const dia = dayjs(r.data_entrada).format('DD')
      if (!porDia[dia]) porDia[dia] = 0
      porDia[dia]++
    })

    setDados({
      reservas: reservas || [],
      pagamentos: pagamentos || [],
      consumos: consumos || [],
      gastos: gastos || [],
      atividades: atividades || [],
      totalReceitas,
      totalGastos,
      totalConsumos,
      lucro: totalReceitas + totalConsumos - totalGastos,
      porTipo,
      porCategoria,
      porDia,
      taxaOcupacao: (reservas || []).length,
      ticketMedio: (reservas || []).length > 0 ? totalReceitas / (reservas || []).length : 0,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [mes])

  const exportarCSV = () => {
    if (!dados) return
    const linhas = [
      ['Tipo', 'Descrição', 'Valor', 'Data'],
      ...dados.pagamentos.map(p => ['Receita', `Pagamento — ${p.metodo}`, p.valor, dayjs(p.pago_em).format('DD/MM/YYYY')]),
      ...dados.gastos.map(g => ['Gasto', g.descricao, -g.valor, g.data_gasto]),
    ]
    const csv = linhas.map(l => l.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `relatorio-${mes}.csv`; a.click()
  }

  const barMaxVal = dados ? Math.max(...Object.values(dados.porTipo).map(v => v.valor), 1) : 1

  return (
    <div>
      <div className="flex-between mb-6">
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: 'auto' }} />
        <button className="btn btn-secondary" onClick={exportarCSV}><Download size={14} style={{ marginRight: 6 }} />Exportar CSV</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner"></div></div> : dados && (
        <>
          <div className="stats-grid mb-6">
            <div className="stat-card">
              <div className="stat-label">Receita total</div>
              <div className="stat-value stat-green" style={{ fontSize: 20 }}>{fmt.money(dados.totalReceitas + dados.totalConsumos)}</div>
              <div className="stat-sub">Hospedagem + consumos</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gastos do hotel</div>
              <div className="stat-value stat-red" style={{ fontSize: 20 }}>{fmt.money(dados.totalGastos)}</div>
              <div className="stat-sub">{dados.gastos.length} lançamentos</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Lucro estimado</div>
              <div className="stat-value" style={{ fontSize: 20, color: dados.lucro >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.money(dados.lucro)}</div>
              <div className="stat-sub">Receita − Gastos</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ticket médio</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmt.money(dados.ticketMedio)}</div>
              <div className="stat-sub">{dados.reservas.length} reservas</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Receita por tipo de quarto</div></div>
              {Object.entries(dados.porTipo).length === 0 ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sem dados</div> :
                Object.entries(dados.porTipo).map(([tipo, val]) => (
                  <div key={tipo} style={{ marginBottom: 12 }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 500 }}>{tipo}</span>
                      <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{fmt.money(val.valor)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${(val.valor / barMaxVal * 100).toFixed(0)}%`, transition: 'width .5s' }}></div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{val.count} reserva(s)</div>
                  </div>
                ))
              }
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Gastos por categoria</div></div>
              {Object.entries(dados.porCategoria).length === 0 ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sem gastos registrados</div> :
                Object.entries(dados.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                  const maxGasto = Math.max(...Object.values(dados.porCategoria))
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 500 }}>{cat}</span>
                        <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{fmt.money(val)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--red)', borderRadius: 3, width: `${(val / maxGasto * 100).toFixed(0)}%`, transition: 'width .5s' }}></div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><div className="card-title">Reservas do mês</div></div>
            {dados.reservas.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={40} color="var(--text3)" strokeWidth={1.5} /></div><p>Nenhuma reserva neste mês</p></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Hóspede</th><th>Quarto</th><th>Entrada</th><th>Saída</th><th>Diárias</th><th>Valor</th></tr></thead>
                  <tbody>
                    {dados.reservas.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.hospedes?.nome}</strong></td>
                        <td>#{r.quartos?.numero}</td>
                        <td>{fmt.date(r.data_entrada)}</td>
                        <td>{fmt.date(r.data_saida)}</td>
                        <td>{r.total_diarias}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt.money(r.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {dados.gastos.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Gastos do mês</div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Descrição</th><th>Fornecedor</th><th>Categoria</th><th>Data</th><th>Valor</th></tr></thead>
                  <tbody>
                    {dados.gastos.map(g => (
                      <tr key={g.id}>
                        <td><strong>{g.descricao}</strong></td>
                        <td style={{ color: 'var(--text2)' }}>{g.fornecedor || '—'}</td>
                        <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{g.categoria}</span></td>
                        <td>{fmt.date(g.data_gasto)}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt.money(g.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
