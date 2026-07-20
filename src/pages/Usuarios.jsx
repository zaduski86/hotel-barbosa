import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const permissoesPadrao = {
  gestor: { reservas: true, hospedes: true, quartos: true, financeiro: true, configuracoes: true, usuarios: true },
  recepcionista: { reservas: true, hospedes: true, quartos: false, financeiro: false, configuracoes: false, usuarios: false }
}

function ModalCredenciais({ usuario, onClose }) {
  const texto = `🏨 Hotel Barbosa 24 Horas\n\nOlá ${usuario.nome}! Seu acesso ao sistema foi criado.\n\n📧 E-mail: ${usuario.email}\n🔑 Senha: ${usuario.senha_temp}\n👤 Cargo: ${usuario.cargo === 'gestor' ? 'Gestor' : 'Recepcionista'}\n\n🔗 Acesse em: ${window.location.origin}\n\nPor segurança, altere sua senha no primeiro acesso.`

  const copiar = () => {
    navigator.clipboard.writeText(texto)
    toast.success('Copiado!')
  }

  const whatsapp = () => {
    const num = usuario.telefone?.replace(/\D/g, '')
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h3>✅ Usuário criado com sucesso!</h3>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Envie as credenciais para {usuario.nome}</div>
          </div>
        </div>
        <div className="modal-body">
          <div className="credenciais-box">
            <div>🏨 <strong>Hotel Barbosa 24 Horas</strong></div>
            <div style={{ marginTop: 8, lineHeight: 1.9 }}>
              <div>📧 <strong>E-mail:</strong> {usuario.email}</div>
              <div>🔑 <strong>Senha:</strong> <span style={{ background: 'var(--accent-light)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)' }}>{usuario.senha_temp}</span></div>
              <div>👤 <strong>Cargo:</strong> {usuario.cargo === 'gestor' ? 'Gestor' : 'Recepcionista'}</div>
              <div>🔗 <strong>Acesso:</strong> {window.location.origin}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn btn-secondary w-full" onClick={copiar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copiar texto
            </button>
            {usuario.telefone && (
              <button className="btn btn-success w-full" onClick={whatsapp}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                Enviar WhatsApp
              </button>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Concluir</button>
        </div>
      </div>
    </div>
  )
}

function ModalUsuario({ usuario, onClose, onSave }) {
  const [form, setForm] = useState(usuario || { nome: '', email: '', telefone: '', cargo: 'recepcionista', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const salvar = async () => {
    if (!form.nome || !form.email) return setErro('Nome e e-mail são obrigatórios')
    if (!usuario && !form.senha) return setErro('Senha é obrigatória')
    setErro(''); setLoading(true)

    try {
      if (usuario) {
        const { error } = await supabase.from('usuarios').update({
          nome: form.nome, telefone: form.telefone, cargo: form.cargo,
          permissoes: permissoesPadrao[form.cargo]
        }).eq('id', usuario.id)
        if (error) throw error
        toast.success('Usuário atualizado!')
        onSave()
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: form.email, password: form.senha, email_confirm: true
        }).catch(() => ({ data: null, error: { message: 'Use o Supabase Dashboard para criar o auth user primeiro' } }))

        const { error } = await supabase.from('usuarios').insert({
          nome: form.nome, email: form.email, telefone: form.telefone,
          cargo: form.cargo, permissoes: permissoesPadrao[form.cargo],
          auth_id: authData?.user?.id
        })
        if (error) throw error
        toast.success('Usuário criado!')
        onSave({ ...form, senha_temp: form.senha })
      }
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{usuario ? 'Editar usuário' : 'Novo usuário'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}

          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Nome completo <span className="req">*</span></label>
              <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Maria Silva" />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="form-group">
            <label>E-mail <span className="req">*</span></label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" disabled={!!usuario} />
          </div>

          {!usuario && (
            <div className="form-group">
              <label>Senha inicial <span className="req">*</span></label>
              <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          )}

          <div className="form-group">
            <label>Tipo de acesso <span className="req">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              {[
                { key: 'recepcionista', label: 'Recepcionista', desc: 'Reservas e hóspedes', icon: '👤' },
                { key: 'gestor', label: 'Gestor', desc: 'Acesso completo', icon: '👑' },
              ].map(tipo => (
                <div
                  key={tipo.key}
                  onClick={() => set('cargo', tipo.key)}
                  style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${form.cargo === tipo.key ? 'var(--accent)' : 'var(--border)'}`, background: form.cargo === tipo.key ? 'var(--accent-light)' : 'var(--surface2)', transition: 'all .15s' }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{tipo.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.cargo === tipo.key ? 'var(--accent)' : 'var(--text)' }}>{tipo.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{tipo.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Permissões do cargo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(permissoesPadrao[form.cargo] || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: v ? 'var(--green)' : 'var(--text3)' }}>{v ? '✓' : '✗'}</span>
                  <span style={{ color: v ? 'var(--text)' : 'var(--text3)', textTransform: 'capitalize' }}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>
            {loading ? <span className="spinner"></span> : usuario ? 'Salvar' : 'Criar usuário'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [credenciais, setCredenciais] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('criado_em', { ascending: false })
    setUsuarios(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = (novoUsuario) => {
    setModal(null)
    load()
    if (novoUsuario?.senha_temp) setCredenciais(novoUsuario)
  }

  const toggleAtivo = async (u) => {
    await supabase.from('usuarios').update({ ativo: !u.ativo }).eq('id', u.id)
    load()
  }

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{usuarios.length} usuário(s) cadastrado(s)</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('novo')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo usuário
        </button>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : usuarios.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👤</div><p>Nenhum usuário cadastrado</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Nome</th><th>E-mail</th><th>Telefone</th><th>Cargo</th><th>Status</th><th>Ações</th>
              </tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                          {u.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <strong>{u.nome}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.telefone || '—'}</td>
                    <td>
                      <span className={`badge ${u.cargo === 'gestor' ? 'badge-purple' : 'badge-blue'}`}>
                        {u.cargo === 'gestor' ? '👑 Gestor' : '👤 Recepcionista'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.ativo ? 'badge-green' : 'badge-gray'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(u)}>Editar</button>
                        <button className={`btn btn-sm ${u.ativo ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleAtivo(u)}>
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ModalUsuario usuario={modal === 'novo' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      {credenciais && <ModalCredenciais usuario={credenciais} onClose={() => setCredenciais(null)} />}
    </div>
  )
}
