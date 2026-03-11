'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../lib/useAuth'
import { T, type ThemeMode } from '../lib/theme'
import { PLACES, CATS, DAYS_K, DAYS_S, DAYS_F, DOW } from '../lib/data'
import type { Place } from '../lib/types'

// MapView carregado dinamicamente (Leaflet não suporta SSR)
const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#E8E0D8',fontSize:24 }}>
      🗺️
    </div>
  ),
})

const goTo  = (url: string) => { try { window.open(url,'_blank','noopener') } catch(e){} }
const mUrl  = (a: string, c: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a+', '+c)}`
const waUrl = (n: string) => `https://wa.me/${n.replace(/\D/g,'')}`
const igUrl = (h: string) => `https://instagram.com/${h.replace('@','')}`
const esc   = (s: string) => (s||'').replace(/'/g,"''")

async function runSQL(q: string) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:2000,
        system:`Proxy SQL Supabase "wbahygrqilfqsdjvnwtd". Execute via MCP e retorne SOMENTE JSON válido.`,
        messages:[{role:'user',content:q}],
        mcp_servers:[{type:'url',url:'https://mcp.supabase.com/mcp',name:'supabase'}] })
    })
    const d = await r.json()
    const t = (d.content||[]).filter((b: any)=>b.type==='text').map((b: any)=>b.text).join('').replace(/```json|```/g,'').trim()
    const m = t.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
    return m ? JSON.parse(m[0]) : {}
  } catch(e) { return { error: (e as Error).message } }
}

/* ─── mini UI ─────────────────────────────────────────────── */
function Toast({ msg, type, mode }: { msg: string, type: string, mode: ThemeMode }) {
  if (!msg) return null
  const th = T[mode]
  const c: Record<string,string> = { success:'#1B7A3E', error:'#D63A2A', info:'#0076CC' }
  return (
    <div style={{ position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',
      background:th.textPrimary,color:c[type]||c.info,border:`1.5px solid ${c[type]||c.info}`,
      borderRadius:12,padding:'10px 18px',fontSize:13,fontWeight:700,zIndex:9999,whiteSpace:'nowrap' }}>
      {type==='success'?'✓':type==='error'?'✕':'ℹ'} {msg}
    </div>
  )
}

function OpenBadge({ isOpen, th }: { isOpen: boolean, th: typeof T.light }) {
  return (
    <span style={{ background:isOpen?th.greenBg:th.redBg, color:isOpen?th.green:th.red,
      borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:800, letterSpacing:.5 }}>
      {isOpen ? '● ABERTO' : '● FECHADO'}
    </span>
  )
}

function PlanBadge({ plan, th }: { plan: string, th: typeof T.light }) {
  const cfg: Record<string,{lbl:string,bg:string,c:string}> = {
    basic:{lbl:'Básico',bg:th.border,c:th.textSec},
    pro:{lbl:'PRO',bg:'#FFF3CD',c:'#7A5200'},
    premium:{lbl:'★ PREMIUM',bg:'#FFF0EB',c:'#C63500'},
  }
  const p = cfg[plan] || cfg.basic
  return <span style={{ background:p.bg,color:p.c,borderRadius:20,padding:'2px 9px',fontSize:9,fontWeight:800,letterSpacing:.5 }}>{p.lbl}</span>
}

function SchedGrid({ sch, color, th }: { sch: Record<string,[string,string]|null>, color: string, th: typeof T.light }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {DAYS_K.map((dk, i) => {
        const isToday = i === DOW, slot = sch[dk]
        return (
          <div key={i} style={{ flex:'0 0 auto',minWidth:36,padding:'3px 2px',borderRadius:6,textAlign:'center',
            background: isToday ? (slot?color+'18':'#FDECEA') : (slot?'#E8F7EF':th.bgCard2),
            border: `1px solid ${isToday?(slot?color:'#D63A2A'):(slot?color+'40':th.border)}` }}>
            <div style={{ fontSize:8,color:isToday?(slot?color:'#D63A2A'):(slot?color+'aa':th.textMuted),fontWeight:700 }}>{DAYS_S[i]}</div>
            <div style={{ fontSize:8,color:slot?(isToday?color:th.green):'#D0B8A8',marginTop:1 }}>{slot?'●':'✕'}</div>
          </div>
        )
      })}
    </div>
  )
}

function Stars({ v, onChange, size=24 }: { v: number, onChange?: (n:number)=>void, size?: number }) {
  const [h, setH] = useState(0)
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setH(n)} onMouseLeave={() => setH(0)}
          style={{ fontSize:size, cursor:onChange?'pointer':'default',
            color:(h||v)>=n?'#E67C00':'#ddd', transition:'color .1s' }}>★</span>
      ))}
    </div>
  )
}

function ABt({ icon, label, onClick, color, th }: { icon:string, label:string, onClick:()=>void, color?:string, th: typeof T.light }) {
  const c = color || th.accent
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex:1, background:hov?c+'15':th.bgCard, border:`1.5px solid ${hov?c:th.border}`,
        borderRadius:12, padding:'10px 4px', cursor:'pointer', display:'flex', flexDirection:'column',
        alignItems:'center', gap:4, transition:'all .15s', minWidth:0, transform:hov?'translateY(-2px)':'none' }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={{ fontSize:9, color:th.textSec, fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>
    </button>
  )
}

/* ─── Lightbox ─────────────────────────────────────────────── */
function Lightbox({ photos, start, onClose }: { photos:{url:string,c:string}[], start:number, onClose:()=>void }) {
  const [i, setI] = useState(start)
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key==='Escape') onClose()
      if (e.key==='ArrowRight') setI(x=>(x+1)%photos.length)
      if (e.key==='ArrowLeft') setI(x=>(x-1+photos.length)%photos.length)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [photos.length])
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.95)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <button onClick={onClose} style={{ position:'absolute',top:14,right:14,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:'50%',width:36,height:36,fontSize:16,cursor:'pointer' }}>✕</button>
      <div onClick={e=>e.stopPropagation()} style={{ maxWidth:680,width:'90vw' }}>
        <img src={photos[i]?.url} alt="" style={{ width:'100%',maxHeight:'66vh',objectFit:'contain',borderRadius:12 }}/>
        {photos[i]?.c && <div style={{ textAlign:'center',color:'rgba(255,255,255,.5)',fontSize:12,marginTop:8 }}>{photos[i].c}</div>}
        <div style={{ display:'flex',justifyContent:'space-between',marginTop:12,alignItems:'center' }}>
          <button onClick={()=>setI(x=>(x-1+photos.length)%photos.length)} style={{ background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:20 }}>‹</button>
          <div style={{ display:'flex',gap:5 }}>{photos.map((_,j)=><div key={j} onClick={()=>setI(j)} style={{ width:j===i?18:6,height:6,borderRadius:3,background:j===i?'#FF4D1C':'rgba(255,255,255,.3)',cursor:'pointer',transition:'all .2s' }}/>)}</div>
          <button onClick={()=>setI(x=>(x+1)%photos.length)} style={{ background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:20 }}>›</button>
        </div>
      </div>
    </div>
  )
}

