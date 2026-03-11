export type Theme = 'light' | 'dark'

export interface Place {
  id: string
  name: string
  type: string
  plan: 'basic' | 'pro' | 'premium'
  color: string
  emoji: string
  nbh: string
  phone: string
  wa: string
  ig: string
  hl: string
  desc: string
  addr: string
  lat: number
  lng: number
  rating: number
  reviews: number
  hasDU: boolean
  hasHL: boolean
  hasFT: boolean
  maxPh: number
  update: string | null
  photos: { url: string; c: string }[]
  sch: Record<string, [string, string] | null>
  open: boolean
  hours: string | null
}

export interface UserProfile {
  id: string
  name: string | null
  avatar_url: string | null
  role: string
  city_id: string | null
}
