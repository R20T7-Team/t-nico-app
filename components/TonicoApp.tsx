'use client'
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import AuthModal from './AuthModal'

/* ── Theme ── */
const ThemeCtx = createContext<'light'|'dark'>('light')
const useTheme = () => useContext(ThemeCtx)

const T = {
  light: {
    bg:'#FFF8F0',bgCard:'#FFFFFF',bgCard2:'#FFF3E8',bgInput:'#F5EDE3',
    border:'#E8D5C0',textPrimary:'#1A0F00',textSec:'#7A6050',textMuted:'#B09880',
    accent:'#FF4D1C',accentBg:'#FFF0EB',gold:'#E67C00',
    green:'#1B7A3E',greenBg:'#E8F7EF',red:'#D63A2A',redBg:'#FDECEA',
    navBg:'#FFFFFF',navBorder:'#EEE0D0',headerBg:'rgba(255,248,240,.95)',
    shadow:'0 2px 12px rgba(200,120,60,.1)',shadowHover:'0 6px 28px rgba(200,100,40,.18)',
    toastBg:'#1A0F00',
  },
  dark: {
    bg:'#060606',bgCard:'#0c0c0c',bgCard2:'#100800',bgInput:'#111',
    border:'#181818',textPrimary:'#FFFFFF',textSec:'#888',textMuted:'#444',
    accent:'#E8580A',accentBg:'#1a0800',gold:'#FFB300',
    green:'#4caf50',greenBg:'#061506',red:'#ef5350',redBg:'#1a0303',
    navBg:'#090909',navBorder:'#0f0f0f',headerBg:'rgba(9,9,9,.95)',
    shadow:'none',shadowHover:'0 4px 24px rgba(232,88,10,.18)',
    toastBg:'#111',
  }
}

/* ── helpers ── */
const goTo  = (url: string) => { try { window.open(url,'_blank','noopener') } catch(e){} }
const mUrl  = (a: string, c: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a+', '+c)}`
const waUrl = (n: string) => `https://wa.me/${n.replace(/\D/g,'')}`
const igUrl = (h: string) => `https://instagram.com/${h.replace('@','')}`
const esc   = (s: string) => (s||'').replace(/'/g,"''")

const DAYS_K = ['sun','mon','tue','wed','thu','fri','sat'] as const
const DAYS_S = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DAYS_F = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const DOW = new Date().getDay()

/* ── Static data ── */
const SCH: Record<string, Record<string, [string,string]|null>> = {
  'e5d33de3':{sun:null,mon:null,tue:null,wed:null,thu:['18:00','23:00'],fri:['17:00','23:59'],sat:['16:00','22:00']},
  'd63389f3':{sun:null,mon:null,tue:null,wed:null,thu:['23:00','05:00'],fri:['23:00','06:00'],sat:['22:00','05:00']},
  'adcee130':{sun:['12:00','15:00'],mon:null,tue:['12:00','15:00'],wed:['12:00','15:00'],thu:['12:00','22:30'],fri:['12:00','23:00'],sat:['12:00','23:00']},
  '89f40a8f':{sun:null,mon:null,tue:['18:00','00:00'],wed:['18:00','00:00'],thu:['18:00','01:00'],fri:['17:00','02:00'],sat:['16:00','02:00']},
  '61231732':{sun:['10:00','18:00'],mon:['08:00','19:00'],tue:['08:00','19:00'],wed:['08:00','19:00'],thu:['08:00','20:00'],fri:['08:00','20:00'],sat:['09:00','19:00']},
  'a9c9b9bf':{sun:['18:00','23:00'],mon:null,tue:null,wed:['18:00','23:00'],thu:['18:00','23:30'],fri:['18:00','00:00'],sat:['18:00','00:00']},
}
const PH: Record<string,{url:string,c:string}[]> = {
  'e5d33de3':[{url:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80',c:'Show'},{url:'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',c:'Palco'},{url:'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',c:'Plateia'}],
  'd63389f3':[{url:'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',c:'Pista'},{url:'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=600&q=80',c:'DJ'},{url:'https://images.unsplash.com/photo-1598387993441-a364f854cfa4?w=600&q=80',c:'VIP'}],
  'adcee130':[{url:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',c:'Salão'},{url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',c:'Prato'},{url:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',c:'Mesa'},{url:'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80',c:'Risoto'}],
  '89f40a8f':[{url:'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',c:'Bar'},{url:'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80',c:'Chope'},{url:'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&q=80',c:'Petiscos'},{url:'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=600&q=80',c:'Música'}],
  '61231732':[{url:'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',c:'Café'},{url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',c:'Coffee'},{url:'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80',c:'Brunch'},{url:'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80',c:'Bolo'}],
  'a9c9b9bf':[{url:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',c:'Pizza'},{url:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',c:'Forno'},{url:'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600&q=80',c:'Amb.'},{url:'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&q=80',c:'Arte'}],
}

function calcOpen(key: string): boolean {
  const s=SCH[key]; if(!s) return false
  const slot=s[DAYS_K[DOW]]; if(!slot) return false
  const now=new Date().getHours()*60+new Date().getMinutes()
  const[oh,om]=slot[0].split(':').map(Number)
  const[ch]=slot[1].split(':').map(Number)
  const op=oh*60+om, cl=(Number(slot[1].split(':')[0]))*60+Number(slot[1].split(':')[1])+(ch<oh?1440:0)
  return now>=op && now<cl
}
function todayHours(key: string): string|null {
  const s=SCH[key]; if(!s) return null
  const slot=s[DAYS_K[DOW]]
  return slot?`${slot[0]}–${slot[1]}`:null
}

interface Place {
  id:string; name:string; type:string; plan:string; color:string; emoji:string;
  nbh:string; phone:string; wa:string; ig:string; hl:string; desc:string; addr:string;
  rating:number; reviews:number; hasDU:boolean; hasHL:boolean; hasFT:boolean; maxPh:number;
  update:string|null; photos:{url:string;c:string}[]; sch:Record<string,[string,string]|null>;
  open:boolean; hours:string|null;
}

const RAW_DATA = [
  {id:'e5d33de3-436d-4191-9735-816b6c74a796',name:'Festival de Jazz',type:'event',plan:'premium',color:'#7B1FA2',emoji:'🎷',nbh:'Centro',phone:'(53) 99999-0003',wa:'5353999990003',ig:'festivaldejazzpel',hl:'Entrada gratuita!',desc:'3 dias de jazz ao ar livre com artistas nacionais e locais.',addr:'Parque Dom Antônio Zattera',rating:5.0,reviews:89,hasDU:true,hasHL:true,hasFT:true,maxPh:20,update:'Line-up: Quarteto Sul às 19h, Banda Alma Jazz às 21h!'},
  {id:'d63389f3-733f-4fff-8cf3-f81ac1a1383f',name:'Club Onze',type:'club',plan:'premium',color:'#0097A7',emoji:'🎶',nbh:'Centro',phone:'(53) 99999-0005',wa:'5353999990005',ig:'clubonze_oficial',hl:'Open bar até meia-noite',desc:'A melhor pista da região. Sets de DJs nacionais toda semana.',addr:'Rua Marechal Floriano, 11',rating:4.5,reviews:267,hasDU:true,hasHL:true,hasFT:true,maxPh:20,update:'DJ Mateus Lima essa noite! Open bar premium até 00h.'},
  {id:'adcee130-8cd7-4e84-9097-ea6259ef9986',name:'Bistrô da Praça',type:'restaurant',plan:'pro',color:'#2E7D32',emoji:'🍽️',nbh:'Centro',phone:'(53) 99999-0002',wa:'5353999990002',ig:'bistrodapraca',hl:'Prato executivo R$35',desc:'Culinária contemporânea com ingredientes locais e sazonais.',addr:'Praça Coronel Pedro Osório, 88',rating:4.9,reviews:198,hasDU:true,hasHL:true,hasFT:false,maxPh:8,update:'Hoje: Risoto de funghi + Tiramisu. Reserve pelo WhatsApp!'},
  {id:'89f40a8f-6ee0-433c-b283-80f6763fd3d0',name:'Bar do Canto',type:'bar',plan:'pro',color:'#E8580A',emoji:'🍺',nbh:'Centro',phone:'(53) 99999-0001',wa:'5353999990001',ig:'bardocanto_pel',hl:'Música ao vivo toda sexta!',desc:'O melhor boteco da cidade, petiscos variados e chope gelado.',addr:'Rua XV de Novembro, 420',rating:4.7,reviews:312,hasDU:true,hasHL:true,hasFT:false,maxPh:8,update:'Trio elétrico às 20h! Chope 20% off até 19h.'},
  {id:'61231732-b2cb-491d-8ce9-2165a7ec4b71',name:'Café Cultura',type:'cafe',plan:'basic',color:'#5D4037',emoji:'☕',nbh:'Areal',phone:'(53) 99999-0004',wa:'5353999990004',ig:'cafecultura.pel',hl:'Brunch aos domingos',desc:'Specialty coffee, bolos artesanais e ambiente acolhedor.',addr:'Rua Andrade Neves, 210',rating:4.8,reviews:445,hasDU:false,hasHL:false,hasFT:false,maxPh:1,update:null},
  {id:'a9c9b9bf-b7de-4570-bb87-f93ba2cc8866',name:'Pizzaria Napoli',type:'restaurant',plan:'basic',color:'#C62828',emoji:'🍕',nbh:'São Gonçalo',phone:'(53) 99999-0006',wa:'5353999990006',ig:'pizzarianapolipel',hl:'Pizza brotinho R$22',desc:'Pizzas artesanais assadas em forno a lenha desde 1985.',addr:'Av. Bento Gonçalves, 550',rating:4.6,reviews:523,hasDU:false,hasHL:false,hasFT:false,maxPh:1,update:null},
]

const PLACES: Place[] = RAW_DATA.map(e => {
  const key = e.id.slice(0,8)
  return { ...e, photos:PH[key]||[], sch:SCH[key]||{}, open:calcOpen(key), hours:todayHours(key) }
})

const CATS = [{id:'all',icon:'⚡',lbl:'Todos'},{id:'bar',icon:'🍺',lbl:'Bares'},{id:'restaurant',icon:'🍽️',lbl:'Restaurantes'},{id:'event',icon:'🎉',lbl:'Eventos'},{id:'cafe',icon:'☕',lbl:'Cafés'},{id:'club',icon:'🎶',lbl:'Baladas'}]

/* ── Supabase SQL proxy ── */
async function runSQL(q: string) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:2000,
        system:`Proxy SQL Supabase "wbahygrqilfqsdjvnwtd". Execute via MCP. Retorne SOMENTE JSON válido.`,
        messages:[{role:'user',content:q}],
        mcp_servers:[{type:'url',url:'https://mcp.supabase.com/mcp',name:'supabase'}] })
    })
    const d = await r.json()
    const t = (d.content||[]).filter((b: any)=>b.type==='text').map((b: any)=>b.text).join('').replace(/```json|```/g,'').trim()
    const m = t.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
    return m ? JSON.parse(m[0]) : {}
  } catch(e) { return { error: (e as Error).message } }
}

/* ── useT hook ── */
function useT() { return T[useTheme()] }

/* ── Toast ── */
function Toast({ msg, type, mode }: { msg:string; type:string; mode:string }) {
  const c: Record<string,string> = { success:'#1B7A3E', error:'#D63A2A', info:'#0076CC' }
  const th = T[mode as 'light'|'dark']
  return (
    <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',
      background:th.toastBg,color:c[type]||c.info,border:`1.5px solid ${c[type]||c.info}`,
      borderRadius:12,padding:'10px 18px',fontSize:13,fontWeight:700,zIndex:9999,
      whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.15)'}}>
      {type==='success'?'✓':type==='error'?'✕':'ℹ'} {msg}
    </div>
  )
}