/* ─── ReviewModal ──────────────────────────────────────────── */
function ReviewModal({ place, th, onClose, onSubmit }: { place:Place, th:typeof T.light, onClose:()=>void, onSubmit:(id:string,r:number,c:string)=>Promise<void> }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const phrases = ['Horrível','Ruim','Regular','Bom','Excelente!']
  const submit = async () => { setBusy(true); await onSubmit(place.id,rating,comment); setBusy(false); onClose() }
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:24,padding:28,width:'100%',maxWidth:360,boxShadow:'0 16px 60px rgba(0,0,0,.2)' }}>
        <div style={{ textAlign:'center',fontSize:28,marginBottom:4 }}>{place.emoji}</div>
        <div style={{ fontSize:20,fontWeight:800,color:th.textPrimary,textAlign:'center',marginBottom:18,fontFamily:"'Playfair Display',serif" }}>Avaliar {place.name}</div>
        <div style={{ display:'flex',justifyContent:'center',marginBottom:6 }}><Stars v={rating} onChange={setRating} size={36}/></div>
        {rating>0&&<div style={{ textAlign:'center',color:th.gold,fontSize:14,fontWeight:700,marginBottom:16 }}>{phrases[rating-1]}</div>}
        <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Conta o que achou (opcional)…" rows={3}
          style={{ width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:12,padding:'10px 14px',color:th.textPrimary,fontSize:14,outline:'none',resize:'none',fontFamily:'inherit',boxSizing:'border-box',marginBottom:16 }}/>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,background:'transparent',border:`1.5px solid ${th.textSec}88`,borderRadius:10,padding:'11px',fontWeight:700,fontSize:14,cursor:'pointer',color:th.textSec }}>Cancelar</button>
          <button onClick={submit} disabled={!rating||busy} style={{ flex:1,background:th.gold,border:'none',borderRadius:10,padding:'11px',fontWeight:700,fontSize:14,cursor:'pointer',color:'#fff',opacity:!rating||busy?0.5:1 }}>{busy?'⏳':'Enviar ★'}</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail ───────────────────────────────────────────────── */
function Detail({ place, isFav, onFav, onClose, showMsg, onReview, th, user }: {
  place:Place, isFav:boolean, onFav:(p:Place)=>void, onClose:()=>void,
  showMsg:(m:string,t:string)=>void, onReview:(id:string,r:number,c:string)=>Promise<void>,
  th: typeof T.light, user: any }) {
  const [lb, setLb] = useState<number|null>(null)
  const [showRv, setShowRv] = useState(false)
  const p = place

  const share = async () => {
    const txt = `${p.emoji} ${p.name}\n📍 ${p.addr}, Pelotas\nVeja no TÔNICO!`
    if (navigator.share) { try { await navigator.share({ title:p.name, text:txt }) } catch(e){} }
    else { navigator.clipboard.writeText(txt); showMsg('Copiado!','info') }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:th.bg,border:`1.5px solid ${th.border}`,borderRadius:'24px 24px 0 0',width:'100%',maxWidth:640,maxHeight:'94vh',overflowY:'auto' }}>
          {p.photos.length>0&&(
            <div style={{ position:'relative',cursor:'pointer' }} onClick={()=>setLb(0)}>
              <img src={p.photos[0].url} alt={p.name} style={{ width:'100%',height:220,objectFit:'cover',borderRadius:'24px 24px 0 0' }}/>
              <div style={{ position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 50%,${th.bg})`,borderRadius:'24px 24px 0 0' }}/>
              {p.photos.length>1&&<div style={{ position:'absolute',bottom:12,right:14,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',color:'#fff',fontSize:11,fontWeight:700,borderRadius:8,padding:'4px 10px' }}>📷 {p.photos.length}</div>}
            </div>
          )}
          <div style={{ padding:'18px 20px 36px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:6 }}>
                  <OpenBadge isOpen={p.open} th={th}/>
                  <PlanBadge plan={p.plan} th={th}/>
                </div>
                <div style={{ fontSize:26,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif",lineHeight:1.1 }}>{p.emoji} {p.name}</div>
                <div style={{ fontSize:12,color:th.textSec,marginTop:4 }}>📍 {p.addr} · {p.nbh}</div>
              </div>
              <button onClick={onClose} style={{ background:th.bgInput,border:`1.5px solid ${th.border}`,color:th.textSec,borderRadius:'50%',width:34,height:34,cursor:'pointer',fontSize:16,flexShrink:0,marginLeft:8 }}>✕</button>
            </div>

            {p.update&&<div style={{ background:th.greenBg,border:`1.5px solid #A3D9B8`,borderRadius:12,padding:'10px 14px',marginBottom:14,display:'flex',gap:8 }}><span>📣</span><div><div style={{ fontSize:9,color:th.green,fontWeight:800,letterSpacing:2,marginBottom:3 }}>HOJE</div><div style={{ fontSize:13,color:'#1B4A2A',lineHeight:1.5 }}>{p.update}</div></div></div>}

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16 }}>
              {[
                {icon:p.open?'✅':'❌',v:p.open?'Aberto':'Fechado',sub:p.hours||'Hoje',c:p.open?th.green:th.red,bg:p.open?th.greenBg:th.redBg},
                {icon:'⭐',v:p.rating.toFixed(1),sub:`${p.reviews} aval.`,c:th.gold,bg:'#FFF8E1'},
                {icon:'📍',v:p.nbh,sub:'Pelotas',c:th.textSec,bg:th.bgInput},
              ].map(({icon,v,sub,c,bg}) => (
                <div key={v} style={{ background:bg,borderRadius:14,padding:'11px 8px',textAlign:'center',border:`1.5px solid ${th.border}` }}>
                  <div style={{ fontSize:18,marginBottom:3 }}>{icon}</div>
                  <div style={{ fontSize:12,fontWeight:800,color:c,lineHeight:1.1 }}>{v}</div>
                  <div style={{ fontSize:9,color:th.textSec,marginTop:2,fontWeight:600 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex',gap:8,marginBottom:16,overflowX:'auto' }}>
              <ABt icon="🗺️" label="Chegar" color="#0076CC" onClick={()=>{goTo(mUrl(p.addr,'Pelotas'));showMsg('Abrindo Maps…','info')}} th={th}/>
              {p.wa&&<ABt icon="💬" label="WhatsApp" color="#25D366" onClick={()=>{goTo(waUrl(p.wa));showMsg('WhatsApp…','info')}} th={th}/>}
              {p.phone&&<ABt icon="📞" label="Ligar" color={th.green} onClick={()=>goTo('tel:'+p.phone.replace(/\D/g,''))} th={th}/>}
              {p.ig&&<ABt icon="📸" label="Instagram" color="#E1306C" onClick={()=>{goTo(igUrl(p.ig));showMsg('Instagram…','info')}} th={th}/>}
              <ABt icon={isFav?'❤️':'🤍'} label={isFav?'Salvo':'Salvar'} color={th.red} onClick={()=>{onFav(p);showMsg(isFav?'Removido':'Salvo! ❤️',isFav?'info':'success')}} th={th}/>
              <ABt icon="↗️" label="Compartilhar" color="#7B1FA2" onClick={share} th={th}/>
            </div>

            {p.desc&&<div style={{ background:th.bgCard2,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14,marginBottom:14 }}><div style={{ fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:6,fontWeight:700 }}>SOBRE</div><p style={{ color:th.textSec,fontSize:14,lineHeight:1.7,margin:0 }}>{p.desc}</p></div>}

            {p.photos.length>1&&<div style={{ marginBottom:14 }}><div style={{ fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:8,fontWeight:700 }}>GALERIA</div><div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6 }}>{p.photos.map((ph,i)=><img key={i} src={ph.url} alt="" onClick={()=>setLb(i)} style={{ width:'100%',height:82,objectFit:'cover',borderRadius:10,cursor:'pointer',border:`1.5px solid ${th.border}` }}/>)}</div></div>}

            <div style={{ background:th.bgCard2,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14,marginBottom:14 }}>
              <div style={{ fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:10,fontWeight:700 }}>FUNCIONAMENTO</div>
              {DAYS_K.map((dk,i) => {
                const slot = p.sch[dk], isToday = i===DOW
                return <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<6?`1px solid ${th.border}`:'none' }}>
                  <span style={{ fontSize:13,fontWeight:isToday?800:500,color:isToday?p.color:th.textSec }}>{DAYS_F[i]}{isToday?' · hoje':''}</span>
                  <span style={{ fontSize:13,fontWeight:isToday?700:400,color:slot?(isToday?p.color:th.textSec):th.textMuted }}>{slot?`${slot[0]} – ${slot[1]}`:'Fechado'}</span>
                </div>
              })}
            </div>

            <div style={{ background:th.bgCard2,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                <div style={{ fontSize:9,color:th.textMuted,letterSpacing:2,fontWeight:700 }}>AVALIAÇÕES</div>
                <button onClick={()=>user?setShowRv(true):showMsg('Entre para avaliar','info')} style={{ background:p.color,border:'none',borderRadius:20,padding:'5px 13px',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer' }}>+ Avaliar</button>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ fontSize:42,fontWeight:900,color:th.gold,lineHeight:1,fontFamily:"'Playfair Display',serif" }}>{p.rating.toFixed(1)}</div>
                <div><Stars v={Math.round(p.rating)} size={18}/><div style={{ fontSize:12,color:th.textSec,marginTop:4,fontWeight:600 }}>{p.reviews} avaliações</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lb!==null&&<Lightbox photos={p.photos} start={lb} onClose={()=>setLb(null)}/>}
      {showRv&&<ReviewModal place={p} th={th} onClose={()=>setShowRv(false)} onSubmit={onReview}/>}
    </>
  )
}

/* ─── Card ─────────────────────────────────────────────────── */
function Card({ place, isFav, onOpen, onFav, th }: { place:Place, isFav:boolean, onOpen:(p:Place)=>void, onFav:(p:Place)=>void, th: typeof T.light }) {
  const p = place
  const isPrem = p.plan==='premium', isPro = p.plan==='pro'
  const showPh = (isPrem||isPro) && p.photos.length>0
  const [hov, setHov] = useState(false)

  return (
    <div onClick={()=>onOpen(p)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:isPrem?`linear-gradient(145deg,${p.color}08,#fff)`:th.bgCard,
        border:isPrem?`2px solid ${p.color}60`:isPro?`1.5px solid ${p.color}35`:`1.5px solid ${th.border}`,
        borderRadius:18,padding:16,cursor:'pointer',position:'relative',overflow:'hidden',
        boxShadow:hov?th.shadowHover:(isPrem?`0 4px 24px ${p.color}20`:th.shadow),
        transform:hov?'translateY(-3px)':'none',transition:'all .2s' }}>
      {isPrem&&<div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${p.color},transparent)`,borderRadius:'18px 18px 0 0' }}/>}
      <button onClick={e=>{e.stopPropagation();onFav(p)}} style={{ position:'absolute',top:12,right:12,background:'rgba(255,255,255,.85)',backdropFilter:'blur(4px)',border:`1px solid ${th.border}`,borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2 }}>{isFav?'❤️':'🤍'}</button>
      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
        <OpenBadge isOpen={p.open} th={th}/>
        <PlanBadge plan={p.plan} th={th}/>
      </div>
      <div style={{ fontSize:18,fontWeight:900,color:th.textPrimary,paddingRight:36,marginBottom:2,fontFamily:"'Playfair Display',serif",lineHeight:1.2 }}>{p.emoji} {p.name}</div>
      <div style={{ fontSize:11,color:th.textSec,marginBottom:8 }}>📍 {p.nbh}{p.hours&&<span style={{ color:p.open?th.green:th.textMuted }}> · 🕐 {p.hours}</span>}</div>
      {p.update&&<div style={{ background:th.greenBg,border:`1px solid #A3D9B8`,borderRadius:9,padding:'6px 10px',fontSize:11,color:th.green,marginBottom:9,display:'flex',gap:6,lineHeight:1.4 }}><span>📣</span><span>{p.update.length>80?p.update.slice(0,80)+'…':p.update}</span></div>}
      {p.hl&&<div style={{ background:p.color+'12',border:`1.5px solid ${p.color}30`,borderRadius:8,padding:'5px 10px',fontSize:11,color:p.color,marginBottom:9,fontWeight:700 }}>✦ {p.hl}</div>}
      {showPh&&<div style={{ display:'flex',gap:5,marginBottom:9,overflowX:'auto' }}>{p.photos.slice(0,4).map((ph,i)=><img key={i} src={ph.url} alt="" style={{ width:i===0?110:72,height:66,objectFit:'cover',borderRadius:10,flexShrink:0,border:`1px solid ${th.border}` }}/>)}</div>}
      {!showPh&&p.plan==='basic'&&<div style={{ background:th.bgInput,border:`1px dashed ${th.border}`,borderRadius:9,padding:'6px 10px',fontSize:10,color:th.textMuted,marginBottom:9 }}>📷 Fotos disponíveis no plano PRO</div>}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`1.5px solid ${th.border}`,paddingTop:10 }}>
        <div style={{ fontSize:11,color:th.gold,fontWeight:700 }}>★ {p.rating.toFixed(1)}<span style={{ color:th.textMuted,fontWeight:400 }}> ({p.reviews})</span></div>
        <SchedGrid sch={p.sch as any} color={p.color} th={th}/>
      </div>
    </div>
  )
}

