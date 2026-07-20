import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'
import { runOCR } from '../utils/ocr'
import { fmt, metodoPagMap } from '../utils/format'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

function ModalPagamento({ reserva, onClose, onSave }) {
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocr, setOcr] = useState(null)
  const [form, setForm] = useState({
    reserva_id: reserva.id,
    valor: String(Number(reserva.valor_total) - Number(reserva.valor_pago || 0)),
    metodo: 'pix',
    observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const processarImagem = async (file) => {
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
    setOcrLoading(true)
    try {
      const resultado = await runOCR(file)
      setOcr(resultado)
      if (resultado.valor) set('valor', resultado.valor.toFixed(2))
      // Detectar método de pagamento pelo texto
      const txt = resultado.textoCompleto?.toLowerCase() || ''
      if (txt.includes('pix')) set('metodo', 'pix')
      else if (txt.includes('crédito') || txt.includes('credito')) set('metodo', 'cartao_credito')
      else if (txt.includes('débito') || txt.includes('debito')) set('metodo', 'cartao_debito')
      else if (txt.includes('transfer') || txt.includes('ted') || txt.includes('doc')) set('metodo', 'transferencia')
      toast.success('Comprovante lido com sucesso!')
    } catch {
      toast.error('Não foi possível ler o comprovante. Preencha manualmente.')
    } finally {
      setOcrLoading(false)
    }
  }

  const onDrop = useCallback(files => { if (files[0]) processarImagem(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'application/pdf': [] }, multiple: false })

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) processarImagem(file)
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  const salvar = async () => {
    if (!form.valor || Number(form.valor) <= 0) return toast.error('Informe o valor')
    setLoading(true)
    try {
      let comprovante_url = null
      if (foto) {
        const ext = foto.name?.split('.').pop() || 'jpg'
        const path = `comprovantes/${Date.now()}.${ext}`
        const { data: up } = await supabase.storage.from('comprovantes').upload(path, foto)
        if (up) {
          const { data: url } = supabase.storage.from('comprovantes').getPublicUrl(path)
          comprovante_url = url.publicUrl
        }
      }
      const { error } = await supabase.from('pagamentos').insert({
        ...form, valor: Number(form.valor), status: 'pago',
        pago_em: new Date(), comprovante_url, ocr_dados: ocr
      })
      if (error) throw error

      // Atualizar valor pago na reserva
      const novoPago = Number(reserva.valor_pago || 0) + Number(form.valor)
      const novoStatus = novoPago >= Number(reserva.valor_total) ? 'pago' : 'parcial'
      await supabase.from('reservas').update({ valor_pago: novoPago, status_pagamento: novoStatus }).eq('id', reserva.id)

      toast.success('Pagamento registrado!')
      onSave()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const saldo = Number(reserva.valor_total) - Number(reserva.valor_pago || 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Registrar pagamento</h3>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{reserva.hospedes?.nome} — Quarto #{reserva.quartos?.numero}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: fotoPreview ? '1fr 1fr' : '1fr', gap: 16 }}>
            <div>
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>SALDO A RECEBER</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: saldo > 0 ? 'var(--red)' : 'var(--green)' }}>{fmt.money(saldo)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Total: {fmt.money(reserva.valor_total)} · Pago: {fmt.money(reserva.valor_pago || 0)}</div>
              </div>

              {!fotoPreview ? (
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="dropzone-icon">📎</div>
                  <p>Cole (Ctrl+V), arraste ou clique para anexar comprovante</p>
                  <small>Foto do PIX, cartão, transferência...</small>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={fotoPreview} alt="comprovante" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', maxHeight: 200, objectFit: 'contain', background: 'var(--surface2)' }} />
                  {ocrLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 8, flexDirection: 'column' }}>
                      <div className="spinner"></div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>Lendo comprovante...</span>
                    </div>
                  )}
                  {ocr && !ocrLoading && <div className="alert alert-success" style={{ marginTop: 8 }}>✅ Dados preenchidos automaticamente</div>}
                  <button className="btn btn-danger btn-sm" style={{ marginTop: 6 }} onClick={() => { setFoto(null); setFotoPreview(null); setOcr(null) }}>Remover comprovante</button>
                </div>
              )}
            </div>

            <div>
              <div className="form-group">
                <label>Valor recebido (R$) <span className="req">*</span></label>
                <input type="number" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} style={{ fontSize: 18, fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Método de pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(metodoPagMap).map(([k, v]) => (
                    <div key={k} onClick={() => set('metodo', k)} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${form.metodo === k ? 'var(--accent)' : 'var(--border)'}`, background: form.metodo === k ? 'var(--accent-light)' : 'var(--surface2)', fontSize: 12, fontWeight: form.metodo === k ? 600 : 400, color: form.metodo === k ? 'var(--accent)' : 'var(--text2)', textAlign: 'center', transition: 'all .15s' }}>
                      {k === 'pix' ? '🔑' : k === 'dinheiro' ? '💵' : k === 'cartao_credito' ? '💳' : k === 'cartao_debito' ? '💳' : '🏦'} {v}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={2} placeholder="Número da transação, etc." />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading || ocrLoading}>
            {loading ? <span className="spinner"></span> : '✅ Confirmar pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Pagamentos() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendente')
  const [modal, setModal] = useState(null)
  const [mes, setMes] = useState(dayjs().format('YYYY-MM'))

  const load = async () => {
    setLoading(true)
    let q = supabase.from('reservas')
      .select('*, hospedes(nome, telefone), quartos(numero), pagamentos(*)')
      .in('status', ['confirmada', 'checkin', 'checkout'])
      .order('criado_em', { ascending: false })

    if (filtro === 'pendente') q = q.in('status_pagamento', ['pendente', 'parcial'])
    else if (filtro === 'pago') q = q.eq('status_pagamento', 'pago')

    const inicio = dayjs(mes).startOf('month').toISOString()
    const fim = dayjs(mes).endOf('month').toISOString()
    q = q.gte('criado_em', inicio).lte('criado_em', fim)

    const { data } = await q
    setReservas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filtro, mes])

  const totalRecebido = reservas.reduce((s, r) => s + Number(r.valor_pago || 0), 0)
  const totalPendente = reservas.reduce((s, r) => s + Math.max(0, Number(r.valor_total) - Number(r.valor_pago || 0)), 0)

  return (
    <div>
      <div className="flex-between mb-4">
        <div className="flex gap-2">
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: 'auto' }} />
          <div className="filters-bar" style={{ margin: 0 }}>
            {[{ k: 'todos', l: 'Todos' }, { k: 'pendente', l: 'Pendentes' }, { k: 'pago', l: 'Pagos' }].map(f => (
              <button key={f.k} className={`filter-chip ${filtro === f.k ? 'active' : ''}`} onClick={() => setFiltro(f.k)}>{f.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card"><div className="stat-label">Recebido no mês</div><div className="stat-value stat-green" style={{ fontSize: 20 }}>{fmt.money(totalRecebido)}</div></div>
        <div className="stat-card"><div className="stat-label">A receber</div><div className="stat-value stat-red" style={{ fontSize: 20 }}>{fmt.money(totalPendente)}</div></div>
        <div className="stat-card"><div className="stat-label">Reservas</div><div className="stat-value">{reservas.length}</div></div>
        <div className="stat-card"><div className="stat-label">Pagas integralmente</div><div className="stat-value stat-green">{reservas.filter(r => r.status_pagamento === 'pago').length}</div></div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> :
         reservas.length === 0 ? <div className="empty-state"><div className="empty-icon">💳</div><p>Nenhum recebimento neste período</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Hóspede</th><th>Quarto</th><th>Total</th><th>Pago</th><th>Saldo</th><th>Status</th><th>Comprovantes</th><th>Ações</th></tr></thead>
              <tbody>
                {reservas.map(r => {
                  const saldo = Number(r.valor_total) - Number(r.valor_pago || 0)
                  return (
                    <tr key={r.id}>
                      <td><strong>{r.hospedes?.nome}</strong></td>
                      <td>#{r.quartos?.numero}</td>
                      <td>{fmt.money(r.valor_total)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt.money(r.valor_pago || 0)}</td>
                      <td style={{ color: saldo > 0 ? 'var(--red)' : 'var(--text3)', fontWeight: saldo > 0 ? 600 : 400 }}>{saldo > 0 ? fmt.money(saldo) : '—'}</td>
                      <td>
                        <span className={`badge ${r.status_pagamento === 'pago' ? 'badge-green' : r.status_pagamento === 'parcial' ? 'badge-amber' : 'badge-red'}`}>
                          {r.status_pagamento === 'pago' ? 'Pago' : r.status_pagamento === 'parcial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{r.pagamentos?.length || 0} reg.</span>
                        {r.pagamentos?.some(p => p.comprovante_url) && (
                          <span className="badge badge-blue" style={{ marginLeft: 4 }}>📎</span>
                        )}
                      </td>
                      <td>
                        {saldo > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => setModal(r)}>+ Receber</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ModalPagamento reserva={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
    </div>
  )
}