/* ── Btn ── */
function Btn({ onClick, children, color, ghost, disabled, loading, sm, full }: any) {
  const th = useT()
  const bg = ghost?'transparent':disabled?th.border:color||th.accent
  const cl = ghost?(color||th.accent):disabled?th.textMuted:'#fff'
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      background:bg, border:`1.5px solid ${ghost?(color||th.accent)+'88':'transparent'}`,
      color:cl, borderRadius:10, padding:sm?'7px 14px':'11px 20px',
      fontWeight:700, fontSize:sm?12:14, cursor:disabled||loading?'not-allowed':'pointer',
      opacity:loading?.6:1, display:'inline-flex', alignItems:'center',
      justifyContent:'center', gap:6, width:full?'100%':'auto',
      boxSizing:'border-box', transition:'all .15s', fontFamily:'DM Sans, sans-serif'}}>
      {loading?'⏳':null}{children}
    </button>
  )
}

/* ── ActionBtn ── */
function ABt({ icon, label, onClick, color }: { icon:string; label:string; onClick:()=>void; color?:string }) {
  const th = useT()
  const c = color||th.accent
  return (
    <button onClick={onClick} style={{flex:1,background:th.bgCard,border:`1.5px solid ${th.border}`,
      borderRadius:12,padding:'10px 4px',cursor:'pointer',display:'flex',flexDirection:'column',
      alignItems:'center',gap:4,transition:'all .15s',minWidth:0,boxShadow:th.shadow}}
      onMouseEnter={e=>{const t=e.currentTarget;t.style.borderColor=c;t.style.background=c+'15';t.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{const t=e.currentTarget;t.style.borderColor=th.border;t.style.background=th.bgCard;t.style.transform='translateY(0)'}}>
      <span style={{fontSize:20}}>{icon}</span>
      <span style={{fontSize:9,color:th.textSec,fontWeight:700,whiteSpace:'nowrap',letterSpacing:.5}}>{label}</span>
    </button>
  )
}

/* ── Stars ── */
function Stars({ v, onChange, size=24 }: { v:number; onChange?:(n:number)=>void; size?:number }) {
  const [h,setH] = useState(0)
  return (
    <div style={{display:'flex',gap:2}}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange?.(n)}
          onMouseEnter={()=>onChange&&setH(n)} onMouseLeave={()=>setH(0)}
          style={{fontSize:size,cursor:onChange?'pointer':'default',color:(h||v)>=n?'#E67C00':'#ddd',transition:'color .1s'}}>★</span>
      ))}
    </div>
  )
}

/* ── PlanBadge ── */
function PlanBadge({ plan }: { plan:string }) {
  const th = useT(); const mode = useTheme()
  if (mode==='dark') {
    const d: Record<string,any> = {basic:{lbl:'Básico',c:'#666',bg:'#111'},pro:{lbl:'PRO',c:'#FFB300',bg:'#1a1200'},premium:{lbl:'★ PREMIUM',c:'#E8580A',bg:'#1a0800'}}
    const p = d[plan]||d.basic
    return <span style={{background:p.bg,color:p.c,border:`1px solid ${p.c}33`,borderRadius:20,padding:'2px 9px',fontSize:9,fontWeight:800}}>{p.lbl}</span>
  }
  const l: Record<string,any> = {basic:{lbl:'Básico',bg:th.border,c:th.textSec},pro:{lbl:'PRO',bg:'#FFF3CD',c:'#7A5200'},premium:{lbl:'★ PREMIUM',bg:'#FFF0EB',c:'#C63500'}}
  const p = l[plan]||l.basic
  return <span style={{background:p.bg,color:p.c,borderRadius:20,padding:'2px 9px',fontSize:9,fontWeight:800,letterSpacing:.5}}>{p.lbl}</span>
}

/* ── OpenBadge ── */
function OpenBadge({ isOpen }: { isOpen:boolean }) {
  const th = useT(); const mode = useTheme()
  if (mode==='dark') return <span style={{background:isOpen?'#061506':'#1a0303',color:isOpen?'#4caf50':'#ef5350',border:`1px solid ${isOpen?'#66bb6a33':'#ef535033'}`,borderRadius:20,padding:'3px 10px',fontSize:10,fontWeight:800,letterSpacing:.5}}>{isOpen?'● ABERTO':'● FECHADO'}</span>
  return <span style={{background:isOpen?th.greenBg:th.redBg,color:isOpen?th.green:th.red,borderRadius:20,padding:'3px 10px',fontSize:10,fontWeight:800,letterSpacing:.5}}>{isOpen?'● ABERTO':'● FECHADO'}</span>
}

