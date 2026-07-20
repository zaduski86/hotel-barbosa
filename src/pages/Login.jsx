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

  const inp = { width:'100%', padding:'11px 12px 11px 30px', boxSizing:'border-box', border:'1px solid #c8a84b', borderRadius:3, background:'#fffef8', fontSize:12, letterSpacing:1, color:'#3a2000', outline:'none' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'flex-end', backgroundImage:'url(/hotel-bg.jpg)', backgroundSize:'cover', backgroundPosition:'center', padding:'20px' }}>
      <div style={{ background:'rgba(255,253,245,0.96)', borderRadius:4, padding:'36px 32px', width:340, marginRight:'5%', border:'2px solid #8B6914', boxShadow:'0 8px 40px rgba(0,0,0,0.35)', position:'relative' }}>
        <div style={{ position:'absolute', inset:6, border:'1px solid #c8a84b', borderRadius:2, pointerEvents:'none' }}/>
        <div style={{ textAlign:'center', marginBottom:12 }}>
          <svg width="70" height="55" viewBox="0 0 70 55" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="16" rx="18" ry="14" fill="#5a3a1a"/>
            <rect x="46" y="28" width="8" height="14" fill="#5a3a1a"/>
            <ellipse cx="18" cy="28" rx="4" ry="10" fill="#5a3a1a"/>
            <circle cx="18" cy="16" r="4" fill="#5a3a1a"/>
            <path d="M18 17 L30 12" stroke="#5a3a1a" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 28 L10 36" stroke="#5a3a1a" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 28 L21 36" stroke="#5a3a1a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ textAlign:'center', fontSize:15, fontWeight:'bold', color:'#3a2000', letterSpacing:2, textTransform:'uppercase', lineHeight:1.4, fontFamily:'Georgia,serif', marginBottom:4 }}>Login de Acesso -<br/>Hotel Barbosa</h1>
        <div style={{ borderTop:'1px solid #c8a84b', margin:'14px 0' }}/>
        {erro && <div style={{ background:'rgba(180,30,30,0.08)', border:'1px solid rgba(180,30,30,0.3)', borderRadius:3, padding:'8px 12px', fontSize:12, color:'#900', marginBottom:12 }}>{erro}</div>}
        <form onSubmit={entrar}>
          <div style={{ position:'relative', marginBottom:12 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#8a6a3a' }}>@</span>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="USUARIO / EMAIL" required style={inp}/>
          </div>
          <div style={{ position:'relative', marginBottom:12 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#8a6a3a' }}>*</span>
            <input type={show?'text':'password'} value={senha} onChange={e=>setSenha(e.target.value)} placeholder='SENHA' required style={{...inp,paddingRight:50}}/>
            <button type='button' onClick={()=>setShow(!show)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#8a6a3a' }}>{show?'hide':'show'}</button>
          </div>
          <button type='submit' disabled={loading} style={{ width:'100%', background:loading?'#a08040':'#7a5c1e', border:'1px solid #5a3a00', borderRadius:3, padding:'13px', color:'#fffef0', fontSize:13, fontWeight:'bold', letterSpacing:2, textTransform:'uppercase', cursor:'pointer', fontFamily:'Georgia,serif', marginTop:4 }}>{loading?'Acessando...':'Acessar Conta'}</button>
        </form>
        <div style={{ borderTop:'1px solid #c8a84b', margin:'14px 0' }}/>
        <p style={{ textAlign:'center', fontSize:11, color:'#8a6a3a', margin:0 }}>Esqueceu a senha? Fale com o administrador</p>
      </div>
    </div>
  )
}
