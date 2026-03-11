'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AuthModal({ onClose, th, onGoogle, onEmailSignIn, onEmailSignUp }: {
  onClose: () => void
  th: any
  onGoogle: () => void
  onEmailSignIn: (email: string, pass: string) => Promise<void>
  onEmailSignUp: (email: string, pass: string, name: string) => Promise<void>
}) {
  const [tab, setTab] = useState<'in'|'up'>('in')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr(''); setBusy(true)
    try {
      if (tab === 'in') await onEmailSignIn(email, pass)
      else await onEmailSignUp(email, pass, name)
      onClose()
    } catch (e: any) {
      setErr(e.message || 'Erro ao autenticar')
    }
    setBusy(false)
  }

  const inp: React.CSSProperties = {
    width:'100%', background:th.bgInput, border:`1.5px solid ${th.border}`,
    borderRadius:10, padding:'11px 14px', color:th.textPrimary,
    fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:10,
  }

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(8px)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:24,padding:28,width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontSize:32,marginBottom:8 }}>🍹</div>
          <div style={{ fontSize:22,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif" }}>Entrar no TÔNICO</div>
          <div style={{ fontSize:13,color:th.textSec,marginTop:4 }}>Salve favoritos e avalie estabelecimentos</div>
        </div>

        <button onClick={onGoogle} style={{ width:'100%',background:'#fff',border:'1.5px solid #E0E0E0',borderRadius:12,padding:'12px',fontWeight:700,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16,color:'#333',boxSizing:'border-box' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
          <div style={{ flex:1,height:1,background:th.border }}/>
          <span style={{ fontSize:11,color:th.textMuted,fontWeight:600 }}>OU</span>
          <div style={{ flex:1,height:1,background:th.border }}/>
        </div>

        <div style={{ display:'flex',gap:4,background:th.bgInput,borderRadius:12,padding:4,marginBottom:16 }}>
          {(['in','up'] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1,background:tab===t?th.bgCard:'transparent',border:'none',borderRadius:9,padding:'8px',fontWeight:700,fontSize:13,cursor:'pointer',color:tab===t?th.textPrimary:th.textSec,transition:'all .15s' }}>
              {t==='in'?'Entrar':'Cadastrar'}
            </button>
          ))}
        </div>

        {tab==='up'&&<input placeholder="Seu nome" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
        <input type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder="Senha" value={pass} onChange={e=>setPass(e.target.value)} style={{ ...inp, marginBottom:err?8:16 }}/>

        {err&&<div style={{ color:th.red,fontSize:12,marginBottom:12,fontWeight:600 }}>⚠ {err}</div>}

        <button onClick={submit} disabled={busy||!email||!pass} style={{ width:'100%',background:th.accent,border:'none',borderRadius:12,padding:'13px',color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',boxSizing:'border-box',opacity:busy?0.7:1,boxShadow:`0 4px 16px ${th.accent}55` }}>
          {busy?'⏳ Aguarde…':tab==='in'?'Entrar':'Criar conta'}
        </button>
        <button onClick={onClose} style={{ width:'100%',background:'none',border:'none',color:th.textMuted,fontSize:13,marginTop:12,cursor:'pointer',fontWeight:600 }}>Cancelar</button>
      </div>
    </div>
  )
}