/* ─── Screens ──────────────────────────────────────────────── */

/** Card horizontal — usado nos carrosséis de seção */
function HCard({ place, isFav, onOpen, onFav, th }: { place:Place, isFav:boolean, onOpen:(p:Place)=>void, onFav:(p:Place)=>void, th: typeof T.light }) {
  const p = place
  const photo = p.photos[0]?.url
  return (
    <div onClick={()=>onOpen(p)} style={{ flex:'0 0 auto',width:200,borderRadius:18,overflow:'hidden',cursor:'pointer',
      background:th.bgCard,border:`1.5px solid ${p.plan==='premium'?p.color+'50':th.border}`,
      boxShadow:p.plan==='premium'?`0 4px 20px ${p.color}25`:th.shadow,position:'relative' }}>
      {photo
        ? <div style={{ position:'relative',height:110 }}>
            <img src={photo} alt="" style={{ width:'100%',height:110,objectFit:'cover' }}/>
            <div style={{ position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 40%,${p.color}cc)` }}/>
            <div style={{ position:'absolute',bottom:7,left:9,fontSize:9,fontWeight:800,letterSpacing:.5,
              color:'#fff',background:p.open?'#1B7A3E':'rgba(0,0,0,.5)',borderRadius:20,padding:'2px 8px' }}>
              {p.open?'● ABERTO':'● FECHADO'}
            </div>
            <button onClick={e=>{e.stopPropagation();onFav(p)}} style={{ position:'absolute',top:7,right:7,
              background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',border:'none',borderRadius:'50%',
              width:28,height:28,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center' }}>
              {isFav?'❤️':'🤍'}
            </button>
          </div>
        : <div style={{ height:80,background:`linear-gradient(135deg,${p.color}22,${p.color}44)`,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,position:'relative' }}>
            {p.emoji}
            <button onClick={e=>{e.stopPropagation();onFav(p)}} style={{ position:'absolute',top:7,right:7,
              background:th.bgInput,border:`1px solid ${th.border}`,borderRadius:'50%',
              width:26,height:26,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center' }}>
              {isFav?'❤️':'🤍'}
            </button>
          </div>
      }
      <div style={{ padding:'9px 11px 11px' }}>
        <div style={{ fontSize:13,fontWeight:900,color:th.textPrimary,lineHeight:1.2,marginBottom:2,
          fontFamily:"'Playfair Display',serif",whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
          {p.name}
        </div>
        <div style={{ fontSize:10,color:th.textSec,marginBottom:p.update?5:0 }}>
          📍 {p.nbh}{p.hours&&<span style={{ color:p.open?th.green:th.textMuted }}> · {p.hours}</span>}
        </div>
        {p.update&&<div style={{ fontSize:10,color:th.green,fontWeight:700,lineHeight:1.3,
          overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any }}>
          📣 {p.update}
        </div>}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6 }}>
          <span style={{ fontSize:10,color:th.gold,fontWeight:800 }}>★ {p.rating.toFixed(1)}</span>
          <span style={{ fontSize:9,color:th.accent,fontWeight:700 }}>Ver →</span>
        </div>
      </div>
    </div>
  )
}

/** Seção com título + carrossel horizontal */
function Section({ title, icon, places, favs, onOpen, onFav, th }: {
  title:string, icon:string, places:Place[], favs:Set<string>,
  onOpen:(p:Place)=>void, onFav:(p:Place)=>void, th:typeof T.light }) {
  if (places.length===0) return null
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',marginBottom:10 }}>
        <div style={{ display:'flex',alignItems:'center',gap:7 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:15,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif" }}>{title}</span>
          <span style={{ fontSize:11,color:th.textMuted,fontWeight:600 }}>({places.length})</span>
        </div>
      </div>
      <div style={{ display:'flex',gap:12,overflowX:'auto',padding:'0 16px 2px' }} className="no-scrollbar">
        {places.map(p=><HCard key={p.id} place={p} isFav={favs.has(p.id)} onOpen={onOpen} onFav={onFav} th={th}/>)}
      </div>
    </div>
  )
}

function HomeScreen({ favs, onFav, onOpen, th, themeBtn }: { favs:Set<string>, onFav:(p:Place)=>void, onOpen:(p:Place)=>void, th:typeof T.light, themeBtn:React.ReactNode }) {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')

  const openCount = PLACES.filter(p=>p.open).length
  const isFiltering = search.trim() || activeCat!=='all'

  // Lista filtrada (modo busca/cat)
  const filtered = PLACES.filter(p => {
    if (activeCat!=='all' && p.type!==activeCat) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.desc.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Seções para o feed
  const destaques = PLACES.filter(p => p.plan==='premium')
  const abertosNow = PLACES.filter(p => p.open)
  const events = PLACES.filter(p => p.type==='event')
  const clubs  = PLACES.filter(p => p.type==='club')
  const bars   = PLACES.filter(p => p.type==='bar')
  const rests  = PLACES.filter(p => p.type==='restaurant')
  const cafes  = PLACES.filter(p => p.type==='cafe')

  return (
    <>
      {/* ─── Header sticky ─── */}
      <div style={{ background:th.headerBg,borderBottom:`1.5px solid ${th.border}`,padding:'13px 16px',position:'sticky',top:0,zIndex:400,backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:640,margin:'0 auto' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11 }}>
            <div style={{ display:'flex',alignItems:'baseline',gap:8 }}>
              <div style={{ fontSize:26,fontFamily:"'Playfair Display',serif",fontWeight:900,color:th.accent,lineHeight:1,letterSpacing:-1 }}>TÔNICO</div>
              <div style={{ fontSize:10,color:th.textMuted,fontWeight:700,letterSpacing:3 }}>PELOTAS</div>
            </div>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              {themeBtn}
              <div style={{ background:th.accentBg,border:`1.5px solid ${th.accent}30`,borderRadius:20,padding:'5px 12px',color:th.accent,fontSize:12,fontWeight:700 }}>
                <span style={{ color:th.green,fontWeight:800 }}>●</span> {openCount} abertos
              </div>
            </div>
          </div>
          <input placeholder="🔍  Buscar bares, restaurantes, eventos…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:12,padding:'10px 14px',color:th.textPrimary,fontSize:14,outline:'none',boxSizing:'border-box' }}/>
        </div>
      </div>

      {/* ─── Chips de categoria ─── */}
      <div style={{ padding:'11px 16px 0',maxWidth:640,margin:'0 auto' }}>
        <div style={{ display:'flex',gap:7,overflowX:'auto',paddingBottom:2 }} className="no-scrollbar">
          {CATS.map(c => (
            <button key={c.id} onClick={()=>setActiveCat(c.id)}
              style={{ flex:'0 0 auto',background:activeCat===c.id?th.accent:th.bgCard,
                border:`1.5px solid ${activeCat===c.id?th.accent:th.border}`,borderRadius:20,
                padding:'6px 14px',color:activeCat===c.id?'#fff':th.textSec,fontSize:12,cursor:'pointer',
                fontWeight:700,whiteSpace:'nowrap',
                boxShadow:activeCat===c.id?`0 3px 12px ${th.accent}44`:th.shadow,transition:'all .15s' }}>
              {c.icon} {c.lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:640,margin:'0 auto',paddingTop:14,paddingBottom:8 }}>
        {isFiltering ? (
          /* ─── Modo busca / filtro por categoria ─── */
          <div style={{ padding:'0 16px' }}>
            <div style={{ fontSize:12,color:th.textMuted,fontWeight:600,marginBottom:12 }}>
              {filtered.length} resultado{filtered.length!==1?'s':''}
              {activeCat!=='all'&&<span> em <b style={{ color:th.accent }}>{CATS.find(c=>c.id===activeCat)?.lbl}</b></span>}
              {search&&<span> para "<b>{search}</b>"</span>}
            </div>
            {filtered.length===0
              ? <div style={{ textAlign:'center',padding:60,color:th.textMuted }}><div style={{ fontSize:40,marginBottom:14 }}>🔍</div>Nenhum resultado</div>
              : <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {filtered.map(p=><Card key={p.id} place={p} isFav={favs.has(p.id)} onOpen={onOpen} onFav={onFav} th={th}/>)}
                </div>
            }
          </div>
        ) : (
          /* ─── Feed por seções ─── */
          <>
            {/* Banner de destaque PREMIUM */}
            {destaques.length>0&&(
              <div style={{ margin:'0 16px 20px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}>
                  <span style={{ fontSize:15,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif" }}>✦ Em Destaque</span>
                  <span style={{ fontSize:9,fontWeight:800,color:'#C63500',background:'#FFF0EB',borderRadius:20,padding:'2px 8px',letterSpacing:.5 }}>PREMIUM</span>
                </div>
                {destaques.map(p => (
                  <div key={p.id} onClick={()=>onOpen(p)}
                    style={{ borderRadius:20,overflow:'hidden',cursor:'pointer',marginBottom:destaques.indexOf(p)<destaques.length-1?12:0,
                      border:`2px solid ${p.color}60`,boxShadow:`0 6px 28px ${p.color}22`,position:'relative',
                      background:th.bgCard }}>
                    {p.photos[0]&&(
                      <div style={{ position:'relative',height:170 }}>
                        <img src={p.photos[0].url} alt="" style={{ width:'100%',height:170,objectFit:'cover' }}/>
                        <div style={{ position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.75))` }}/>
                        <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${p.color},transparent)` }}/>
                        <div style={{ position:'absolute',bottom:14,left:14,right:14 }}>
                          <div style={{ fontSize:11,color:'rgba(255,255,255,.8)',marginBottom:3 }}>
                            <span style={{ background:p.open?'#1B7A3E':'rgba(0,0,0,.5)',borderRadius:20,padding:'2px 8px',fontWeight:800,fontSize:9 }}>{p.open?'● ABERTO':'● FECHADO'}</span>
                            {p.hours&&<span style={{ marginLeft:6 }}>🕐 {p.hours}</span>}
                          </div>
                          <div style={{ fontSize:20,fontWeight:900,color:'#fff',fontFamily:"'Playfair Display',serif",lineHeight:1.2,textShadow:'0 2px 8px rgba(0,0,0,.6)' }}>{p.emoji} {p.name}</div>
                          {p.update&&<div style={{ fontSize:11,color:'rgba(255,255,255,.85)',marginTop:4,lineHeight:1.4 }}>📣 {p.update.slice(0,70)}{p.update.length>70?'…':''}</div>}
                        </div>
                        <button onClick={e=>{e.stopPropagation();onFav(p)}} style={{ position:'absolute',top:12,right:12,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {favs.has(p.id)?'❤️':'🤍'}
                        </button>
                      </div>
                    )}
                    <div style={{ padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <div style={{ fontSize:12,color:th.textSec }}>📍 {p.addr}</div>
                      <div style={{ fontSize:11,color:th.gold,fontWeight:800 }}>★ {p.rating.toFixed(1)} <span style={{ color:th.textMuted,fontWeight:400 }}>({p.reviews})</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Abertos agora */}
            {abertosNow.length>0&&(
              <Section title="Abertos Agora" icon="⚡" places={abertosNow} favs={favs} onOpen={onOpen} onFav={onFav} th={th}/>
            )}

            {/* Festas & Eventos */}
            <Section title="Festas & Eventos" icon="🎉" places={events} favs={favs} onOpen={onOpen} onFav={onFav} th={th}/>

            {/* Baladas */}
            <Section title="Baladas" icon="🎶" places={clubs} favs={favs} onOpen={onOpen} onFav={onFav} th={th}/>

            {/* Bares */}
            <Section title="Bares" icon="🍺" places={bars} favs={favs} onOpen={onOpen} onFav={onFav} th={th}/>

            {/* Restaurantes */}
            <Section title="Restaurantes" icon="🍽️" places={rests} favs={favs} onOpen={onOpen} onFav={onFav} th={th}/>

            {/* Cafés */}
            <Section title="Cafés" icon="☕" places={cafes} favs={favs} onOpen={onOpen} onFav={onFav} th={th}/>

            {/* Todos (lista vertical completa) */}
            <div style={{ margin:'8px 16px 0',paddingTop:16,borderTop:`1.5px solid ${th.border}` }}>
              <div style={{ fontSize:11,color:th.textMuted,letterSpacing:2,fontWeight:700,marginBottom:12 }}>TODOS OS LOCAIS</div>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {PLACES.map(p=><Card key={p.id} place={p} isFav={favs.has(p.id)} onOpen={onOpen} onFav={onFav} th={th}/>)}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function MapScreen({ th, mode, onOpen }: { th: typeof T.light, mode: ThemeMode, onOpen: (p: Place) => void }) {
  const [showList, setShowList] = useState(false)
  const [mapSelected, setMapSelected] = useState<Place | null>(null)
  const openCount = PLACES.filter(p => p.open).length

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 68px)' }}>
      {/* Header fixo */}
      <div style={{
        background: th.headerBg, borderBottom:`1.5px solid ${th.border}`,
        padding:'11px 16px', backdropFilter:'blur(12px)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
      }}>
        <div>
          <div style={{ fontSize:20,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif",lineHeight:1 }}>🗺️ Mapa</div>
          <div style={{ fontSize:11,color:th.textSec,fontWeight:600,marginTop:2 }}>
            Pelotas · <span style={{ color:th.green }}>{openCount} abertos agora</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowList(v => !v)} style={{
            background: showList ? th.accent : th.bgCard,
            border:`1.5px solid ${showList ? th.accent : th.border}`,
            borderRadius:20, padding:'6px 14px', cursor:'pointer',
            fontSize:12, fontWeight:700, color: showList ? '#fff' : th.textSec,
            transition:'all .15s',
          }}>
            {showList ? '🗺️ Mapa' : '☰ Lista'}
          </button>
        </div>
      </div>

      {/* Conteúdo: Mapa ou Lista */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {showList ? (
          /* Modo lista (fallback / acessibilidade) */
          <div style={{ height:'100%', overflowY:'auto', padding:16 }}>
            {[...new Set(PLACES.map(p=>p.nbh))].sort().map(nbh => (
              <div key={nbh} style={{ marginBottom:18 }}>
                <div style={{ fontSize:10,color:th.textMuted,letterSpacing:2,marginBottom:8,display:'flex',alignItems:'center',gap:8,fontWeight:700 }}>
                  <div style={{ flex:1,height:1,background:th.border }}/>
                  📍 {nbh.toUpperCase()}
                  <div style={{ flex:1,height:1,background:th.border }}/>
                </div>
                {PLACES.filter(p=>p.nbh===nbh).map(p => (
                  <div key={p.id} onClick={() => onOpen(p)} style={{ background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,marginBottom:8,boxShadow:th.shadow,cursor:'pointer' }}>
                    <div style={{ width:44,height:44,borderRadius:11,background:p.color+'15',border:`2px solid ${p.color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{p.emoji}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:14,fontWeight:800,color:th.textPrimary }}>{p.name}</div>
                      <div style={{ fontSize:11,color:th.textSec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.addr}</div>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0 }}>
                      <span style={{ fontSize:9,fontWeight:800,color:p.open?th.green:th.textMuted,letterSpacing:.5 }}>{p.open?'● ABERTO':'● FECHADO'}</span>
                      <span style={{ fontSize:11,color:th.accent,fontWeight:700 }}>Ver →</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Mapa Leaflet + carrossel inferior */
          <>
            <MapView places={PLACES} selected={mapSelected} onSelect={p => { setMapSelected(p); onOpen(p) }} mode={mode} />

            {/* Carrossel de mini-cards sobre o mapa */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 12px 14px', zIndex:500, pointerEvents:'none' }}>
              <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:2, pointerEvents:'all' }}
                   className="no-scrollbar">
                {PLACES.map(p => (
                  <div key={p.id}
                    onClick={() => { setMapSelected(p); onOpen(p) }}
                    style={{
                      flex:'0 0 auto', width:160,
                      background: mode === 'dark' ? 'rgba(12,12,12,.96)' : 'rgba(255,255,255,.97)',
                      border:`2px solid ${mapSelected?.id === p.id ? p.color : (mode === 'dark' ? '#222' : '#EEE0D0')}`,
                      borderRadius:16, overflow:'hidden', cursor:'pointer',
                      boxShadow: mapSelected?.id === p.id
                        ? `0 4px 20px ${p.color}55`
                        : '0 4px 16px rgba(0,0,0,.18)',
                      transform: mapSelected?.id === p.id ? 'translateY(-4px)' : 'none',
                      transition:'all .2s',
                    }}>
                    {p.photos[0] && (
                      <img src={p.photos[0].url} alt={p.name}
                        style={{ width:'100%', height:72, objectFit:'cover', display:'block' }}/>
                    )}
                    <div style={{ padding:'8px 10px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                        <span style={{ width:6,height:6,borderRadius:'50%',background:p.open?th.green:th.textMuted,flexShrink:0 }}/>
                        <span style={{ fontSize:9,fontWeight:800,color:p.open?th.green:th.textMuted,letterSpacing:.5 }}>
                          {p.open ? 'ABERTO' : 'FECHADO'}
                        </span>
                      </div>
                      <div style={{ fontSize:12,fontWeight:900,color:mode==='dark'?'#fff':'#1A0F00',lineHeight:1.2,marginBottom:2 }}>
                        {p.emoji} {p.name.length > 16 ? p.name.slice(0,16)+'…' : p.name}
                      </div>
                      <div style={{ fontSize:10,color:mode==='dark'?'#888':'#7A6050',marginBottom:4 }}>{p.nbh}</div>
                      <div style={{ fontSize:11,color:'#E67C00',fontWeight:700 }}>
                        ★ {p.rating.toFixed(1)}
                        {p.hours && <span style={{ color:p.color,marginLeft:6,fontWeight:600 }}>· {p.hours.split('–')[0]}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SavedScreen({ favs, onFav, onOpen, th }: { favs:Set<string>, onFav:(p:Place)=>void, onOpen:(p:Place)=>void, th:typeof T.light }) {
  const list = PLACES.filter(p=>favs.has(p.id))
  return (
    <div style={{ padding:'16px',maxWidth:640,margin:'0 auto' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:24,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif",marginBottom:4 }}>❤️ Salvos</div>
        <div style={{ fontSize:12,color:th.textSec,fontWeight:600 }}>{list.length} local(is) · <span style={{ color:th.green }}>{list.filter(p=>p.open).length} abertos</span></div>
      </div>
      {list.length===0
        ? <div style={{ textAlign:'center',padding:'52px 20px',color:th.textMuted }}><div style={{ fontSize:48,marginBottom:16 }}>🤍</div><div style={{ fontSize:16,color:th.textSec,fontWeight:700,marginBottom:8,fontFamily:"'Playfair Display',serif" }}>Nenhum local salvo</div><div>Toque no 🤍 em qualquer estabelecimento</div></div>
        : <div style={{ display:'flex',flexDirection:'column',gap:10 }}>{list.map(p=><Card key={p.id} place={p} isFav={true} onOpen={onOpen} onFav={onFav} th={th}/>)}</div>
      }
    </div>
  )
}

function ProfileScreen({ onAdmin, showMsg, th, user, onLogin, onLogout }: {
  onAdmin:()=>void, showMsg:(m:string,t:string)=>void, th:typeof T.light,
  user: any, onLogin:()=>void, onLogout:()=>void }) {
  const [n1, setN1] = useState(true)
  const Tog = ({ v, set }: { v:boolean, set:(b:boolean)=>void }) => (
    <div onClick={()=>set(!v)} style={{ width:44,height:24,borderRadius:12,background:v?th.accent:th.bgInput,border:`1.5px solid ${v?th.accent:th.border}`,cursor:'pointer',position:'relative',transition:'all .2s' }}>
      <div style={{ position:'absolute',top:3,left:v?22:3,width:16,height:16,borderRadius:'50%',background:v?'#fff':'#B09880',transition:'all .2s' }}/>
    </div>
  )
  return (
    <div style={{ padding:'16px',maxWidth:640,margin:'0 auto' }}>
      {/* User card */}
      <div style={{ background:`linear-gradient(135deg,${th.accentBg},#fff)`,border:`2px solid ${th.accent}30`,borderRadius:20,padding:20,marginBottom:14,display:'flex',alignItems:'center',gap:14 }}>
        {user?.user_metadata?.avatar_url
          ? <img src={user.user_metadata.avatar_url} alt="" style={{ width:62,height:62,borderRadius:'50%',objectFit:'cover',border:`3px solid ${th.accent}44` }}/>
          : <div style={{ width:62,height:62,borderRadius:'50%',background:`linear-gradient(135deg,${th.accent},#ff8c42)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>👤</div>
        }
        <div style={{ flex:1 }}>
          {user ? (
            <>
              <div style={{ fontSize:18,fontWeight:800,color:th.textPrimary,marginBottom:2,fontFamily:"'Playfair Display',serif" }}>{user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'}</div>
              <div style={{ fontSize:11,color:th.textSec,marginBottom:10 }}>{user.email}</div>
              <button onClick={onLogout} style={{ background:'transparent',border:`1.5px solid ${th.border}`,borderRadius:20,padding:'5px 14px',color:th.textSec,fontSize:12,fontWeight:700,cursor:'pointer' }}>Sair</button>
            </>
          ) : (
            <>
              <div style={{ fontSize:16,fontWeight:800,color:th.textPrimary,marginBottom:2 }}>Visitante</div>
              <div style={{ fontSize:12,color:th.textSec,marginBottom:10 }}>Entre para salvar favoritos e avaliar</div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={onLogin} style={{ background:th.accent,border:'none',borderRadius:20,padding:'6px 16px',color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',boxShadow:`0 3px 10px ${th.accent}55` }}>Entrar</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:16,padding:16,marginBottom:12 }}>
        <div style={{ fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:10,fontWeight:700 }}>NOTIFICAÇÕES</div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0' }}>
          <div><div style={{ fontSize:14,color:th.textPrimary,fontWeight:600 }}>Locais abertos hoje</div><div style={{ fontSize:11,color:th.textSec,marginTop:2 }}>Avise quando um favorito abrir</div></div>
          <Tog v={n1} set={setN1}/>
        </div>
      </div>

      <div style={{ background:`linear-gradient(135deg,${th.accentBg},#fff)`,border:`2px solid ${th.accent}40`,borderRadius:16,padding:16,marginBottom:12 }}>
        <div style={{ fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:9,fontWeight:700 }}>ÁREA DO ESTABELECIMENTO</div>
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
          <span style={{ fontSize:24 }}>🏪</span>
          <div><div style={{ fontSize:15,fontWeight:800,color:th.textPrimary }}>É dono de um local?</div><div style={{ fontSize:12,color:th.textSec }}>Gerencie horários, fotos e atualizações.</div></div>
        </div>
        <button onClick={onAdmin} style={{ width:'100%',background:th.accent,border:'none',borderRadius:12,padding:'13px',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',boxSizing:'border-box',boxShadow:`0 4px 16px ${th.accent}55` }}>Acessar Painel →</button>
      </div>

      <div style={{ textAlign:'center',padding:'12px 0 8px',fontSize:11,color:th.textMuted,fontWeight:600 }}>Feito com ♥ em Pelotas</div>
    </div>
  )
}

function AdminLogin({ onEnter, onBack, th }: { onEnter:(e:Place)=>void, onBack:()=>void, th:typeof T.light }) {
  const [sel, setSel] = useState<Place|null>(null)
  return (
    <div style={{ padding:'16px',maxWidth:500,margin:'0 auto' }}>
      <button onClick={onBack} style={{ background:'none',border:'none',color:th.textSec,cursor:'pointer',fontSize:14,marginBottom:16,display:'flex',alignItems:'center',gap:5,fontWeight:600 }}>← Voltar</button>
      <div style={{ fontSize:24,fontWeight:900,color:th.textPrimary,fontFamily:"'Playfair Display',serif",marginBottom:4 }}>🏪 Painel</div>
      <div style={{ fontSize:12,color:th.textSec,marginBottom:14,fontWeight:600 }}>Selecione seu estabelecimento</div>
      <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
        {PLACES.map(e => (
          <div key={e.id} onClick={()=>setSel(e)} style={{ background:sel?.id===e.id?e.color+'15':th.bgCard,border:`1.5px solid ${sel?.id===e.id?e.color:th.border}`,borderRadius:14,padding:'12px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'all .15s' }}>
            <span style={{ fontSize:24 }}>{e.emoji}</span>
            <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:800,color:th.textPrimary }}>{e.name}</div><div style={{ fontSize:11,color:th.textSec }}>📍 {e.nbh}</div></div>
            <PlanBadge plan={e.plan} th={th}/>
          </div>
        ))}
      </div>
      <button onClick={()=>sel&&onEnter(sel)} disabled={!sel} style={{ width:'100%',background:th.accent,border:'none',borderRadius:12,padding:'13px',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',boxSizing:'border-box',opacity:!sel?.id?0.5:1 }}>Entrar →</button>
    </div>
  )
}

function AdminPanel({ estab, onBack, showMsg, th }: { estab:Place, onBack:()=>void, showMsg:(m:string,t:string)=>void, th:typeof T.light }) {
  const [tab, setTab] = useState('today')
  const TABS = [{id:'today',icon:'📣',lbl:'Hoje'},{id:'sched',icon:'🕐',lbl:'Horários'},{id:'profile',icon:'📝',lbl:'Perfil'},{id:'stats',icon:'📊',lbl:'Stats'}]
  const e = estab
  return (
    <div style={{ background:th.bg,minHeight:'100vh' }}>
      <div style={{ background:th.headerBg,borderBottom:`1.5px solid ${th.border}`,padding:'11px 16px',position:'sticky',top:0,zIndex:500,backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:640,margin:'0 auto',display:'flex',alignItems:'center',gap:10 }}>
          <button onClick={onBack} style={{ background:'none',border:'none',color:th.textSec,cursor:'pointer',fontSize:20,padding:0 }}>←</button>
          <span style={{ fontSize:18,fontFamily:"'Playfair Display',serif",fontWeight:900,color:th.accent,letterSpacing:-1 }}>TÔNICO</span>
          <div style={{ width:1,height:16,background:th.border }}/>
          <span style={{ fontSize:18 }}>{e.emoji}</span>
          <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:800,color:th.textPrimary,lineHeight:1 }}>{e.name}</div><div style={{ fontSize:10,color:th.textSec }}>{e.nbh}</div></div>
          <PlanBadge plan={e.plan} th={th}/>
        </div>
      </div>
      <div style={{ background:th.headerBg,borderBottom:`1px solid ${th.border}`,padding:'0 16px' }}>
        <div style={{ maxWidth:640,margin:'0 auto',display:'flex',overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:'0 0 auto',background:'none',border:'none',borderBottom:`2.5px solid ${tab===t.id?e.color:'transparent'}`,color:tab===t.id?e.color:th.textSec,padding:'11px 12px',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?800:500,display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap' }}>
              {t.icon} {t.lbl}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:640,margin:'0 auto',padding:'16px 16px 40px' }}>
        {tab==='today'&&<ATodayTab e={e} msg={showMsg} th={th}/>}
        {tab==='sched'&&<ASchedTab e={e} msg={showMsg} th={th}/>}
        {tab==='profile'&&<AProfileTab e={e} msg={showMsg} th={th}/>}
        {tab==='stats'&&<AStatsTab e={e} th={th}/>}
      </div>
    </div>
  )
}

function ATodayTab({ e, msg, th }: { e:Place, msg:(m:string,t:string)=>void, th:typeof T.light }) {
  const [text, setText] = useState(e.update||'')
  const [saved, setSaved] = useState(!!e.update)
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  if (!e.hasDU) return <div style={{ background:th.bgCard,border:`1.5px dashed ${th.border}`,borderRadius:14,padding:28,textAlign:'center' }}><div style={{ fontSize:32,marginBottom:10 }}>🔒</div><div style={{ color:th.textSec,fontWeight:600 }}>Disponível nos planos PRO e PREMIUM</div></div>
  const save = async () => { setBusy(true); try { if (saved) await runSQL(`UPDATE daily_updates SET content='${esc(text)}' WHERE establishment_id='${e.id}' AND update_date='${today}'`); else await runSQL(`INSERT INTO daily_updates(establishment_id,content,update_date)VALUES('${e.id}','${esc(text)}','${today}')`); setSaved(true); msg('Publicado!','success') } catch { msg('Erro.','error') } setBusy(false) }
  return (
    <div>
      <p style={{ fontSize:13,color:th.textSec,marginBottom:14,lineHeight:1.6 }}>Esta mensagem aparece em destaque no seu card hoje.</p>
      <textarea value={text} onChange={ev=>setText(ev.target.value)} rows={5} placeholder="Ex: Feijoada hoje! Happy hour 17h–19h. Música ao vivo às 20h!" style={{ width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:12,padding:'11px 13px',color:th.textPrimary,fontSize:14,outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',marginBottom:8 }}/>
      <div style={{ fontSize:11,color:th.textMuted,marginBottom:12 }}>{text.length}/280</div>
      {saved&&<div style={{ background:th.greenBg,border:`1.5px solid ${th.green}44`,borderRadius:10,padding:'8px 13px',fontSize:12,color:th.green,marginBottom:12,fontWeight:700 }}>✓ Publicado · visível no app agora</div>}
      <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
        <button onClick={save} disabled={busy||!text.trim()} style={{ background:th.green,border:'none',borderRadius:10,padding:'11px 20px',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',opacity:busy||!text.trim()?0.5:1 }}>{busy?'⏳':saved?'Atualizar':'Publicar'}</button>
      </div>
    </div>
  )
}

function ASchedTab({ e, msg, th }: { e:Place, msg:(m:string,t:string)=>void, th:typeof T.light }) {
  const init = () => { const m: Record<string,{closed:boolean,op:string,cl:string}> = {}; DAYS_K.forEach(dk=>{ const s=(e.sch as any)[dk]; m[dk]={closed:!s,op:s?s[0]:'18:00',cl:s?s[1]:'00:00'} }); return m }
  const [sch, setSch] = useState(init)
  const [busy, setBusy] = useState(false)
  const upd = (dk: string, f: string, v: any) => setSch(p=>({...p,[dk]:{...p[dk],[f]:v}}))
  const save = async () => { setBusy(true); try { for (const dk of DAYS_K) { const s=sch[dk]; await runSQL(`INSERT INTO schedules(establishment_id,day,closed,opens_at,closes_at)VALUES('${e.id}','${dk}',${s.closed},${s.closed?'NULL':"'"+s.op+"'"},${s.closed?'NULL':"'"+s.cl+"'"}) ON CONFLICT(establishment_id,day) DO UPDATE SET closed=${s.closed},opens_at=${s.closed?'NULL':"'"+s.op+"'"},closes_at=${s.closed?'NULL':"'"+s.cl+"'"}`) } msg('Horários salvos!','success') } catch { msg('Erro.','error') } setBusy(false) }
  return (
    <div>
      {DAYS_K.map((dk,i) => { const s=sch[dk],isToday=i===DOW; return (
        <div key={dk} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<6?`1px solid ${th.border}`:'none' }}>
          <div style={{ width:60,flexShrink:0 }}><div style={{ fontSize:12,fontWeight:isToday?800:500,color:isToday?e.color:th.textSec }}>{DAYS_F[i].slice(0,3)}</div>{isToday&&<div style={{ fontSize:9,color:e.color,letterSpacing:1,fontWeight:800 }}>HOJE</div>}</div>
          <div onClick={()=>upd(dk,'closed',!s.closed)} style={{ width:44,height:24,borderRadius:12,background:s.closed?th.bgInput:e.color+'55',border:`1.5px solid ${s.closed?th.border:e.color}`,cursor:'pointer',position:'relative',transition:'all .2s',flexShrink:0 }}><div style={{ position:'absolute',top:3,left:s.closed?3:22,width:16,height:16,borderRadius:'50%',background:s.closed?'#ccc':e.color,transition:'all .2s' }}/></div>
          <div style={{ fontSize:11,color:s.closed?th.textMuted:th.textSec,width:52,flexShrink:0,fontWeight:600 }}>{s.closed?'Fechado':'Aberto'}</div>
          {!s.closed&&<div style={{ display:'flex',alignItems:'center',gap:6,flex:1 }}><input type="time" value={s.op} onChange={ev=>upd(dk,'op',ev.target.value)} style={{ background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:8,padding:'4px 8px',color:th.textPrimary,fontSize:13,outline:'none',width:86 }}/><span style={{ color:th.textMuted }}>–</span><input type="time" value={s.cl} onChange={ev=>upd(dk,'cl',ev.target.value)} style={{ background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:8,padding:'4px 8px',color:th.textPrimary,fontSize:13,outline:'none',width:86 }}/></div>}
        </div>
      )})}
      <div style={{ display:'flex',justifyContent:'flex-end',marginTop:16 }}><button onClick={save} disabled={busy} style={{ background:th.accent,border:'none',borderRadius:10,padding:'11px 20px',color:'#fff',fontWeight:700,cursor:'pointer' }}>{busy?'⏳':'Salvar Horários'}</button></div>
    </div>
  )
}

function AProfileTab({ e, msg, th }: { e:Place, msg:(m:string,t:string)=>void, th:typeof T.light }) {
  const [f, setF] = useState({ desc:e.desc,phone:e.phone,wa:e.wa,ig:e.ig,addr:e.addr,hl:e.hl })
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (v: string) => setF(p=>({...p,[k]:v}))
  const save = async () => { setBusy(true); try { await runSQL(`UPDATE establishments SET description='${esc(f.desc)}',phone='${esc(f.phone)}',whatsapp='${esc(f.wa)}',instagram='${esc(f.ig)}',address='${esc(f.addr)}',highlight_text='${esc(f.hl)}',updated_at=now() WHERE id='${e.id}'`); msg('Perfil salvo!','success') } catch { msg('Erro.','error') } setBusy(false) }
  const Inp = ({ label, k, ph }: { label:string,k:string,ph:string }) => (
    <div style={{ marginBottom:11 }}>
      <div style={{ fontSize:10,color:th.textMuted,letterSpacing:1,marginBottom:5,fontWeight:700 }}>{label}</div>
      <input value={(f as any)[k]||''} onChange={ev=>set(k)(ev.target.value)} placeholder={ph} style={{ width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:9,padding:'8px 12px',color:th.textPrimary,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
    </div>
  )
  return (
    <div>
      <div style={{ marginBottom:11 }}><div style={{ fontSize:10,color:th.textMuted,letterSpacing:1,marginBottom:5,fontWeight:700 }}>DESCRIÇÃO</div><textarea value={f.desc||''} onChange={ev=>set('desc')(ev.target.value)} rows={3} style={{ width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:9,padding:'8px 12px',color:th.textPrimary,fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box' }}/></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <Inp label="TELEFONE" k="phone" ph="(53) 99999-0000"/>
        <Inp label="WHATSAPP" k="wa" ph="5553999..."/>
        <Inp label="INSTAGRAM" k="ig" ph="@seulocal"/>
      </div>
      <Inp label="ENDEREÇO" k="addr" ph="Rua Exemplo, 123"/>
      {e.hasHL&&<Inp label="DESTAQUE" k="hl" ph="Ex: Pizza R$22"/>}
      <div style={{ display:'flex',justifyContent:'flex-end',marginTop:6 }}><button onClick={save} disabled={busy} style={{ background:th.accent,border:'none',borderRadius:10,padding:'11px 20px',color:'#fff',fontWeight:700,cursor:'pointer' }}>{busy?'⏳':'Salvar'}</button></div>
    </div>
  )
}

function AStatsTab({ e, th }: { e:Place, th:typeof T.light }) {
  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
        {[{icon:'⭐',v:e.rating.toFixed(1),l:'Avaliação',c:th.gold},{icon:'💬',v:e.reviews,l:'Avaliações',c:'#0076CC'},{icon:'👁️',v:'—',l:'Views hoje',c:'#7B1FA2'},{icon:'🤍',v:'—',l:'Salvos',c:th.red}].map(s=>(
          <div key={s.l} style={{ background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:14,padding:16,textAlign:'center' }}>
            <div style={{ fontSize:24,marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:26,fontWeight:900,color:s.c,lineHeight:1,fontFamily:"'Playfair Display',serif" }}>{s.v}</div>
            <div style={{ fontSize:10,color:th.textSec,marginTop:6,fontWeight:600 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {!e.hasFT&&<div style={{ background:th.accentBg,border:`1.5px dashed ${th.accent}55`,borderRadius:14,padding:16 }}><div style={{ fontSize:14,fontWeight:800,color:th.accent,marginBottom:6 }}>🚀 Stats detalhados no PREMIUM</div><div style={{ fontSize:13,color:th.textSec }}>Visualizações diárias, origens e conversões.</div></div>}
    </div>
  )
}

/* ─── ROOT ─────────────────────────────────────────────────── */
export default function App() {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [screen, setScreen] = useState('home')
  const [sel, setSel] = useState<Place|null>(null)
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [admin, setAdmin] = useState<Place|null>(null)
  const [toast, setToast] = useState<{msg:string,type:string}|null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const th = T[mode]

  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, saveFavorite, removeFavorite, getFavorites } = useAuth()

  // Load favorites from DB when user logs in
  useEffect(() => {
    if (user) {
      getFavorites().then(ids => setFavs(new Set(ids)))
    }
  }, [user])

  const showMsg = useCallback((msg: string, type='success') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null), 2600)
  }, [])

  const toggleFav = useCallback(async (p: Place) => {
    const has = favs.has(p.id)
    setFavs(prev => { const n=new Set(prev); has?n.delete(p.id):n.add(p.id); return n })
    if (user) { has ? await removeFavorite(p.id) : await saveFavorite(p.id) }
  }, [favs, user])

  const handleReview = useCallback(async (eid: string, rating: number, comment: string) => {
    if (!user) { showMsg('Entre para avaliar','info'); return }
    try {
      await runSQL(`INSERT INTO reviews(user_id,establishment_id,rating,comment)VALUES('${user.id}','${eid}',${rating},'${esc(comment)}')`)
      showMsg('Avaliação enviada! Obrigado 🙏','success')
    } catch { showMsg('Erro ao enviar.','error') }
  }, [user, showMsg])

  const NAV = [{id:'home',icon:'🏠',lbl:'Início'},{id:'map',icon:'🗺️',lbl:'Mapa'},{id:'saved',icon:'❤️',lbl:'Salvos'},{id:'profile',icon:'👤',lbl:'Perfil'}]
  const isAdmin = screen==='admin_login'||screen==='admin_panel'

  const ThemeBtn = (
    <button onClick={()=>setMode(m=>m==='light'?'dark':'light')}
      style={{ background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:20,padding:'5px 11px',cursor:'pointer',fontSize:13,fontWeight:700,color:th.textSec,display:'flex',alignItems:'center',gap:5 }}>
      {mode==='light'?'🌙':'☀️'}
    </button>
  )

  if (loading) return (
    <div style={{ background:th.bg,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:th.accent,letterSpacing:-1 }}>
      TÔNICO
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${th.border}; border-radius: 2px; }
        input[type=time]::-webkit-calendar-picker-indicator { filter: ${mode==='dark'?'invert(1)':'none'}; opacity:.5; }
      `}</style>

      <div style={{ background:th.bg,minHeight:'100vh',fontFamily:"'DM Sans',sans-serif",color:th.textPrimary,paddingBottom:isAdmin?0:68,transition:'background .3s' }}>
        {toast&&<Toast msg={toast.msg} type={toast.type} mode={mode}/>}

        {screen==='home'       &&<HomeScreen    favs={favs} onFav={toggleFav} onOpen={setSel} th={th} themeBtn={ThemeBtn}/>}
        {screen==='map'        &&<MapScreen     th={th} mode={mode} onOpen={setSel}/>}
        {screen==='saved'      &&<SavedScreen   favs={favs} onFav={toggleFav} onOpen={setSel} th={th}/>}
        {screen==='profile'    &&<ProfileScreen onAdmin={()=>setScreen('admin_login')} showMsg={showMsg} th={th} user={user} onLogin={()=>setShowAuth(true)} onLogout={()=>{signOut();showMsg('Saiu!','info')}}/>}
        {screen==='admin_login'&&<AdminLogin    onEnter={e=>{setAdmin(e);setScreen('admin_panel')}} onBack={()=>setScreen('profile')} th={th}/>}
        {screen==='admin_panel'&&admin&&<AdminPanel estab={admin} onBack={()=>{setAdmin(null);setScreen('profile')}} showMsg={showMsg} th={th}/>}

        {!isAdmin&&(
          <div style={{ position:'fixed',bottom:0,left:0,right:0,background:th.navBg,borderTop:`1.5px solid ${th.navBorder}`,display:'flex',zIndex:300,boxShadow:`0 -4px 20px ${mode==='light'?'rgba(0,0,0,.06)':'rgba(0,0,0,.4)'}` }}>
            {NAV.map(n => {
              const active = n.id===screen
              const badge = n.id==='saved'&&favs.size>0
              return (
                <button key={n.id} onClick={()=>setScreen(n.id)} style={{ flex:1,background:'none',border:'none',color:active?th.accent:th.textMuted,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',padding:'9px 0 12px',position:'relative',transition:'color .15s' }}>
                  {badge&&<div style={{ position:'absolute',top:6,right:'calc(50% - 18px)',width:17,height:17,background:th.accent,borderRadius:'50%',fontSize:9,color:'#fff',fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center' }}>{favs.size}</div>}
                  <span style={{ fontSize:18 }}>{n.icon}</span>
                  <span style={{ fontSize:9,fontWeight:active?800:500 }}>{n.lbl}</span>
                  {active&&<div style={{ position:'absolute',bottom:0,width:30,height:2.5,background:th.accent,borderRadius:2 }}/>}
                </button>
              )
            })}
          </div>
        )}

        {sel&&<Detail place={sel} isFav={favs.has(sel.id)} onFav={toggleFav} onClose={()=>setSel(null)} showMsg={showMsg} onReview={handleReview} th={th} user={user}/>}
        {showAuth&&<AuthModal th={th} onClose={()=>setShowAuth(false)} onGoogle={signInWithGoogle} onEmailSignIn={async (e: string, p: string)=>{ const {error}=await signInWithEmail(e,p); if(error)throw error; showMsg('Bem-vindo!','success'); setShowAuth(false) }} onEmailSignUp={async (e: string, p: string, n: string)=>{ const {error}=await signUpWithEmail(e,p,n); if(error)throw error; showMsg('Conta criada! Verifique seu email.','success'); setShowAuth(false) }}/>}
      </div>
    </>
  )
}
