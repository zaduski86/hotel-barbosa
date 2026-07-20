import { useState, useEffect } from 'react'
import { Link, ClipboardList, X, Download, MessageCircle, Check, User, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmt, statusReservaMap, tipoQuartoMap, metodoPagMap } from '../utils/format'
import { gerarLinkWhatsApp, gerarReciboPDF } from '../utils/pdf'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ======================== RESERVAS ========================
export function Reservas() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [modal, setModal] = useState(null)
  const [modalLink, setModalLink] = useState(false)

  const load = async () => {
    setLoading(true)
    let q = supabase.from('reservas').select('*, hospedes(*), quartos(*)').order('criado_em', { ascending: false })
    if (filtro !== 'todas') q = q.eq('status', filtro)
    const { data } = await q
    setReservas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filtro])

  return (
    <div>
      <div className="flex-between mb-4">
        <div className="filters-bar" style={{ margin: 0 }}>
          {['todas','confirmada','checkin','pre_reserva','checkout','cancelada'].map(s => (
            <button key={s} className={`filter-chip ${filtro === s ? 'active' : ''}`} onClick={() => setFiltro(s)}>
              {s === 'todas' ? 'Todas' : statusReservaMap[s]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setModalLink(true)}>
            <Link size={14} style={{marginRight:6}} />Reserva por link
          </button>
          <button className="btn btn-primary" onClick={() => setModal('nova')}>+ Nova reserva</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> :
        reservas.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={40} color="var(--text3)" strokeWidth={1.5} /></div><p>Nenhuma reserva encontrada</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Hóspede</th><th>Quarto</th><th>Entrada</th><th>Saída</th><th>Total</th><th>Status</th><th>Pag.</th><th>Ações</th></tr></thead>
              <tbody>
                {reservas.map(r => {
                  const s = statusReservaMap[r.status]
                  return (
                    <tr key={r.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.codigo}</span></td>
                      <td><strong>{r.hospedes?.nome}</strong><div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.hospedes?.telefone}</div></td>
                      <td>#{r.quartos?.numero}</td>
                      <td>{fmt.date(r.data_entrada)}</td>
                      <td>{fmt.date(r.data_saida)}</td>
                      <td><strong>{fmt.money(r.valor_total)}</strong></td>
                      <td><span className={`badge ${s?.badge}`}>{s?.label}</span></td>
                      <td><span className={`badge ${r.status_pagamento === 'pago' ? 'badge-green' : r.status_pagamento === 'parcial' ? 'badge-amber' : 'badge-red'}`}>{r.status_pagamento}</span></td>
                      <td>
                        <div className="flex gap-2">
                          {r.status === 'confirmada' && <button className="btn btn-success btn-sm" onClick={async () => { await supabase.from('reservas').update({ status: 'checkin', checkin_em: new Date() }).eq('id', r.id); load(); toast.success('Check-in realizado!') }}>Check-in</button>}
                          {r.status === 'checkin' && <button className="btn btn-secondary btn-sm" onClick={() => setModal({ ...r, tipo: 'checkout' })}>Check-out</button>}
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(r)}>Ver</button>
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

      {modal === 'nova' && <ModalNovaReserva onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
      {modal && typeof modal === 'object' && modal.tipo === 'checkout' && <ModalCheckout reserva={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
      {modal && typeof modal === 'object' && modal.tipo !== 'checkout' && <ModalDetalhesReserva reserva={modal} onClose={() => setModal(null)} />}
      {modalLink && <ModalReservaLink onClose={() => setModalLink(false)} />}
    </div>
  )
}

export function ModalNovaReserva({ quartoInicial, onClose, onSave }) {
  const [form, setForm] = useState({ quarto_id: quartoInicial?.id || '', hospede_id: '', data_entrada: '', data_saida: '', observacoes: '' })
  const [quartos, setQuartos] = useState([])
  const [hospedes, setHospedes] = useState([])
  const [busca, setBusca] = useState('')
  const [total, setTotal] = useState({ diarias: 0, valor: 0, diaria: 0 })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('quartos').select('*').eq('status', 'disponivel').eq('ativo', true).then(({ data }) => setQuartos(data || []))
  }, [])

  useEffect(() => {
    if (busca.length < 2) return
    supabase.from('hospedes').select('*').or(`nome.ilike.%${busca}%,cpf.ilike.%${busca}%`).limit(5).then(({ data }) => setHospedes(data || []))
  }, [busca])

  useEffect(() => {
    if (form.data_entrada && form.data_saida && form.quarto_id) {
      const diarias = dayjs(form.data_saida).diff(dayjs(form.data_entrada), 'day')
      const quarto = quartos.find(q => q.id === form.quarto_id)
      const diaria = Number(quarto?.preco_diaria || 0)
      setTotal({ diarias, valor: diarias * diaria, diaria })
    }
  }, [form.data_entrada, form.data_saida, form.quarto_id, quartos])

  const salvar = async () => {
    if (!form.quarto_id || !form.hospede_id || !form.data_entrada || !form.data_saida) return toast.error('Preencha todos os campos')
    setLoading(true)
    const { error } = await supabase.from('reservas').insert({ ...form, total_diarias: total.diarias, valor_diaria: total.diaria, valor_total: total.valor, status: 'confirmada' })
    if (error) { toast.error(error.message); setLoading(false); return }
    await supabase.from('quartos').update({ status: 'ocupado' }).eq('id', form.quarto_id)
    toast.success('Reserva criada!')
    setLoading(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Nova reserva</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="form-group">
            <label>Hóspede <span className="req">*</span></label>
            <input placeholder="Buscar por nome ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} />
            {hospedes.length > 0 && !form.hospede_id && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                {hospedes.map(h => (
                  <div key={h.id} onClick={() => { setForm(f => ({ ...f, hospede_id: h.id })); setBusca(h.nome); setHospedes([]) }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <strong>{h.nome}</strong> <span style={{ color: 'var(--text3)' }}>— {fmt.cpf(h.cpf)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Quarto <span className="req">*</span></label>
            <select value={form.quarto_id} onChange={e => set('quarto_id', e.target.value)}>
              <option value="">Selecionar quarto disponível...</option>
              {quartos.map(q => <option key={q.id} value={q.id}>#{q.numero} — {tipoQuartoMap[q.tipo]} — {fmt.money(q.preco_diaria)}/noite</option>)}
            </select>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group"><label>Check-in <span className="req">*</span></label><input type="date" value={form.data_entrada} onChange={e => set('data_entrada', e.target.value)} /></div>
            <div className="form-group"><label>Check-out <span className="req">*</span></label><input type="date" value={form.data_saida} onChange={e => set('data_saida', e.target.value)} /></div>
          </div>
          {total.diarias > 0 && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{total.diarias} diária(s) × {fmt.money(total.diaria)}</span>
              <strong style={{ fontSize: 18, color: 'var(--green)' }}>{fmt.money(total.valor)}</strong>
            </div>
          )}
          <div className="form-group"><label>Observações</label><textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Pedidos especiais..." rows={2} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? <span className="spinner"></span> : 'Confirmar reserva'}</button>
        </div>
      </div>
    </div>
  )
}

export function ModalCheckout({ reserva, onClose, onSave }) {
  const [consumos, setConsumos] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [itensRemovidos, setItensRemovidos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('consumos').select('*').eq('reserva_id', reserva.id).then(({ data }) => setConsumos(data || []))
    supabase.from('pagamentos').select('*').eq('reserva_id', reserva.id).then(({ data }) => setPagamentos(data || []))
  }, [])

  const consumosVisiveis = consumos.filter(c => !itensRemovidos.includes(c.id))
  const totalConsumos = consumosVisiveis.reduce((s, c) => s + Number(c.valor_total), 0)
  const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0)
  const totalGeral = Number(reserva.valor_total) + totalConsumos
  const saldo = totalGeral - totalPago

  const confirmar = async () => {
    setLoading(true)
    await supabase.from('reservas').update({ status: 'checkout', checkout_em: new Date() }).eq('id', reserva.id)
    await supabase.from('quartos').update({ status: 'limpeza' }).eq('id', reserva.quarto_id)
    toast.success('Check-out realizado! Quarto em limpeza.')
    setLoading(false)
    onSave()
  }

  const enviarPDF = async (via) => {
    const doc = gerarReciboPDF(reserva, consumosVisiveis, pagamentos)
    if (via === 'download') { doc.save(`recibo-${reserva.codigo}.pdf`); return }
    if (via === 'whatsapp') {
      doc.save(`recibo-${reserva.codigo}.pdf`)
      const link = gerarLinkWhatsApp(reserva.hospedes?.telefone, reserva)
      window.open(link, '_blank')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Check-out — {reserva.hospedes?.nome}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="alert alert-info">Revise o resumo abaixo. Remova itens que não devem ser cobrados antes de finalizar.</div>

          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div className="flex-between"><span>Hospedagem ({reserva.total_diarias} noites)</span><strong>{fmt.money(reserva.valor_total)}</strong></div>
          </div>

          {consumosVisiveis.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8 }}>CONSUMOS</div>
              {consumosVisiveis.map(c => (
                <div key={c.id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span>{c.nome_item} × {c.quantidade}</span>
                  <div className="flex gap-2">
                    <strong>{fmt.money(c.valor_total)}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => setItensRemovidos(prev => [...prev, c.id])} style={{ padding: '2px 6px', fontSize: 11 }}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, marginTop: 14 }}>
            <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Total geral</span><strong style={{ fontSize: 16 }}>{fmt.money(totalGeral)}</strong></div>
            <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Pago</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt.money(totalPago)}</span></div>
            {saldo > 0 && <div className="flex-between"><span style={{ color: 'var(--red)', fontWeight: 600 }}>Saldo devedor</span><strong style={{ color: 'var(--red)', fontSize: 16 }}>{fmt.money(saldo)}</strong></div>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary w-full" onClick={() => enviarPDF('download')}><Download size={14} style={{marginRight:6}} />Baixar PDF</button>
            <button className="btn btn-success w-full" onClick={() => enviarPDF('whatsapp')}><MessageCircle size={14} style={{marginRight:6}} />WhatsApp</button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={confirmar} disabled={loading}>{loading ? <span className="spinner"></span> : <><Check size={14} style={{marginRight:6}} />Confirmar check-out</>}</button>
        </div>
      </div>
    </div>
  )
}

export function ModalDetalhesReserva({ reserva, onClose }) {
  const s = statusReservaMap[reserva.status]
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Reserva {reserva.codigo || ''}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Hóspede</span><strong>{reserva.hospedes?.nome || '—'}</strong></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Telefone</span><span>{reserva.hospedes?.telefone || '—'}</span></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Quarto</span><span>#{reserva.quartos?.numero || '—'}</span></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Check-in</span><span>{fmt.date(reserva.data_entrada)}</span></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Check-out</span><span>{fmt.date(reserva.data_saida)}</span></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Diárias</span><span>{reserva.total_diarias} × {fmt.money(reserva.valor_diaria)}</span></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Total</span><strong>{fmt.money(reserva.valor_total)}</strong></div>
          <div className="flex-between mb-2"><span style={{ color: 'var(--text2)' }}>Status</span><span className={`badge ${s?.badge}`}>{s?.label}</span></div>
          <div className="flex-between"><span style={{ color: 'var(--text2)' }}>Pagamento</span><span className={`badge ${reserva.status_pagamento === 'pago' ? 'badge-green' : reserva.status_pagamento === 'parcial' ? 'badge-amber' : 'badge-red'}`}>{reserva.status_pagamento}</span></div>
          {reserva.observacoes && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text2)' }}><strong>Observações:</strong> {reserva.observacoes}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}

function ModalReservaLink({ onClose }) {
  const [telefone, setTelefone] = useState('')
  const [link, setLink] = useState('')

  const gerar = () => {
    const token = Math.random().toString(36).slice(2, 10)
    const url = `${window.location.origin}/reserva/${token}`
    setLink(url)
    supabase.from('reservas').insert({ token_link: token, status: 'pre_reserva', origem: 'link', data_entrada: dayjs().format('YYYY-MM-DD'), data_saida: dayjs().add(1,'day').format('YYYY-MM-DD'), total_diarias: 1, valor_diaria: 0, valor_total: 0 })
  }

  const enviar = () => {
    const num = telefone.replace(/\D/g, '')
    const msg = encodeURIComponent(`Olá! Segue o link para você fazer sua reserva no Hotel Barbosa 24 Horas:\n\n${link}\n\nPreencha seus dados e escolha o quarto. Qualquer dúvida, estamos à disposição! 🏨`)
    window.open(`https://wa.me/55${num}?text=${msg}`, '_blank')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Solicitar reserva por link</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="form-group">
            <label>Telefone do cliente</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          {!link ? (
            <button className="btn btn-primary w-full" onClick={gerar}>Gerar link de reserva</button>
          ) : (
            <div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12, wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace' }}>{link}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary w-full" onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado!') }}>Copiar link</button>
                {telefone && <button className="btn btn-success w-full" onClick={enviar}><MessageCircle size={14} style={{marginRight:6}} />Enviar WhatsApp</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ======================== HOSPEDES ========================
export function Hospedes() {
  const [hospedes, setHospedes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(null)

  const load = async () => {
    setLoading(true)
    let q = supabase.from('hospedes').select('*, reservas(count)').order('nome')
    if (busca) q = q.or(`nome.ilike.%${busca}%,cpf.ilike.%${busca}%,email.ilike.%${busca}%`)
    const { data } = await q
    setHospedes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [busca])

  return (
    <div>
      <div className="flex-between mb-4">
        <div style={{position:'relative'}}>
          <Search size={14} color="var(--text3)" style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)'}} />
          <input placeholder="Buscar por nome, CPF ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 320, paddingLeft: 32 }} />
        </div>
        <button className="btn btn-primary" onClick={() => setModal('novo')}>+ Novo hóspede</button>
      </div>
      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : hospedes.length === 0 ? <div className="empty-state"><div className="empty-icon"><User size={40} color="var(--text3)" strokeWidth={1.5} /></div><p>Nenhum hóspede encontrado</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>Ações</th></tr></thead>
              <tbody>
                {hospedes.map(h => (
                  <tr key={h.id}>
                    <td><strong>{h.nome}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{fmt.cpf(h.cpf)}</td>
                    <td>{h.telefone || '—'}</td>
                    <td>{h.email || '—'}</td>
                    <td>{h.cidade ? `${h.cidade}/${h.estado}` : '—'}</td>
                    <td><div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(h)}>Editar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && <ModalHospede hospede={modal === 'novo' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
    </div>
  )
}

function ModalHospede({ hospede, onClose, onSave }) {
  const [form, setForm] = useState(hospede || { nome: '', cpf: '', rg: '', profissao: '', data_nascimento: '', email: '', telefone: '', cep: '', endereco: '', numero_end: '', bairro: '', cidade: '', estado: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const buscarCep = async () => {
    if (form.cep?.length < 8) return
    const r = await fetch(`https://viacep.com.br/ws/${form.cep.replace(/\D/g,'')}/json/`)
    const d = await r.json()
    if (!d.erro) setForm(f => ({ ...f, endereco: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }))
  }

  const salvar = async () => {
    if (!form.nome) return toast.error('Nome é obrigatório')
    setLoading(true)
    const fn = hospede ? supabase.from('hospedes').update(form).eq('id', hospede.id) : supabase.from('hospedes').insert(form)
    const { error } = await fn
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success(hospede ? 'Hóspede atualizado!' : 'Hóspede cadastrado!')
    setLoading(false); onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{hospede ? 'Editar hóspede' : 'Novo hóspede'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="form-row form-row-3">
            <div className="form-group" style={{ gridColumn: '1/3' }}><label>Nome completo <span className="req">*</span></label><input value={form.nome} onChange={e => set('nome', e.target.value)} /></div>
            <div className="form-group"><label>Data de nascimento</label><input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} /></div>
          </div>
          <div className="form-row form-row-3">
            <div className="form-group"><label>CPF</label><input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" /></div>
            <div className="form-group"><label>RG</label><input value={form.rg} onChange={e => set('rg', e.target.value)} /></div>
            <div className="form-group"><label>Profissão</label><input value={form.profissao || ''} onChange={e => set('profissao', e.target.value)} /></div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group"><label>E-mail</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Telefone</label><input value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div>
          </div>
          <div className="divider" />
          <div className="form-row form-row-3">
            <div className="form-group"><label>CEP</label><input value={form.cep} onChange={e => set('cep', e.target.value)} onBlur={buscarCep} placeholder="00000-000" /></div>
            <div className="form-group" style={{ gridColumn: '2/4' }}><label>Endereço</label><input value={form.endereco} onChange={e => set('endereco', e.target.value)} /></div>
          </div>
          <div className="form-row form-row-3">
            <div className="form-group"><label>Número</label><input value={form.numero_end} onChange={e => set('numero_end', e.target.value)} /></div>
            <div className="form-group"><label>Bairro</label><input value={form.bairro} onChange={e => set('bairro', e.target.value)} /></div>
            <div className="form-group"><label>Cidade / UF</label><div className="flex gap-2"><input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" /><input value={form.estado} onChange={e => set('estado', e.target.value)} placeholder="UF" style={{ width: 60 }} /></div></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? <span className="spinner"></span> : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// ======================== PLACEHOLDERS ========================
const Placeholder = ({ titulo, icone }) => (
  <div className="card" style={{ textAlign: 'center', padding: 48 }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icone}</div>
    <h3 style={{ marginBottom: 8 }}>{titulo}</h3>
    <p style={{ color: 'var(--text3)' }}>Esta seção está em desenvolvimento</p>
  </div>
)

export function Quartos() { return <QuartosPage /> }


// ======================== QUARTOS ========================
function QuartosPage() {
  const [quartos, setQuartos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('quartos').select('*, quarto_fotos(*)').order('ordem')
    setQuartos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex-between mb-4">
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{quartos.length} quartos cadastrados</span>
        <button className="btn btn-primary" onClick={() => setModal('novo')}>+ Novo quarto</button>
      </div>
      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nº</th><th>Nome</th><th>Tipo</th><th>Andar</th><th>Cap.</th><th>Diária</th><th>Fotos</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {quartos.map(q => (
                  <tr key={q.id}>
                    <td><strong>#{q.numero}</strong></td>
                    <td>{q.nome}</td>
                    <td><span className="badge badge-blue">{tipoQuartoMap[q.tipo]}</span></td>
                    <td>{q.andar}º</td>
                    <td>{q.capacidade} pax</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt.money(q.preco_diaria)}</td>
                    <td><span className="badge badge-gray">{q.quarto_fotos?.length || 0} fotos</span></td>
                    <td><span className={`badge ${q.ativo ? 'badge-green' : 'badge-gray'}`}>{q.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td><div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(q)}>Editar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && <ModalQuarto quarto={modal === 'novo' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
    </div>
  )
}

function ModalQuarto({ quarto, onClose, onSave }) {
  const [form, setForm] = useState(quarto || { numero: '', nome: '', tipo: 'duplo', andar: '1', capacidade: '2', preco_diaria: '', descricao: '' })
  const [fotos, setFotos] = useState(quarto?.quarto_fotos || [])
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onDropFoto = useCallback(async (files) => {
    if (!quarto?.id) return toast.error('Salve o quarto primeiro para adicionar fotos')
    for (const file of files) {
      const path = `quartos/${quarto.id}/${Date.now()}-${file.name}`
      await supabase.storage.from('quartos-fotos').upload(path, file)
      const { data: url } = supabase.storage.from('quartos-fotos').getPublicUrl(path)
      await supabase.from('quarto_fotos').insert({ quarto_id: quarto.id, url: url.publicUrl, ordem: fotos.length })
    }
    const { data } = await supabase.from('quarto_fotos').select('*').eq('quarto_id', quarto.id)
    setFotos(data || [])
    toast.success('Fotos adicionadas!')
  }, [quarto, fotos])

  const { getRootProps, getInputProps } = useDropzone({ onDrop: onDropFoto, accept: { 'image/*': [] } })

  const removerFoto = async (foto) => {
    await supabase.from('quarto_fotos').delete().eq('id', foto.id)
    setFotos(f => f.filter(x => x.id !== foto.id))
  }

  const salvar = async () => {
    setLoading(true)
    const fn = quarto ? supabase.from('quartos').update({ ...form, andar: Number(form.andar), capacidade: Number(form.capacidade), preco_diaria: Number(form.preco_diaria) }).eq('id', quarto.id) : supabase.from('quartos').insert({ ...form, andar: Number(form.andar), capacidade: Number(form.capacidade), preco_diaria: Number(form.preco_diaria) })
    const { error } = await fn
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Quarto salvo!')
    setLoading(false); onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{quarto ? `Editar quarto #${quarto.numero}` : 'Novo quarto'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="form-row form-row-2">
            <div className="form-group"><label>Número <span className="req">*</span></label><input value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="101" /></div>
            <div className="form-group"><label>Nome</label><input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Quarto 101" /></div>
          </div>
          <div className="form-row form-row-3">
            <div className="form-group"><label>Tipo</label><select value={form.tipo} onChange={e => set('tipo', e.target.value)}>{Object.entries(tipoQuartoMap).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="form-group"><label>Andar</label><input type="number" value={form.andar} onChange={e => set('andar', e.target.value)} /></div>
            <div className="form-group"><label>Capacidade</label><input type="number" value={form.capacidade} onChange={e => set('capacidade', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Preço da diária (R$) <span className="req">*</span></label><input type="number" step="0.01" value={form.preco_diaria} onChange={e => set('preco_diaria', e.target.value)} /></div>
          <div className="form-group"><label>Descrição</label><textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={2} /></div>

          {quarto && (
            <div>
              <div className="divider" />
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Fotos do quarto</div>
              <div className="photo-grid" style={{ marginBottom: 12 }}>
                {fotos.map(f => (
                  <div key={f.id} className="photo-item">
                    <img src={f.url} alt="" />
                    <div className="photo-item-overlay">
                      <button className="btn btn-danger btn-sm" onClick={() => removerFoto(f)}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
              <div {...getRootProps()} className="dropzone" style={{ padding: '16px 12px' }}>
                <input {...getInputProps()} />
                <p style={{ fontSize: 12 }}>Clique ou arraste fotos para adicionar</p>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? <span className="spinner"></span> : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

import { useCallback } from 'react'
