import type { Place } from './types'

export const DAYS_K = ['sun','mon','tue','wed','thu','fri','sat'] as const
export const DAYS_S = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export const DAYS_F = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
export const DOW = new Date().getDay()

const SCH: Record<string, Record<string, [string,string] | null>> = {
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
  'a9c9b9bf':[{url:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',c:'Pizza'},{url:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',c:'Forno'},{url:'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600&q=80',c:'Ambiente'},{url:'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&q=80',c:'Artesanal'}],
}

function calcOpen(key: string): boolean {
  const s = SCH[key]; if (!s) return false
  const slot = s[DAYS_K[DOW]]; if (!slot) return false
  const now = new Date().getHours()*60 + new Date().getMinutes()
  const [oh,om] = slot[0].split(':').map(Number)
  const [ch,cm] = slot[1].split(':').map(Number)
  const op = oh*60+om, cl = ch*60+cm+(ch<oh?1440:0)
  return now>=op && now<cl
}

function todayHours(key: string): string | null {
  const s = SCH[key]; if (!s) return null
  const slot = s[DAYS_K[DOW]]
  return slot ? `${slot[0]}–${slot[1]}` : null
}

const RAW = [
  {id:'e5d33de3-436d-4191-9735-816b6c74a796',name:'Festival de Jazz',type:'event',plan:'premium',color:'#7B1FA2',emoji:'🎷',nbh:'Centro',phone:'(53) 99999-0003',wa:'5353999990003',ig:'festivaldejazzpel',hl:'Entrada gratuita!',desc:'3 dias de jazz ao ar livre com artistas nacionais e locais.',addr:'Parque Dom Antônio Zattera',rating:5.0,reviews:89,hasDU:true,hasHL:true,hasFT:true,maxPh:20,update:'Line-up: Quarteto Sul às 19h, Banda Alma Jazz às 21h!'},
  {id:'d63389f3-733f-4fff-8cf3-f81ac1a1383f',name:'Club Onze',type:'club',plan:'premium',color:'#0097A7',emoji:'🎶',nbh:'Centro',phone:'(53) 99999-0005',wa:'5353999990005',ig:'clubonze_oficial',hl:'Open bar até meia-noite',desc:'A melhor pista da região. Sets de DJs nacionais toda semana.',addr:'Rua Marechal Floriano, 11',rating:4.5,reviews:267,hasDU:true,hasHL:true,hasFT:true,maxPh:20,update:'DJ Mateus Lima essa noite! Open bar premium até 00h.'},
  {id:'adcee130-8cd7-4e84-9097-ea6259ef9986',name:'Bistrô da Praça',type:'restaurant',plan:'pro',color:'#2E7D32',emoji:'🍽️',nbh:'Centro',phone:'(53) 99999-0002',wa:'5353999990002',ig:'bistrodapraca',hl:'Prato executivo R$35',desc:'Culinária contemporânea com ingredientes locais e sazonais.',addr:'Praça Coronel Pedro Osório, 88',rating:4.9,reviews:198,hasDU:true,hasHL:true,hasFT:false,maxPh:8,update:'Hoje: Risoto de funghi + Tiramisu. Reserve pelo WhatsApp!'},
  {id:'89f40a8f-6ee0-433c-b283-80f6763fd3d0',name:'Bar do Canto',type:'bar',plan:'pro',color:'#E8580A',emoji:'🍺',nbh:'Centro',phone:'(53) 99999-0001',wa:'5353999990001',ig:'bardocanto_pel',hl:'Música ao vivo toda sexta!',desc:'O melhor boteco da cidade, petiscos variados e chope gelado.',addr:'Rua XV de Novembro, 420',rating:4.7,reviews:312,hasDU:true,hasHL:true,hasFT:false,maxPh:8,update:'Trio elétrico às 20h! Chope 20% off até 19h.'},
  {id:'61231732-b2cb-491d-8ce9-2165a7ec4b71',name:'Café Cultura',type:'cafe',plan:'basic',color:'#5D4037',emoji:'☕',nbh:'Areal',phone:'(53) 99999-0004',wa:'5353999990004',ig:'cafecultura.pel',hl:'Brunch aos domingos',desc:'Specialty coffee, bolos artesanais e ambiente acolhedor.',addr:'Rua Andrade Neves, 210',rating:4.8,reviews:445,hasDU:false,hasHL:false,hasFT:false,maxPh:1,update:null},
  {id:'a9c9b9bf-b7de-4570-bb87-f93ba2cc8866',name:'Pizzaria Napoli',type:'restaurant',plan:'basic',color:'#C62828',emoji:'🍕',nbh:'São Gonçalo',phone:'(53) 99999-0006',wa:'5353999990006',ig:'pizzarianapolipel',hl:'Pizza brotinho R$22',desc:'Pizzas artesanais assadas em forno a lenha desde 1985.',addr:'Av. Bento Gonçalves, 550',rating:4.6,reviews:523,hasDU:false,hasHL:false,hasFT:false,maxPh:1,update:null},
] as const

export const PLACES: Place[] = RAW.map(e => {
  const key = e.id.slice(0,8)
  return {
    ...e,
    plan: e.plan as 'basic'|'pro'|'premium',
    photos: PH[key] || [],
    sch: SCH[key] || {},
    open: calcOpen(key),
    hours: todayHours(key),
  }
})

export const CATS = [
  {id:'all',icon:'⚡',lbl:'Todos'},
  {id:'bar',icon:'🍺',lbl:'Bares'},
  {id:'restaurant',icon:'🍽️',lbl:'Restaurantes'},
  {id:'event',icon:'🎉',lbl:'Eventos'},
  {id:'cafe',icon:'☕',lbl:'Cafés'},
  {id:'club',icon:'🎶',lbl:'Baladas'},
]
