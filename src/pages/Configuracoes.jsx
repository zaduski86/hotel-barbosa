import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { Hotel, ShoppingCart, Settings, AlertTriangle, X } from 'lucide-react'

export default function Configuracoes() {
  const [tab, setTab] = useState('hotel')
  const [produtos, setProdutos] = useState([])
  const [loadingProd, setLoadingProd] = useState(true)
  const [modalProd, setModalProd] = useState(null)
  const [hotel, setHotel] = useState({ nome: 'Hotel Barbosa 24 Horas', telefone: '', email: '', endereco: '', cidade: '', cnpj: '', checkin_hora: '14:00', checkout_hora: '12:00' })

  const loadProdutos = async () => {
    setLoadingProd(true)
    const { data } = await supabase.from('produtos_servicos').select('*').order('categoria').order('nome')
    setProdutos(data || [])
    setLoadingProd(false)
  }

  useEffect(() => { if (tab === 'produtos') loadProdutos() }, [tab])

  const salvarHotel = () => {
    localStorage.setItem('hotel_config', JSON.stringify(hotel))
    toast.success('Configurações salvas!')
  }

  useEffect(() => {
    const saved = localStorage.getItem('hotel_config')
    if (saved) setHotel(JSON.parse(saved))
  }, [])

  const toggleProduto = async (p) => {
    await supabase.from('produtos_servicos').update({ ativo: !p.ativo }).eq('id', p.id)
    loadProdutos()
  }

  const excluirProduto = async (id) => {
    if (!confirm('Excluir este produto?')) return
    await supabase.from('produtos_servicos').delete().eq('id', id)
    toast.success('Produto removido')
    loadProdutos()
  }

  return (
    <div>
      <div className="tabs">
        {[{ k: 'hotel', icon: Hotel, l: 'Dados do hotel' }, { k: 'produtos', icon: ShoppingCart, l: 'Produtos e serviços' }, { k: 'sistema', icon: Settings, l: 'Sistema' }].map(t => (
          <div key={t.k} className={`tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>
            <span style={{ display: 'flex', alignItems: 'center' }}><t.icon size={14} style={{ marginRight: 6 }} />{t.l}</span>
          </div>
        ))}
      </div>

      {tab === 'hotel' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Dados do estabelecimento</div></div>
          <div className="form-row form-row-2">
            <div className="form-group"><label>Nome do hotel</label><input value={hotel.nome} onChange={e => setHotel(h => ({ ...h, nome: e.target.value }))} /></div>
            <div className="form-group"><label>CNPJ</label><input value={hotel.cnpj} onChange={e => setHotel(h => ({ ...h, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group"><label>Telefone</label><input value={hotel.telefone} onChange={e => setHotel(h => ({ ...h, telefone: e.target.value }))} /></div>
            <div className="form-group"><label>E-mail</label><input value={hotel.email} onChange={e => setHotel(h => ({ ...h, email: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Endereço</label><input value={hotel.endereco} onChange={e => setHotel(h => ({ ...h, endereco: e.target.value }))} /></div>
          <div className="form-row form-row-2">
            <div className="form-group"><label>Cidade / Estado</label><input value={hotel.cidade} onChange={e => setHotel(h => ({ ...h, cidade: e.target.value }))} /></div>
            <div className="form-row form-row-2">
              <div className="form-group"><label>Horário check-in</label><input type="time" value={hotel.checkin_hora} onChange={e => setHotel(h => ({ ...h, checkin_hora: e.target.value }))} /></div>
              <div className="form-group"><label>Horário check-out</label><input type="time" value={hotel.checkout_hora} onChange={e => setHotel(h => ({ ...h, checkout_hora: e.target.value }))} /></div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={salvarHotel}>Salvar configurações</button>
          </div>
        </div>
      )}

      {tab === 'produtos' && (
        <div>
          <div className="flex-between mb-4">
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{produtos.length} produtos/serviços</span>
            <button className="btn btn-primary" onClick={() => setModalProd('novo')}>+ Novo produto</button>
          </div>
          <div className="card">
            {loadingProd ? <div className="loading-center"><div className="spinner"></div></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nome</th><th>Categoria</th><th>Preço</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead>
                  <tbody>
                    {produtos.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.nome}</strong></td>
                        <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{p.categoria}</span></td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt.money(p.preco)}</td>
                        <td style={{ color: 'var(--text3)' }}>{p.unidade}</td>
                        <td><span className={`badge ${p.ativo ? 'badge-green' : 'badge-gray'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => setModalProd(p)}>Editar</button>
                            <button className="btn btn-warning btn-sm" onClick={() => toggleProduto(p)}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => excluirProduto(p.id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {modalProd && <ModalProduto produto={modalProd === 'novo' ? null : modalProd} onClose={() => setModalProd(null)} onSave={() => { setModalProd(null); loadProdutos() }} />}
        </div>
      )}

      {tab === 'sistema' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Informações do sistema</div>
            <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              {[
                ['Versão', '1.0.0'],
                ['Banco de dados', 'Supabase PostgreSQL'],
                ['Deploy', 'Vercel'],
                ['OCR', 'Tesseract.js + Claude API'],
              ].map(([k, v]) => (
                <div key={k} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)' }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}><AlertTriangle size={16} style={{ marginRight: 6 }} color="var(--red)" />Zona de risco</div>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>Ações irreversíveis. Use com cuidado.</p>
            <button className="btn btn-danger" onClick={() => { if (confirm('Limpar dados de teste? Esta ação não pode ser desfeita!')) toast.error('Função disponível apenas para administradores') }}>
              Limpar dados de teste
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalProduto({ produto, onClose, onSave }) {
  const [form, setForm] = useState(produto || { nome: '', categoria: 'outros', preco: '', unidade: 'unidade' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const salvar = async () => {
    if (!form.nome || !form.preco) return toast.error('Nome e preço são obrigatórios')
    setLoading(true)
    const fn = produto ? supabase.from('produtos_servicos').update({ ...form, preco: Number(form.preco) }).eq('id', produto.id) : supabase.from('produtos_servicos').insert({ ...form, preco: Number(form.preco) })
    const { error } = await fn
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Produto salvo!')
    setLoading(false); onSave()
  }

  const categorias = ['alimentacao', 'frigobar', 'lavanderia', 'servicos', 'enxoval', 'outros']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{produto ? 'Editar produto' : 'Novo produto'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button></div>
        <div className="modal-body">
          <div className="form-group"><label>Nome <span className="req">*</span></label><input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Água mineral 500ml" /></div>
          <div className="form-row form-row-2">
            <div className="form-group"><label>Preço (R$) <span className="req">*</span></label><input type="number" step="0.01" value={form.preco} onChange={e => set('preco', e.target.value)} /></div>
            <div className="form-group"><label>Unidade</label><input value={form.unidade} onChange={e => set('unidade', e.target.value)} placeholder="unidade, kg, hora..." /></div>
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
              {categorias.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
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
