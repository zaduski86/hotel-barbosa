import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { X, Check, ShoppingCart } from 'lucide-react'

function ModalConsumo({ reserva, onClose, onSave }) {
  const [produtos, setProdutos] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [quantidade, setQuantidade] = useState(1)
  const [custom, setCustom] = useState({ nome: '', valor: '' })
  const [modo, setModo] = useState('lista') // 'lista' | 'custom'
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('produtos_servicos').select('*').eq('ativo', true).order('categoria').then(({ data }) => setProdutos(data || []))
  }, [])

  const categorias = [...new Set(produtos.map(p => p.categoria))]

  const registrar = async () => {
    if (modo === 'lista' && !selecionado) return toast.error('Selecione um item')
    if (modo === 'custom' && (!custom.nome || !custom.valor)) return toast.error('Preencha nome e valor')
    setLoading(true)
    try {
      const item = modo === 'lista' ? selecionado : { nome: custom.nome, preco: Number(custom.valor) }
      const { error } = await supabase.from('consumos').insert({
        reserva_id: reserva.id,
        quarto_id: reserva.quarto_id,
        produto_id: modo === 'lista' ? selecionado.id : null,
        nome_item: item.nome,
        quantidade,
        valor_unitario: item.preco,
        valor_total: item.preco * quantidade,
        registrado_por: 'Recepção',
      })
      if (error) throw error
      toast.success(`${item.nome} registrado!`)
      onSave()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Registrar consumo</h3>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{reserva.hospedes?.nome} — Quarto #{reserva.quartos?.numero}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <div className={`tab ${modo === 'lista' ? 'active' : ''}`} onClick={() => setModo('lista')}>Lista de produtos</div>
            <div className={`tab ${modo === 'custom' ? 'active' : ''}`} onClick={() => setModo('custom')}>Item personalizado</div>
          </div>

          {modo === 'lista' ? (
            <div>
              {categorias.map(cat => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {produtos.filter(p => p.categoria === cat).map(p => (
                      <div key={p.id} onClick={() => setSelecionado(p)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${selecionado?.id === p.id ? 'var(--accent)' : 'var(--border)'}`, background: selecionado?.id === p.id ? 'var(--accent-light)' : 'var(--surface2)', transition: 'all .15s' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: selecionado?.id === p.id ? 'var(--accent)' : 'var(--text)' }}>{p.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>{fmt.money(p.preco)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="form-group"><label>Descrição do item</label><input value={custom.nome} onChange={e => setCustom(c => ({ ...c, nome: e.target.value }))} placeholder="Ex: Serviço extra" /></div>
              <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={custom.valor} onChange={e => setCustom(c => ({ ...c, valor: e.target.value }))} /></div>
            </div>
          )}

          <div className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ margin: 0 }}>Quantidade:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-secondary btn-icon" onClick={() => setQuantidade(q => Math.max(1, q - 1))}>−</button>
                <span style={{ fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{quantidade}</span>
                <button className="btn btn-secondary btn-icon" onClick={() => setQuantidade(q => q + 1)}>+</button>
              </div>
            </div>
            {(selecionado || (custom.nome && custom.valor)) && (
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
                {fmt.money((selecionado?.preco || Number(custom.valor) || 0) * quantidade)}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={registrar} disabled={loading}>{loading ? <span className="spinner"></span> : <><Check size={14} style={{marginRight:6}} />Registrar</>}</button>
        </div>
      </div>
    </div>
  )
}

export default function Consumos() {
  const [reservasAtivas, setReservasAtivas] = useState([])
  const [consumos, setConsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [reservaSelecionada, setReservaSelecionada] = useState(null)

  const load = async () => {
    setLoading(true)
    const hoje = dayjs().format('YYYY-MM-DD')
    const { data: reservas } = await supabase.from('reservas')
      .select('*, hospedes(nome), quartos(numero)')
      .in('status', ['confirmada', 'checkin'])
      .lte('data_entrada', hoje).gte('data_saida', hoje)

    setReservasAtivas(reservas || [])

    const ids = (reservas || []).map(r => r.id)
    if (ids.length > 0) {
      const { data: cons } = await supabase.from('consumos').select('*, reservas(hospedes(nome), quartos(numero))').in('reserva_id', ids).order('criado_em', { ascending: false })
      setConsumos(cons || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const consumosFiltrados = reservaSelecionada ? consumos.filter(c => c.reserva_id === reservaSelecionada) : consumos
  const totalConsumos = consumosFiltrados.reduce((s, c) => s + Number(c.valor_total), 0)

  const excluir = async (id) => {
    if (!confirm('Remover este consumo?')) return
    await supabase.from('consumos').delete().eq('id', id)
    toast.success('Removido')
    load()
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={reservaSelecionada || ''} onChange={e => setReservaSelecionada(e.target.value || null)} style={{ width: 'auto' }}>
            <option value="">Todos os quartos ativos</option>
            {reservasAtivas.map(r => <option key={r.id} value={r.id}>#{r.quartos?.numero} — {r.hospedes?.nome}</option>)}
          </select>
          {reservaSelecionada && (
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total: <strong style={{ color: 'var(--green)' }}>{fmt.money(totalConsumos)}</strong></span>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (reservasAtivas.length === 0) return toast.error('Nenhum quarto com hóspede ativo')
          setModal(reservaSelecionada ? reservasAtivas.find(r => r.id === reservaSelecionada) : 'selecionar')
        }}>
          + Registrar consumo
        </button>
      </div>

      {modal === 'selecionar' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Selecionar quarto</h3><button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {reservasAtivas.map(r => (
                <div key={r.id} onClick={() => setModal(r)} style={{ padding: '12px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', marginBottom: 8, background: 'var(--surface2)', transition: 'background .15s' }}>
                  <strong>Quarto #{r.quartos?.numero}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{r.hospedes?.nome}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> :
         consumosFiltrados.length === 0 ? <div className="empty-state"><div className="empty-icon"><ShoppingCart size={40} color="var(--text3)" strokeWidth={1.5} /></div><p>Nenhum consumo registrado</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Quarto</th><th>Hóspede</th><th>Item</th><th>Qtd</th><th>Valor unit.</th><th>Total</th><th>Horário</th><th></th></tr></thead>
              <tbody>
                {consumosFiltrados.map(c => (
                  <tr key={c.id}>
                    <td><strong>#{c.reservas?.quartos?.numero}</strong></td>
                    <td>{c.reservas?.hospedes?.nome}</td>
                    <td>{c.nome_item}</td>
                    <td style={{ textAlign: 'center' }}>{c.quantidade}</td>
                    <td>{fmt.money(c.valor_unitario)}</td>
                    <td><strong style={{ color: 'var(--green)' }}>{fmt.money(c.valor_total)}</strong></td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt.datetime(c.criado_em)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => excluir(c.id)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && typeof modal === 'object' && (
        <ModalConsumo reserva={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
