import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'
import { runOCR } from '../utils/ocr'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { X, Camera, CheckCircle2, Check, Plus, Wallet } from 'lucide-react'

const categorias = ['alimentacao', 'limpeza', 'utilidades', 'manutencao', 'servicos', 'administrativo', 'outros']

function ModalGasto({ onClose, onSave }) {
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [ocr, setOcr] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: 'outros', fornecedor: '', data_gasto: dayjs().format('YYYY-MM-DD') })
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
      if (resultado.data) set('data_gasto', resultado.data)
      if (resultado.fornecedor) set('fornecedor', resultado.fornecedor)
      if (resultado.categoria) set('categoria', resultado.categoria)
      if (resultado.fornecedor) set('descricao', resultado.fornecedor)
      toast.success(`OCR leu a imagem via ${resultado.fonte === 'claude' ? 'IA (Claude)' : 'Tesseract'}`)
    } catch (e) {
      toast.error('Não foi possível ler a imagem. Preencha manualmente.')
    } finally {
      setOcrLoading(false)
    }
  }

  const onDrop = useCallback(files => { if (files[0]) processarImagem(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false })

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
    if (!form.descricao || !form.valor) return toast.error('Descrição e valor são obrigatórios')
    setLoading(true)
    try {
      let foto_url = null
      if (foto) {
        const ext = foto.name?.split('.').pop() || 'jpg'
        const path = `gastos/${Date.now()}.${ext}`
        const { data: up } = await supabase.storage.from('gastos-fotos').upload(path, foto)
        if (up) {
          const { data: url } = supabase.storage.from('gastos-fotos').getPublicUrl(path)
          foto_url = url.publicUrl
        }
      }
      const { error } = await supabase.from('gastos').insert({
        ...form, valor: Number(form.valor), foto_url, ocr_dados: ocr
      })
      if (error) throw error
      toast.success('Gasto registrado!')
      onSave()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar gasto</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: fotoPreview ? '1fr 1fr' : '1fr', gap: 16 }}>
            <div>
              {!fotoPreview ? (
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="dropzone-icon"><Camera size={28} color="var(--text3)" style={{marginBottom:8}} /></div>
                  <p>Cole a foto aqui (Ctrl+V), arraste ou clique</p>
                  <small>Nota fiscal, cupom, comprovante...</small>
                  {ocrLoading && <div style={{ marginTop: 10 }}><div className="spinner"></div></div>}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={fotoPreview} alt="nota" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
                  <button className="btn btn-danger btn-sm" style={{ position: 'absolute', top: 6, right: 6 }} onClick={() => { setFoto(null); setFotoPreview(null); setOcr(null) }}><X size={12} /> Remover</button>
                  {ocrLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, flexDirection: 'column', gap: 8 }}>
                      <div className="spinner"></div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>Lendo a imagem...</span>
                    </div>
                  )}
                  {ocr && !ocrLoading && (
                    <div className="ocr-result">
                      <div className="ocr-label"><CheckCircle2 size={16} style={{marginRight:6}} />Lido via OCR — confirme os dados abaixo</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="form-group">
                <label>Descrição <span className="req">*</span></label>
                <input value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Compras no mercado" />
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label>Valor (R$) <span className="req">*</span></label>
                  <input type="number" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input type="date" value={form.data_gasto} onChange={e => set('data_gasto', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Fornecedor</label>
                <input value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} placeholder="Nome do estabelecimento" />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  {categorias.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading || ocrLoading}>
            {loading ? <span className="spinner"></span> : <><Check size={14} style={{marginRight:6}} />Confirmar e salvar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Gastos() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filtro, setFiltro] = useState({ mes: dayjs().format('YYYY-MM'), categoria: '' })

  const load = async () => {
    setLoading(true)
    const inicio = dayjs(filtro.mes).startOf('month').toISOString()
    const fim = dayjs(filtro.mes).endOf('month').toISOString()
    let q = supabase.from('gastos').select('*').gte('criado_em', inicio).lte('criado_em', fim).order('criado_em', { ascending: false })
    if (filtro.categoria) q = q.eq('categoria', filtro.categoria)
    const { data } = await q
    setGastos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filtro])

  const total = gastos.reduce((s, g) => s + Number(g.valor), 0)

  const porCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = gastos.filter(g => g.categoria === cat).reduce((s, g) => s + Number(g.valor), 0)
    return acc
  }, {})

  return (
    <div>
      <div className="flex-between mb-4">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="month" value={filtro.mes} onChange={e => setFiltro(f => ({ ...f, mes: e.target.value }))} style={{ width: 'auto' }} />
          <select value={filtro.categoria} onChange={e => setFiltro(f => ({ ...f, categoria: e.target.value }))} style={{ width: 'auto' }}>
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={14} style={{marginRight:6}} />
          Registrar gasto
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Total do mês</div>
          <div className="stat-value stat-red" style={{ fontSize: 22 }}>{fmt.money(total)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lançamentos</div>
          <div className="stat-value">{gastos.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Maior gasto</div>
          <div className="stat-value stat-amber" style={{ fontSize: 18 }}>{fmt.money(Math.max(...gastos.map(g => Number(g.valor)), 0))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Média por dia</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmt.money(total / dayjs(filtro.mes).daysInMonth())}</div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : gastos.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Wallet size={40} color="var(--text3)" strokeWidth={1.5} /></div><p>Nenhum gasto registrado neste período</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Foto</th><th>Descrição</th><th>Fornecedor</th><th>Categoria</th><th>Data</th><th>Valor</th>
              </tr></thead>
              <tbody>
                {gastos.map(g => (
                  <tr key={g.id}>
                    <td>
                      {g.foto_url ? (
                        <img src={g.foto_url} alt="" style={{ width: 40, height: 32, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td><strong>{g.descricao}</strong></td>
                    <td style={{ color: 'var(--text2)' }}>{g.fornecedor || '—'}</td>
                    <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{g.categoria}</span></td>
                    <td>{fmt.date(g.data_gasto)}</td>
                    <td><strong style={{ color: 'var(--red)' }}>{fmt.money(g.valor)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ModalGasto onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />}
    </div>
  )
}