/* ── SchedGrid ── */
function SchedGrid({ sch, color }: { sch:Record<string,[string,string]|null>; color:string }) {
  const th = useT(); const mode = useTheme()
  return (
    <div style={{display:'flex',gap:3}}>
      {DAYS_K.map((dk,i)=>{
        const isToday=i===DOW, slot=sch[dk]
        return (
          <div key={i} style={{flex:'0 0 auto',minWidth:36,padding:'3px 2px',borderRadius:6,textAlign:'center',
            background:isToday?(slot?color+'18':(mode==='light'?'#FDECEA':'#1a0505')):(slot?(mode==='light'?'#E8F7EF':'#0a150a'):(mode==='light'?th.bgCard2:'#0a0a0a')),
            border:`1px solid ${isToday?(slot?color:(mode==='light'?'#D63A2A':'#440000')):(slot?(mode==='light'?color+'40':color+'22'):th.border)}`}}>
            <div style={{fontSize:8,fontWeight:700,color:isToday?(slot?color:(mode==='light'?'#D63A2A':'#666')):(slot?(mode==='light'?color+'aa':color+'66'):th.textMuted)}}>{DAYS_S[i]}</div>
            <div style={{fontSize:8,marginTop:1,color:slot?(isToday?color:(mode==='light'?'#1B7A3E':'#4caf50')):(mode==='light'?'#D0B8A8':'#252525')}}>{slot?'●':'✕'}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── ThemeToggle ── */
function ThemeToggle({ mode, setMode }: { mode:string; setMode:(fn:(m:string)=>string)=>void }) {
  const th = T[mode as 'light'|'dark']
  return (
    <button onClick={()=>setMode(m=>m==='light'?'dark':'light')}
      style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:20,padding:'5px 11px',
        cursor:'pointer',fontSize:13,fontWeight:700,color:th.textSec,display:'flex',alignItems:'center',
        gap:5,transition:'all .2s',boxShadow:th.shadow}}>
      {mode==='light'?'🌙':'☀️'}
    </button>
  )
}

/* ── Lightbox ── */
function Lightbox({ photos, start, onClose }: { photos:{url:string;c:string}[]; start:number; onClose:()=>void }) {
  const [i,setI] = useState(start)
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{
      if(e.key==='Escape')onClose()
      if(e.key==='ArrowRight')setI(x=>(x+1)%photos.length)
      if(e.key==='ArrowLeft')setI(x=>(x-1+photos.length)%photos.length)
    }
    window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn)
  },[photos.length,onClose])
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.95)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <button onClick={onClose} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:'50%',width:36,height:36,fontSize:16,cursor:'pointer'}}>✕</button>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:680,width:'90vw'}}>
        <img src={photos[i]?.url} alt="" style={{width:'100%',maxHeight:'66vh',objectFit:'contain',borderRadius:12,display:'block'}}/>
        {photos[i]?.c&&<div style={{textAlign:'center',color:'rgba(255,255,255,.5)',fontSize:12,marginTop:8}}>{photos[i].c}</div>}
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12,alignItems:'center'}}>
          <button onClick={()=>setI(x=>(x-1+photos.length)%photos.length)} style={{background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:20}}>‹</button>
          <div style={{display:'flex',gap:5}}>{photos.map((_,j)=><div key={j} onClick={()=>setI(j)} style={{width:j===i?18:6,height:6,borderRadius:3,background:j===i?'#FF4D1C':'rgba(255,255,255,.3)',cursor:'pointer',transition:'all .2s'}}/>)}</div>
          <button onClick={()=>setI(x=>(x+1)%photos.length)} style={{background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:20}}>›</button>
        </div>
      </div>
    </div>
  )
}

/* ── ReviewModal ── */
function ReviewModal({ place, onClose, onSubmit }: { place:Place; onClose:()=>void; onSubmit:(id:string,r:number,c:string)=>Promise<void> }) {
  const th = useT()
  const [rating,setRating] = useState(0)
  const [comment,setComment] = useState('')
  const [busy,setBusy] = useState(false)
  const phrases=['Horrível','Ruim','Regular','Bom','Excelente!']
  const submit=async()=>{setBusy(true);await onSubmit(place.id,rating,comment);setBusy(false);onClose()}
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:24,padding:28,width:'100%',maxWidth:360,boxShadow:'0 16px 60px rgba(0,0,0,.2)'}}>
        <div style={{textAlign:'center',fontSize:28,marginBottom:4}}>{place.emoji}</div>
        <div style={{fontSize:20,fontWeight:800,color:th.textPrimary,textAlign:'center',marginBottom:18,fontFamily:'Playfair Display, serif'}}>Avaliar {place.name}</div>
        <div style={{display:'flex',justifyContent:'center',marginBottom:6}}><Stars v={rating} onChange={setRating} size={36}/></div>
        {rating>0&&<div style={{textAlign:'center',color:th.gold,fontSize:14,fontWeight:700,marginBottom:16}}>{phrases[rating-1]}</div>}
        <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Conta o que achou (opcional)…" rows={3} style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:12,padding:'10px 14px',color:th.textPrimary,fontSize:14,outline:'none',resize:'none',fontFamily:'DM Sans, sans-serif',boxSizing:'border-box',marginBottom:16}}/>
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={onClose} ghost color={th.textSec} full>Cancelar</Btn>
          <Btn onClick={submit} disabled={!rating} loading={busy} color={th.gold} full>Enviar ★</Btn>
        </div>
      </div>
    </div>
  )
}

