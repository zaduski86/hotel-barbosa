import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const entrar = async (e) => {
    e.preventDefault(); setErro(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos')
    setLoading(false)
  }

  const inp = { width:'100%', padding:'11px 12px 11px 30px', boxSizing:'border-box', border:'none', borderBottom:'1px solid #d3c49a', borderRadius:0, background:'transparent', fontSize:12, letterSpacing:1, color:'#3a2000', outline:'none' }

  return (
    <div className="login-page">
      <div className="login-banner-mobile" />
      <div className="login-card" style={{ background:'rgba(253,251,243,0.97)', borderRadius:6, padding:'36px 32px', border:'1px solid #c8a84b', boxShadow:'0 8px 40px rgba(0,0,0,0.35)', position:'relative' }}>
        <div style={{ position:'absolute', inset:6, border:'1px solid #c8a84b', borderRadius:3, pointerEvents:'none' }}/>
        <div style={{ textAlign:'center', marginBottom:12 }}>
          <svg width="72" height="58" viewBox="0 0 72 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 44 Q36 8 66 44" stroke="#3a2a12" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 44 V30 M36 44 V22 M52 44 V30" stroke="#3a2a12" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="46" cy="20" rx="10" ry="7" fill="#3a2a12"/>
            <path d="M55 19 L64 16" stroke="#3a2a12" strokeWidth="2" strokeLinecap="round"/>
            <path d="M46 27 L44 40" stroke="#3a2a12" strokeWidth="2" strokeLinecap="round"/>
            <path d="M44 40 L38 48 M44 40 L48 48" stroke="#3a2a12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ textAlign:'center', fontSize:15, fontWeight:'bold', color:'#3a2000', letterSpacing:2, textTransform:'uppercase', lineHeight:1.4, fontFamily:'Georgia,serif', marginBottom:4 }}>Login de Acesso -<br/>Hotel Barbosa</h1>
        <div style={{ borderTop:'1px solid #c8a84b', margin:'14px 0' }}/>
        {erro && <div style={{ background:'rgba(180,30,30,0.08)', border:'1px solid rgba(180,30,30,0.3)', borderRadius:3, padding:'8px 12px', fontSize:12, color:'#900', marginBottom:12 }}>{erro}</div>}
        <form onSubmit={entrar}>
          <div style={{ position:'relative', marginBottom:16 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#8a6a3a' }}>@</span>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="USUARIO / EMAIL" required style={inp}/>
          </div>
          <div style={{ position:'relative', marginBottom:18 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#8a6a3a' }}>*</span>
            <input type={show?'text':'password'} value={senha} onChange={e=>setSenha(e.target.value)} placeholder='SENHA' required style={{...inp,paddingRight:50}}/>
            <button type='button' onClick={()=>setShow(!show)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#8a6a3a' }}>{show?'hide':'show'}</button>
          </div>
          <button type='submit' disabled={loading} style={{ width:'100%', background:loading?'#6b7a44':'#4f5b28', border:'1px solid #3a4419', borderRadius:3, padding:'13px', color:'#fdfbf3', fontSize:13, fontWeight:'bold', letterSpacing:2, textTransform:'uppercase', cursor:'pointer', fontFamily:'Georgia,serif', marginTop:4 }}>{loading?'Acessando...':'Acessar Conta'}</button>
        </form>
        <div style={{ borderTop:'1px solid #c8a84b', margin:'14px 0' }}/>
        <p style={{ textAlign:'center', fontSize:11, color:'#8a6a3a', margin:0 }}>Esqueceu a senha? Fale com o administrador</p>
      </div>
    </div>
  )
}