/* ── Detail Modal ── */
function Detail({ place, isFav, onFav, onClose, showMsg, onReview, user, onAuthRequired }: any) {
  const th = useT(); const mode = useTheme()
  const [lb,setLb] = useState<number|null>(null)
  const [showRv,setShowRv] = useState(false)
  const p = place

  const share = async () => {
    const txt=`${p.emoji} ${p.name}\n📍 ${p.addr}, Pelotas\nVeja no TÔNICO!`
    if(navigator.share){try{await navigator.share({title:p.name,text:txt})}catch(e){}}
    else{navigator.clipboard.writeText(txt);showMsg('Copiado!','info')}
  }

  const handleFav = () => {
    if (!user) { onAuthRequired(); return }
    onFav(p); showMsg(isFav?'Removido dos salvos':'Salvo!', isFav?'info':'success')
  }

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:th.bg,border:`1.5px solid ${th.border}`,borderRadius:'24px 24px 0 0',width:'100%',maxWidth:640,maxHeight:'94vh',overflowY:'auto',boxShadow:'0 -8px 40px rgba(0,0,0,.2)'}}>
          {p.photos.length>0&&(
            <div style={{position:'relative',cursor:'pointer'}} onClick={()=>setLb(0)}>
              <img src={p.photos[0].url} alt="" style={{width:'100%',height:220,objectFit:'cover',display:'block',borderRadius:'24px 24px 0 0'}}/>
              <div style={{position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 50%,${th.bg})`,borderRadius:'24px 24px 0 0'}}/>
              {p.photos.length>1&&<div style={{position:'absolute',bottom:12,right:14,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',color:'#fff',fontSize:11,fontWeight:700,borderRadius:8,padding:'4px 10px'}}>📷 {p.photos.length}</div>}
            </div>
          )}
          <div style={{padding:'18px 20px 36px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}><OpenBadge isOpen={p.open}/><PlanBadge plan={p.plan}/></div>
                <div style={{fontSize:26,fontWeight:900,color:th.textPrimary,fontFamily:'Playfair Display, serif',lineHeight:1.1}}>{p.emoji} {p.name}</div>
                <div style={{fontSize:12,color:th.textSec,marginTop:4}}>📍 {p.addr} · {p.nbh}</div>
              </div>
              <button onClick={onClose} style={{background:th.bgInput,border:`1.5px solid ${th.border}`,color:th.textSec,borderRadius:'50%',width:34,height:34,cursor:'pointer',fontSize:16,flexShrink:0,marginLeft:8}}>✕</button>
            </div>
            {p.update&&(
              <div style={{background:mode==='light'?th.greenBg:'#0a1a0a',border:`1.5px solid ${mode==='light'?'#A3D9B8':'#1f4a25'}`,borderRadius:12,padding:'10px 14px',marginBottom:14,display:'flex',gap:8}}>
                <span style={{fontSize:16}}>📣</span>
                <div><div style={{fontSize:9,color:th.green,fontWeight:800,letterSpacing:2,marginBottom:3}}>HOJE</div><div style={{fontSize:13,color:mode==='light'?'#1B4A2A':'#a5d6a7',lineHeight:1.5}}>{p.update}</div></div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
              {[{icon:p.open?'✅':'❌',v:p.open?'Aberto':'Fechado',sub:p.hours||'Hoje',c:p.open?th.green:th.red,bg:p.open?th.greenBg:th.redBg},{icon:'⭐',v:p.rating.toFixed(1),sub:p.reviews+' aval.',c:th.gold,bg:mode==='light'?'#FFF8E1':'#1a1000'},{icon:'📍',v:p.nbh,sub:'Pelotas',c:th.textSec,bg:th.bgInput}].map(({icon,v,sub,c,bg})=>(
                <div key={v} style={{background:bg,borderRadius:14,padding:'11px 8px',textAlign:'center',border:`1.5px solid ${th.border}`}}>
                  <div style={{fontSize:18,marginBottom:3}}>{icon}</div>
                  <div style={{fontSize:12,fontWeight:800,color:c,lineHeight:1.1}}>{v}</div>
                  <div style={{fontSize:9,color:th.textSec,marginTop:2,fontWeight:600}}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto'}}>
              <ABt icon="🗺️" label="Chegar" color="#0076CC" onClick={()=>{goTo(mUrl(p.addr,'Pelotas'));showMsg('Abrindo Maps…','info')}}/>
              {p.wa&&<ABt icon="💬" label="WhatsApp" color="#25D366" onClick={()=>{goTo(waUrl(p.wa));showMsg('Abrindo WhatsApp…','info')}}/>}
              {p.phone&&<ABt icon="📞" label="Ligar" color={th.green} onClick={()=>goTo('tel:'+p.phone.replace(/\D/g,''))}/>}
              {p.ig&&<ABt icon="📸" label="Instagram" color="#E1306C" onClick={()=>{goTo(igUrl(p.ig));showMsg('Abrindo Instagram…','info')}}/>}
              <ABt icon={isFav?'❤️':'🤍'} label={isFav?'Salvo':'Salvar'} color={th.red} onClick={handleFav}/>
              <ABt icon="↗️" label="Compartilhar" color="#7B1FA2" onClick={share}/>
            </div>
            {p.desc&&(
              <div style={{background:th.bgCard2,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14,marginBottom:14}}>
                <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:6,fontWeight:700}}>SOBRE</div>
                <p style={{color:th.textSec,fontSize:14,lineHeight:1.7,margin:0}}>{p.desc}</p>
              </div>
            )}
            {p.photos.length>1&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:8,fontWeight:700}}>GALERIA</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                  {p.photos.map((ph: any,i: number)=>(<img key={i} src={ph.url} alt="" onClick={()=>setLb(i)} style={{width:'100%',height:82,objectFit:'cover',borderRadius:10,cursor:'pointer',display:'block',border:`1.5px solid ${th.border}`}}/>))}
                </div>
              </div>
            )}
            <div style={{background:th.bgCard2,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:10,fontWeight:700}}>FUNCIONAMENTO</div>
              {DAYS_K.map((dk,i)=>{
                const slot=p.sch[dk],isToday=i===DOW
                return (<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<6?`1px solid ${th.border}`:'none'}}>
                  <span style={{fontSize:13,fontWeight:isToday?800:500,color:isToday?p.color:th.textSec}}>{DAYS_F[i]}{isToday?' · hoje':''}</span>
                  <span style={{fontSize:13,fontWeight:isToday?700:400,color:slot?(isToday?p.color:th.textSec):th.textMuted}}>{slot?slot[0]+' – '+slot[1]:'Fechado'}</span>
                </div>)
              })}
            </div>
            <div style={{background:th.bgCard2,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,fontWeight:700}}>AVALIAÇÕES</div>
                <button onClick={()=>user?setShowRv(true):onAuthRequired()} style={{background:p.color,border:'none',borderRadius:20,padding:'5px 13px',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Avaliar</button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:8}}>
                <div style={{fontSize:42,fontWeight:900,color:th.gold,lineHeight:1,fontFamily:'Playfair Display, serif'}}>{p.rating.toFixed(1)}</div>
                <div><Stars v={Math.round(p.rating)} size={18}/><div style={{fontSize:12,color:th.textSec,marginTop:4,fontWeight:600}}>{p.reviews} avaliações</div></div>
              </div>
              {!user&&<div style={{textAlign:'center',color:th.textMuted,fontSize:12,padding:'4px 0'}}>Entre para avaliar →</div>}
            </div>
          </div>
        </div>
      </div>
      {lb!==null&&<Lightbox photos={p.photos} start={lb} onClose={()=>setLb(null)}/>}
      {showRv&&<ReviewModal place={p} onClose={()=>setShowRv(false)} onSubmit={onReview}/>}
    </>
  )
}

/* ── Card ── */
function Card({ place, isFav, onOpen, onFav }: { place:Place; isFav:boolean; onOpen:(p:Place)=>void; onFav:(p:Place)=>void }) {
  const th = useT(); const mode = useTheme()
  const p=place, isPro=p.plan==='pro', isPrem=p.plan==='premium'
  const showPh=(isPro||isPrem)&&p.photos.length>0
  const cardBg=mode==='light'?(isPrem?`linear-gradient(145deg,${p.color}08,#fff)`:th.bgCard):(isPrem?'linear-gradient(150deg,#100800,#0a0a0a)':'#0c0c0c')
  const cardBorder=mode==='light'?(isPrem?`2px solid ${p.color}60`:isPro?`1.5px solid ${p.color}35`:`1.5px solid ${th.border}`):(isPrem?`1px solid ${p.color}50`:isPro?'1px solid #FFB30025':'1px solid #181818')
  return (
    <div onClick={()=>onOpen(p)} style={{background:cardBg,border:cardBorder,borderRadius:18,padding:16,cursor:'pointer',position:'relative',overflow:'hidden',boxShadow:isPrem?`0 4px 24px ${p.color}20`:th.shadow,transition:'all .2s'}}
      onMouseEnter={e=>{const t=e.currentTarget;t.style.transform='translateY(-3px)';t.style.boxShadow=th.shadowHover}}
      onMouseLeave={e=>{const t=e.currentTarget;t.style.transform='translateY(0)';t.style.boxShadow=isPrem?`0 4px 24px ${p.color}20`:th.shadow}}>
      {isPrem&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${p.color},transparent)`,borderRadius:'18px 18px 0 0'}}/>}
      <button onClick={e=>{e.stopPropagation();onFav(p)}} style={{position:'absolute',top:12,right:12,background:mode==='light'?'rgba(255,255,255,.85)':'rgba(0,0,0,.5)',backdropFilter:'blur(4px)',border:`1px solid ${th.border}`,borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>{isFav?'❤️':'🤍'}</button>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><OpenBadge isOpen={p.open}/><PlanBadge plan={p.plan}/></div>
      <div style={{fontSize:18,fontWeight:900,color:th.textPrimary,paddingRight:36,marginBottom:2,fontFamily:'Playfair Display, serif',lineHeight:1.2}}>{p.emoji} {p.name}</div>
      <div style={{fontSize:11,color:th.textSec,marginBottom:8,fontWeight:500}}>📍 {p.nbh}{p.hours&&<span style={{color:p.open?th.green:th.textMuted}}> · 🕐 {p.hours}</span>}</div>
      {p.update&&<div style={{background:mode==='light'?th.greenBg:'#0a1a0a',border:`1px solid ${mode==='light'?'#A3D9B8':'#1a3a1a'}`,borderRadius:9,padding:'6px 10px',fontSize:11,color:mode==='light'?th.green:'#a5d6a7',marginBottom:9,display:'flex',gap:6,lineHeight:1.4}}><span>📣</span><span>{p.update.length>80?p.update.slice(0,80)+'…':p.update}</span></div>}
      {p.hl&&<div style={{background:p.color+'12',border:`1.5px solid ${p.color}30`,borderRadius:8,padding:'5px 10px',fontSize:11,color:p.color,marginBottom:9,fontWeight:700}}>✦ {p.hl}</div>}
      {showPh&&<div style={{display:'flex',gap:5,marginBottom:9,overflowX:'auto'}}>{p.photos.slice(0,4).map((ph,i)=>(<img key={i} src={ph.url} alt="" onClick={e=>{e.stopPropagation();onOpen(p)}} style={{width:i===0?110:72,height:66,objectFit:'cover',borderRadius:10,flexShrink:0,display:'block',border:`1px solid ${th.border}`}}/>))}</div>}
      {!showPh&&p.plan==='basic'&&<div style={{background:th.bgInput,border:`1px dashed ${th.border}`,borderRadius:9,padding:'6px 10px',fontSize:10,color:th.textMuted,marginBottom:9}}>📷 Fotos disponíveis no plano PRO</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`1.5px solid ${th.border}`,paddingTop:10}}>
        <div style={{fontSize:11,color:th.gold,fontWeight:700}}>★ {p.rating.toFixed(1)}<span style={{color:th.textMuted,fontWeight:400}}> ({p.reviews})</span></div>
        <SchedGrid sch={p.sch} color={p.color}/>
      </div>
    </div>
  )
}

/* ── Screen: Home ── */
function Home({ favs, onFav, onOpen, themeBtn, onAuthRequired }: any) {
  const th=useT()
  const [cat,setCat]=useState('all')
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
  const list=PLACES.filter(p=>{
    if(cat!=='all'&&p.type!==cat)return false
    if(filter==='open'&&!p.open)return false
    if(filter==='closed'&&p.open)return false
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase()))return false
    return true
  })
  const openCount=PLACES.filter(p=>p.open).length
  return (
    <>
      <div style={{background:th.headerBg,borderBottom:`1.5px solid ${th.border}`,padding:'13px 16px',position:'sticky',top:0,zIndex:400,backdropFilter:'blur(12px)'}}>
        <div style={{maxWidth:640,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <div style={{fontSize:26,fontFamily:'Playfair Display, serif',fontWeight:900,color:th.accent,lineHeight:1,letterSpacing:-1}}>TÔNICO</div>
              <div style={{fontSize:10,color:th.textMuted,fontWeight:700,letterSpacing:3}}>PELOTAS</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {themeBtn}
              <div style={{background:th.accentBg,border:`1.5px solid ${th.accent}30`,borderRadius:20,padding:'5px 12px',color:th.accent,fontSize:12,fontWeight:700}}>📍 Pelotas</div>
            </div>
          </div>
          <input placeholder="🔍  Buscar bares, restaurantes, eventos…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:12,padding:'10px 14px',color:th.textPrimary,fontSize:14,outline:'none',boxSizing:'border-box'}}/>
        </div>
      </div>
      <div style={{padding:'11px 16px 0',maxWidth:640,margin:'0 auto'}}>
        <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:2}}>
          {CATS.map(c=>(<button key={c.id} onClick={()=>setCat(c.id)} style={{flex:'0 0 auto',background:cat===c.id?th.accent:th.bgCard,border:`1.5px solid ${cat===c.id?th.accent:th.border}`,borderRadius:20,padding:'6px 14px',color:cat===c.id?'#fff':th.textSec,fontSize:12,cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',boxShadow:cat===c.id?`0 3px 12px ${th.accent}44`:th.shadow,transition:'all .15s'}}>{c.icon} {c.lbl}</button>))}
        </div>
      </div>
      <div style={{padding:'9px 16px',maxWidth:640,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:12,color:th.textMuted,fontWeight:600}}><span style={{color:th.green,fontWeight:800}}>{openCount} abertos</span> · {list.length} locais</div>
        <div style={{display:'flex',gap:4}}>{[['all','Todos'],['open','Abertos'],['closed','Fechados']].map(([v,l])=>(<button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?th.bgInput:'transparent',border:`1.5px solid ${filter===v?th.border:'transparent'}`,borderRadius:20,padding:'3px 10px',color:filter===v?th.textPrimary:th.textMuted,fontSize:11,cursor:'pointer',fontWeight:filter===v?700:500}}>{l}</button>))}</div>
      </div>
      <div style={{padding:'0 16px',maxWidth:640,margin:'0 auto'}}>
        {list.length===0?<div style={{textAlign:'center',padding:60,color:th.textMuted}}><div style={{fontSize:40,marginBottom:14}}>🔍</div>Nenhum resultado</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{list.map(p=><Card key={p.id} place={p} isFav={favs.has(p.id)} onOpen={onOpen} onFav={onFav}/>)}</div>}
      </div>
    </>
  )
}

/* ── Screen: Map ── */
function MapScreen() {
  const th=useT()
  const nbhs=[...new Set(PLACES.map(p=>p.nbh))].sort()
  return (
    <div style={{padding:'16px',maxWidth:640,margin:'0 auto'}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:24,fontWeight:900,color:th.textPrimary,fontFamily:'Playfair Display, serif',marginBottom:4}}>🗺️ Mapa — Pelotas</div>
        <div style={{fontSize:12,color:th.textSec,fontWeight:600}}>{PLACES.length} locais · <span style={{color:th.green}}>{PLACES.filter(p=>p.open).length} abertos agora</span></div>
      </div>
      <button onClick={()=>goTo('https://www.google.com/maps/search/bares+restaurantes+Pelotas+RS')} style={{width:'100%',background:'linear-gradient(135deg,#1565C0,#1976D2)',border:'none',borderRadius:14,padding:'14px',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxSizing:'border-box',boxShadow:'0 4px 16px rgba(21,101,192,.3)'}}>🗺️ Abrir no Google Maps</button>
      {nbhs.map(nbh=>{
        const ps=PLACES.filter(p=>p.nbh===nbh)
        return (
          <div key={nbh} style={{marginBottom:18}}>
            <div style={{fontSize:10,color:th.textMuted,letterSpacing:2,marginBottom:8,display:'flex',alignItems:'center',gap:8,fontWeight:700}}><div style={{flex:1,height:1,background:th.border}}/>📍 {nbh.toUpperCase()}<div style={{flex:1,height:1,background:th.border}}/></div>
            {ps.map(p=>(<div key={p.id} style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,marginBottom:8,boxShadow:th.shadow}}>
              <div style={{width:44,height:44,borderRadius:11,background:p.color+'15',border:`2px solid ${p.color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{p.emoji}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:800,color:th.textPrimary}}>{p.name}</div><div style={{fontSize:11,color:th.textSec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.addr}</div></div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                <span style={{fontSize:9,fontWeight:800,color:p.open?th.green:th.textMuted}}>{p.open?'● ABERTO':'● FECHADO'}</span>
                <button onClick={()=>goTo(mUrl(p.addr,'Pelotas'))} style={{background:p.color,border:'none',borderRadius:8,padding:'5px 12px',color:'#fff',fontSize:11,fontWeight:800,cursor:'pointer'}}>Ir →</button>
              </div>
            </div>))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Screen: Saved ── */
function Saved({ favs, onFav, onOpen }: any) {
  const th=useT()
  const list=PLACES.filter(p=>favs.has(p.id))
  return (
    <div style={{padding:'16px',maxWidth:640,margin:'0 auto'}}>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:24,fontWeight:900,color:th.textPrimary,fontFamily:'Playfair Display, serif',marginBottom:4}}>❤️ Salvos</div>
        <div style={{fontSize:12,color:th.textSec,fontWeight:600}}>{list.length} local(is) · <span style={{color:th.green}}>{list.filter(p=>p.open).length} abertos</span></div>
      </div>
      {list.length===0?<div style={{textAlign:'center',padding:'52px 20px',color:th.textMuted}}><div style={{fontSize:48,marginBottom:16}}>🤍</div><div style={{fontSize:16,color:th.textSec,fontWeight:700,marginBottom:8,fontFamily:'Playfair Display, serif'}}>Nenhum local salvo</div><div style={{fontSize:13}}>Toque no 🤍 em qualquer estabelecimento</div></div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{list.map(p=><Card key={p.id} place={p} isFav={true} onOpen={onOpen} onFav={onFav}/>)}</div>}
    </div>
  )
}

/* ── Screen: Profile ── */
function ProfileScreen({ user, onAdmin, showMsg, onAuth, onLogout }: any) {
  const th=useT(); const mode=useTheme()
  const [n1,setN1]=useState(true); const [n2,setN2]=useState(false)
  const Tog=({v,set}: any)=>(<div onClick={()=>set(!v)} style={{width:44,height:24,borderRadius:12,background:v?th.accent:th.bgInput,border:`1.5px solid ${v?th.accent:th.border}`,cursor:'pointer',position:'relative',transition:'all .2s',flexShrink:0}}><div style={{position:'absolute',top:3,left:v?22:3,width:16,height:16,borderRadius:'50%',background:v?'#fff':(mode==='light'?'#B09880':'#444'),boxShadow:'0 1px 4px rgba(0,0,0,.15)',transition:'all .2s'}}/></div>)

  return (
    <div style={{padding:'16px',maxWidth:640,margin:'0 auto'}}>
      {/* User card */}
      <div style={{background:mode==='light'?`linear-gradient(135deg,${th.accentBg},#fff)`:'linear-gradient(135deg,#100800,#0d0d0d)',border:`2px solid ${th.accent}30`,borderRadius:20,padding:20,marginBottom:14,display:'flex',alignItems:'center',gap:14,boxShadow:`0 4px 20px ${th.accent}18`}}>
        {user ? (
          <>
            <div style={{width:62,height:62,borderRadius:'50%',background:`linear-gradient(135deg,${th.accent},#ff8c42)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,overflow:'hidden'}}>
              {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '👤'}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:800,color:th.textPrimary,marginBottom:2,fontFamily:'Playfair Display, serif'}}>{user.user_metadata?.name||user.email?.split('@')[0]||'Usuário'}</div>
              <div style={{fontSize:12,color:th.textSec,marginBottom:10}}>{user.email}</div>
              <button onClick={onLogout} style={{background:'transparent',border:`1.5px solid ${th.red}44`,borderRadius:20,padding:'5px 14px',color:th.red,fontSize:12,fontWeight:700,cursor:'pointer'}}>Sair</button>
            </div>
          </>
        ) : (
          <>
            <div style={{width:62,height:62,borderRadius:'50%',background:`linear-gradient(135deg,${th.accent},#ff8c42)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>👤</div>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:th.textPrimary,marginBottom:2,fontFamily:'Playfair Display, serif'}}>Visitante</div>
              <div style={{fontSize:12,color:th.textSec,marginBottom:10}}>Entre para salvar favoritos e avaliar</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={onAuth} style={{background:th.accent,border:'none',borderRadius:20,padding:'6px 16px',color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',boxShadow:`0 3px 10px ${th.accent}55`}}>Entrar</button>
                <button onClick={onAuth} style={{background:'transparent',border:`2px solid ${th.accent}55`,borderRadius:20,padding:'6px 16px',color:th.accent,fontSize:12,fontWeight:800,cursor:'pointer'}}>Cadastrar</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:16,padding:16,marginBottom:12,boxShadow:th.shadow}}>
        <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:10,fontWeight:700}}>NOTIFICAÇÕES</div>
        {[['Locais abertos hoje','Avise quando um favorito abrir',n1,setN1],['Novidades e eventos','Promoções da sua cidade',n2,setN2]].map(([l,s,v,sv]: any)=>(<div key={l as string} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${th.border}`}}><div><div style={{fontSize:14,color:th.textPrimary,fontWeight:600}}>{l}</div><div style={{fontSize:11,color:th.textSec,marginTop:2}}>{s}</div></div><Tog v={v} set={sv}/></div>))}
      </div>

      <div style={{background:mode==='light'?`linear-gradient(135deg,${th.accentBg},#fff)`:'linear-gradient(135deg,#0a0800,#0d0d0d)',border:`2px solid ${th.accent}40`,borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:9,fontWeight:700}}>ÁREA DO ESTABELECIMENTO</div>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}><span style={{fontSize:24}}>🏪</span><div><div style={{fontSize:15,fontWeight:800,color:th.textPrimary}}>É dono de um local?</div><div style={{fontSize:12,color:th.textSec}}>Gerencie horários, fotos e atualizações.</div></div></div>
        <button onClick={onAdmin} style={{width:'100%',background:th.accent,border:'none',borderRadius:12,padding:'13px',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',boxSizing:'border-box',boxShadow:`0 4px 16px ${th.accent}55`}}>Acessar Painel →</button>
      </div>

      <div style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14}}>
        <div style={{fontSize:9,color:th.textMuted,letterSpacing:2,marginBottom:9,fontWeight:700}}>SOBRE</div>
        {[['Versão','1.0.0'],['Cidade','Pelotas, RS'],['Auth','Supabase'],['Deploy','Vercel']].map(([k,v])=>(<div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${th.border}`}}><span style={{fontSize:13,color:th.textSec,fontWeight:600}}>{k}</span><span style={{fontSize:13,color:th.textMuted}}>{v}</span></div>))}
      </div>
      <div style={{textAlign:'center',padding:'12px 0 8px',fontSize:11,color:th.textMuted,fontWeight:600}}>Feito com ♥ em Pelotas</div>
    </div>
  )
}

/* ── Admin Login ── */
function AdminLogin({ onEnter, onBack }: any) {
  const th=useT(); const [sel,setSel]=useState<Place|null>(null)
  return (
    <div style={{padding:'16px',maxWidth:500,margin:'0 auto'}}>
      <button onClick={onBack} style={{background:'none',border:'none',color:th.textSec,cursor:'pointer',fontSize:14,marginBottom:16,display:'flex',alignItems:'center',gap:5,fontWeight:600}}>← Voltar</button>
      <div style={{fontSize:24,fontWeight:900,color:th.textPrimary,fontFamily:'Playfair Display, serif',marginBottom:4}}>🏪 Painel</div>
      <div style={{fontSize:12,color:th.textSec,marginBottom:14,fontWeight:600}}>Selecione seu estabelecimento</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
        {PLACES.map(e=>(<div key={e.id} onClick={()=>setSel(e)} style={{background:sel?.id===e.id?e.color+'15':th.bgCard,border:`1.5px solid ${sel?.id===e.id?e.color:th.border}`,borderRadius:14,padding:'12px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,boxShadow:sel?.id===e.id?`0 4px 16px ${e.color}30`:th.shadow,transition:'all .15s'}}><span style={{fontSize:24}}>{e.emoji}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:800,color:th.textPrimary}}>{e.name}</div><div style={{fontSize:11,color:th.textSec}}>📍 {e.nbh}</div></div><PlanBadge plan={e.plan}/></div>))}
      </div>
      <Btn onClick={()=>sel&&onEnter(sel)} disabled={!sel} full color={th.accent}>Entrar →</Btn>
    </div>
  )
}

/* ── Admin Panel ── */
function AdminPanel({ estab, onBack, showMsg }: any) {
  const th=useT(); const mode=useTheme()
  const [tab,setTab]=useState('today')
  const TABS=[{id:'today',icon:'📣',lbl:'Hoje'},{id:'sched',icon:'🕐',lbl:'Horários'},{id:'photos',icon:'📷',lbl:'Fotos'},{id:'profile',icon:'📝',lbl:'Perfil'},{id:'stats',icon:'📊',lbl:'Stats'}]
  const e=estab
  return (
    <div style={{background:th.bg,minHeight:'100vh'}}>
      <div style={{background:th.headerBg,borderBottom:`1.5px solid ${th.border}`,padding:'11px 16px',position:'sticky',top:0,zIndex:500,backdropFilter:'blur(12px)'}}>
        <div style={{maxWidth:640,margin:'0 auto',display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onBack} style={{background:'none',border:'none',color:th.textSec,cursor:'pointer',fontSize:20,padding:0}}>←</button>
          <span style={{fontSize:18,fontFamily:'Playfair Display, serif',fontWeight:900,color:th.accent,letterSpacing:-1}}>TÔNICO</span>
          <div style={{width:1,height:16,background:th.border}}/>
          <span style={{fontSize:18}}>{e.emoji}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:th.textPrimary,lineHeight:1}}>{e.name}</div><div style={{fontSize:10,color:th.textSec}}>{e.nbh}</div></div>
          <PlanBadge plan={e.plan}/>
        </div>
      </div>
      <div style={{background:th.headerBg,borderBottom:`1px solid ${th.border}`,padding:'0 16px'}}>
        <div style={{maxWidth:640,margin:'0 auto',display:'flex',overflowX:'auto'}}>
          {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:'0 0 auto',background:'none',border:'none',borderBottom:`2.5px solid ${tab===t.id?e.color:'transparent'}`,color:tab===t.id?e.color:th.textSec,padding:'11px 12px',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?800:500,display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>{t.icon} {t.lbl}</button>))}
        </div>
      </div>
      <div style={{maxWidth:640,margin:'0 auto',padding:'16px 16px 40px'}}>
        {tab==='today'&&<AToday e={e} msg={showMsg}/>}
        {tab==='sched'&&<ASched e={e} msg={showMsg}/>}
        {tab==='photos'&&<APhotos e={e} msg={showMsg}/>}
        {tab==='profile'&&<AProfile e={e} msg={showMsg}/>}
        {tab==='stats'&&<AStats e={e}/>}
      </div>
    </div>
  )
}

function AToday({ e, msg }: any) {
  const th=useT()
  const [text,setText]=useState(e.update||'')
  const [saved,setSaved]=useState(!!e.update)
  const [busy,setBusy]=useState(false)
  const today=new Date().toISOString().split('T')[0]
  if(!e.hasDU) return (<div style={{background:th.bgCard,border:`1.5px dashed ${th.border}`,borderRadius:14,padding:28,textAlign:'center'}}><div style={{fontSize:32,marginBottom:10}}>🔒</div><div style={{color:th.textSec,fontSize:14,fontWeight:600}}>Disponível nos planos PRO e PREMIUM</div></div>)
  const save=async()=>{setBusy(true);try{if(saved){await runSQL(`UPDATE daily_updates SET content='${esc(text)}' WHERE establishment_id='${e.id}' AND update_date='${today}'`)}else{await runSQL(`INSERT INTO daily_updates(establishment_id,content,update_date)VALUES('${e.id}','${esc(text)}','${today}')`)}setSaved(true);msg('Publicado!','success')}catch(err){msg('Erro.','error')}setBusy(false)}
  const clear=async()=>{setBusy(true);try{await runSQL(`DELETE FROM daily_updates WHERE establishment_id='${e.id}' AND update_date='${today}'`);setText('');setSaved(false);msg('Removido.','info')}catch(err){msg('Erro.','error')}setBusy(false)}
  return (<div><p style={{fontSize:13,color:th.textSec,marginBottom:14,lineHeight:1.6}}>Esta mensagem aparece em destaque no seu card hoje.</p><textarea value={text} onChange={ev=>setText(ev.target.value)} rows={5} placeholder="Ex: Feijoada hoje! Happy hour 17h–19h com 30% off." style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:12,padding:'11px 13px',color:th.textPrimary,fontSize:14,outline:'none',resize:'vertical',fontFamily:'DM Sans, sans-serif',boxSizing:'border-box',marginBottom:8}}/><div style={{fontSize:11,color:th.textMuted,marginBottom:12}}>{text.length}/280</div>{saved&&<div style={{background:th.greenBg,border:`1.5px solid ${th.green}44`,borderRadius:10,padding:'8px 13px',fontSize:12,color:th.green,marginBottom:12,fontWeight:700}}>✓ Publicado · visível no app agora</div>}<div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>{saved&&<Btn onClick={clear} ghost color={th.red} sm loading={busy}>Remover</Btn>}<Btn onClick={save} color={th.green} loading={busy} disabled={!text.trim()}>{saved?'Atualizar':'Publicar'}</Btn></div></div>)
}

function ASched({ e, msg }: any) {
  const th=useT()
  const init=()=>{const m: Record<string,any>={};DAYS_K.forEach(dk=>{const s=e.sch[dk];m[dk]={closed:!s,op:s?s[0]:'18:00',cl:s?s[1]:'00:00'}});return m}
  const [sch,setSch]=useState(init)
  const [busy,setBusy]=useState(false)
  const upd=(dk: string,f: string,v: any)=>setSch((p: any)=>({...p,[dk]:{...p[dk],[f]:v}}))
  const save=async()=>{setBusy(true);try{for(const dk of DAYS_K){const s=sch[dk];await runSQL(`INSERT INTO schedules(establishment_id,day,closed,opens_at,closes_at)VALUES('${e.id}','${dk}',${s.closed},${s.closed?'NULL':"'"+s.op+"'"},${s.closed?'NULL':"'"+s.cl+"'"}) ON CONFLICT(establishment_id,day) DO UPDATE SET closed=${s.closed},opens_at=${s.closed?'NULL':"'"+s.op+"'"},closes_at=${s.closed?'NULL':"'"+s.cl+"'"}`)}msg('Horários salvos!','success')}catch(err){msg('Erro.','error')}setBusy(false)}
  return (
    <div>
      {DAYS_K.map((dk,i)=>{
        const s=sch[dk],isToday=i===DOW
        return(
          <div key={dk} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<6?`1px solid ${th.border}`:'none'}}>
            <div style={{width:60,flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?e.color:th.textSec}}>{DAYS_F[i].slice(0,3)}</div>
              {isToday&&<div style={{fontSize:9,color:e.color,fontWeight:800}}>HOJE</div>}
            </div>
            <div onClick={()=>upd(dk,'closed',!s.closed)} style={{width:44,height:24,borderRadius:12,background:s.closed?th.bgInput:e.color+'55',border:`1.5px solid ${s.closed?th.border:e.color}`,cursor:'pointer',position:'relative',transition:'all .2s',flexShrink:0}}>
              <div style={{position:'absolute',top:3,left:s.closed?3:22,width:16,height:16,borderRadius:'50%',background:s.closed?'#ccc':e.color,transition:'all .2s'}}/>
            </div>
            <div style={{fontSize:11,color:s.closed?th.textMuted:th.textSec,width:52,flexShrink:0,fontWeight:600}}>{s.closed?'Fechado':'Aberto'}</div>
            {!s.closed&&(
              <div style={{display:'flex',alignItems:'center',gap:6,flex:1}}>
                <input type="time" value={s.op} onChange={ev=>upd(dk,'op',ev.target.value)} style={{background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:8,padding:'4px 8px',color:th.textPrimary,fontSize:13,outline:'none',width:86}}/>
                <span style={{color:th.textMuted}}>–</span>
                <input type="time" value={s.cl} onChange={ev=>upd(dk,'cl',ev.target.value)} style={{background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:8,padding:'4px 8px',color:th.textPrimary,fontSize:13,outline:'none',width:86}}/>
              </div>
            )}
          </div>
        )
      })}
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
        <Btn onClick={save} loading={busy} color={th.accent}>Salvar Horários</Btn>
      </div>
    </div>
  )
}

function APhotos({ e, msg }: any) {
  const th=useT()
  const [photos,setPhotos]=useState(e.photos||[])
  const [url,setUrl]=useState('')
  const [cap,setCap]=useState('')
  const [busy,setBusy]=useState(false)
  const canAdd=photos.length<e.maxPh
  const add=async()=>{if(!url.trim())return;setBusy(true);try{await runSQL(`INSERT INTO photos(establishment_id,storage_path,url,caption,is_cover,sort_order)VALUES('${e.id}','m/${Date.now()}.jpg','${esc(url)}','${esc(cap)}',${photos.length===0},${photos.length+1})`);setPhotos((p: any)=>[...p,{url,c:cap}]);setUrl('');setCap('');msg('Foto adicionada!','success')}catch(err){msg('Erro.','error')}setBusy(false)}
  return (<div><div style={{fontSize:12,color:th.textSec,marginBottom:12,fontWeight:600}}>{photos.length}/{e.maxPh} fotos usadas</div>{photos.length>0&&(<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>{photos.map((ph: any,i: number)=>(<div key={i} style={{position:'relative',borderRadius:12,overflow:'hidden',border:`1.5px solid ${th.border}`}}><img src={ph.url} alt="" style={{width:'100%',height:90,objectFit:'cover',display:'block'}} onError={(ev: any)=>ev.target.style.opacity='.3'}/>{i===0&&<div style={{position:'absolute',top:4,left:4,background:th.accent,color:'#fff',fontSize:9,fontWeight:800,borderRadius:6,padding:'2px 7px'}}>CAPA</div>}</div>))}</div>)}{canAdd?<div style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:14,padding:14,boxShadow:th.shadow}}><div style={{fontSize:10,color:th.textMuted,letterSpacing:1,marginBottom:10,fontWeight:700}}>ADICIONAR FOTO</div><input value={url} onChange={ev=>setUrl(ev.target.value)} placeholder="URL da foto (https://…)" style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:9,padding:'8px 12px',color:th.textPrimary,fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:8}}/><input value={cap} onChange={ev=>setCap(ev.target.value)} placeholder="Legenda (opcional)" style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:9,padding:'8px 12px',color:th.textPrimary,fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:10}}/>{url&&<img src={url} alt="" style={{width:'100%',height:100,objectFit:'cover',borderRadius:9,marginBottom:10,display:'block',border:`1.5px solid ${th.border}`}} onError={(ev: any)=>ev.target.style.display='none'}/>}<Btn onClick={add} loading={busy} disabled={!url.trim()} sm color={th.accent}>+ Adicionar</Btn></div>:<div style={{background:th.bgCard,border:`1.5px dashed ${th.border}`,borderRadius:12,padding:14,textAlign:'center',color:th.textSec,fontSize:13,fontWeight:600}}>Limite atingido</div>}</div>)
}

function AProfile({ e, msg }: any) {
  const th=useT()
  const [f,setF]=useState({desc:e.desc,phone:e.phone,wa:e.wa,ig:e.ig,addr:e.addr,hl:e.hl})
  const [busy,setBusy]=useState(false)
  const set=(k: string)=>(v: string)=>setF((p: any)=>({...p,[k]:v}))
  const save=async()=>{setBusy(true);try{await runSQL(`UPDATE establishments SET description='${esc(f.desc)}',phone='${esc(f.phone)}',whatsapp='${esc(f.wa)}',instagram='${esc(f.ig)}',address='${esc(f.addr)}',highlight_text='${esc(f.hl)}',updated_at=now() WHERE id='${e.id}'`);msg('Perfil salvo!','success')}catch(err){msg('Erro.','error')}setBusy(false)}
  const F=({label,k,ph}: {label:string;k:string;ph:string})=>(<div style={{marginBottom:11}}><div style={{fontSize:10,color:th.textMuted,letterSpacing:1,marginBottom:5,fontWeight:700}}>{label}</div><input value={(f as any)[k]||''} onChange={ev=>set(k)(ev.target.value)} placeholder={ph} style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:9,padding:'8px 12px',color:th.textPrimary,fontSize:13,outline:'none',boxSizing:'border-box'}} onFocus={ev=>ev.target.style.borderColor=e.color} onBlur={ev=>ev.target.style.borderColor=th.border}/></div>)
  return (<div><div style={{marginBottom:11}}><div style={{fontSize:10,color:th.textMuted,letterSpacing:1,marginBottom:5,fontWeight:700}}>DESCRIÇÃO</div><textarea value={f.desc||''} onChange={ev=>set('desc')(ev.target.value)} rows={3} style={{width:'100%',background:th.bgInput,border:`1.5px solid ${th.border}`,borderRadius:9,padding:'8px 12px',color:th.textPrimary,fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans, sans-serif',boxSizing:'border-box'}} onFocus={ev=>ev.target.style.borderColor=e.color} onBlur={ev=>ev.target.style.borderColor=th.border}/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><F label="TELEFONE" k="phone" ph="(53) 99999-0000"/><F label="WHATSAPP" k="wa" ph="5553999..."/><F label="INSTAGRAM" k="ig" ph="@seulocal"/></div><F label="ENDEREÇO" k="addr" ph="Rua Exemplo, 123"/>{e.hasHL&&<F label="DESTAQUE" k="hl" ph="Ex: Pizza R$22"/>}<div style={{display:'flex',justifyContent:'flex-end',marginTop:6}}><Btn onClick={save} loading={busy} color={th.accent}>Salvar</Btn></div></div>)
}

function AStats({ e }: any) {
  const th=useT()
  return (<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>{[{icon:'⭐',v:e.rating.toFixed(1),l:'Avaliação',c:th.gold},{icon:'💬',v:e.reviews,l:'Avaliações',c:'#0076CC'},{icon:'👁️',v:'—',l:'Views hoje',c:'#7B1FA2'},{icon:'🤍',v:'—',l:'Salvos',c:th.red}].map(s=>(<div key={s.l} style={{background:th.bgCard,border:`1.5px solid ${th.border}`,borderRadius:14,padding:16,textAlign:'center',boxShadow:th.shadow}}><div style={{fontSize:24,marginBottom:6}}>{s.icon}</div><div style={{fontSize:26,fontWeight:900,color:s.c,lineHeight:1,fontFamily:'Playfair Display, serif'}}>{s.v}</div><div style={{fontSize:10,color:th.textSec,marginTop:6,fontWeight:600}}>{s.l}</div></div>))}</div>{!e.hasFT&&(<div style={{background:th.accentBg,border:`1.5px dashed ${th.accent}55`,borderRadius:14,padding:16}}><div style={{fontSize:14,fontWeight:800,color:th.accent,marginBottom:6}}>🚀 Stats no PREMIUM</div><div style={{fontSize:13,color:th.textSec}}>Visualizações diárias, origens e conversões.</div></div>)}</div>)
}

/* ── ROOT ── */
export default function TonicoApp() {
  const [mode, setMode] = useState<'light'|'dark'>('light')
  const [screen, setScreen] = useState('home')
  const [sel, setSel] = useState<Place|null>(null)
  const [favs, setFavs] = useState(new Set<string>())
  const [admin, setAdmin] = useState<Place|null>(null)
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)
  const [user, setUser] = useState<User|null>(null)
  const [showAuth, setShowAuth] = useState(false)

  const th = T[mode]

  // Auth state listener
  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUser(data.user))
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user??null)
      if(session?.user) setShowAuth(false)
    })
    return ()=>subscription.unsubscribe()
  },[])

  // Load saved favs from Supabase when user logs in
  useEffect(()=>{
    if(!user) return
    supabase.from('favorites').select('establishment_id').eq('user_id',user.id)
      .then(({data})=>{ if(data) setFavs(new Set(data.map((r: any)=>r.establishment_id))) })
  },[user])

  const showMsg = useCallback((msg: string, type='success')=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),2600)
  },[])

  const toggleFav = useCallback(async(p: Place)=>{
    const isFav = favs.has(p.id)
    setFavs(prev=>{const n=new Set(prev);isFav?n.delete(p.id):n.add(p.id);return n})
    if(user){
      if(isFav){ await supabase.from('favorites').delete().eq('user_id',user.id).eq('establishment_id',p.id) }
      else { await supabase.from('favorites').upsert({user_id:user.id,establishment_id:p.id}) }
    }
  },[favs, user])

  const handleReview = useCallback(async(eid: string, rating: number, comment: string)=>{
    if(!user){showMsg('Entre para avaliar.','error');return}
    const {error} = await supabase.from('reviews').upsert({user_id:user.id,establishment_id:eid,rating,comment})
    if(error) showMsg('Erro ao enviar.','error')
    else showMsg('Avaliação enviada! Obrigado 🙏','success')
  },[user, showMsg])

  const handleLogout = async()=>{
    await supabase.auth.signOut()
    setFavs(new Set())
    showMsg('Até logo!','info')
  }

  const NAV = [{id:'home',icon:'🏠',lbl:'Início'},{id:'map',icon:'🗺️',lbl:'Mapa'},{id:'saved',icon:'❤️',lbl:'Salvos'},{id:'profile',icon:'👤',lbl:'Perfil'}]
  const isAdmin = screen==='admin_login'||screen==='admin_panel'
  const themeBtn = <ThemeToggle mode={mode} setMode={setMode as any}/>

  return (
    <ThemeCtx.Provider value={mode}>
      <div style={{background:th.bg,minHeight:'100vh',fontFamily:'DM Sans, sans-serif',color:th.textPrimary,paddingBottom:isAdmin?0:68,transition:'background .3s,color .3s'}}>
        {toast&&<Toast msg={toast.msg} type={toast.type} mode={mode}/>}

        {screen==='home'         && <Home favs={favs} onFav={toggleFav} onOpen={setSel} themeBtn={themeBtn} onAuthRequired={()=>setShowAuth(true)}/>}
        {screen==='map'          && <MapScreen/>}
        {screen==='saved'        && <Saved favs={favs} onFav={toggleFav} onOpen={setSel}/>}
        {screen==='profile'      && <ProfileScreen user={user} onAdmin={()=>setScreen('admin_login')} showMsg={showMsg} onAuth={()=>setShowAuth(true)} onLogout={handleLogout}/>}
        {screen==='admin_login'  && <AdminLogin onEnter={(e: Place)=>{setAdmin(e);setScreen('admin_panel')}} onBack={()=>setScreen('profile')}/>}
        {screen==='admin_panel'  && admin&&<AdminPanel estab={admin} onBack={()=>{setAdmin(null);setScreen('profile')}} showMsg={showMsg}/>}

        {!isAdmin&&(
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:th.navBg,borderTop:`1.5px solid ${th.navBorder}`,display:'flex',zIndex:300,boxShadow:`0 -4px 20px ${mode==='light'?'rgba(0,0,0,.06)':'rgba(0,0,0,.4)'}`}}>
            {NAV.map(n=>{
              const active=n.id===screen
              const badge=n.id==='saved'&&favs.size>0
              return (
                <button key={n.id} onClick={()=>setScreen(n.id)} style={{flex:1,background:'none',border:'none',color:active?th.accent:th.textMuted,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',padding:'9px 0 12px',position:'relative',transition:'color .15s'}}>
                  {badge&&<div style={{position:'absolute',top:6,right:'calc(50% - 18px)',width:17,height:17,background:th.accent,borderRadius:'50%',fontSize:9,color:'#fff',fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>{favs.size}</div>}
                  <span style={{fontSize:18}}>{n.icon}</span>
                  <span style={{fontSize:9,fontWeight:active?800:500}}>{n.lbl}</span>
                  {active&&<div style={{position:'absolute',bottom:0,width:30,height:2.5,background:th.accent,borderRadius:2}}/>}
                </button>
              )
            })}
          </div>
        )}

        {sel&&<Detail place={sel} isFav={favs.has(sel.id)} onFav={toggleFav} onClose={()=>setSel(null)} showMsg={showMsg} onReview={handleReview} user={user} onAuthRequired={()=>setShowAuth(true)}/>}
        {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} th={th as any} onGoogle={()=>supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback`}})} onEmailSignIn={async (e: string,p: string)=>{const{error}=await supabase.auth.signInWithPassword({email:e,password:p});if(error)throw error;}} onEmailSignUp={async (e: string,p: string,n: string)=>{const{error}=await supabase.auth.signUp({email:e,password:p,options:{data:{name:n}}});if(error)throw error;}}/>}
      </div>
    </ThemeCtx.Provider>
  )
}
