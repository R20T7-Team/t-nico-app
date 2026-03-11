'use client'
import { useEffect, useRef, useState } from 'react'
import type { Place } from '@/lib/types'

const LEAFLET_CSS = `
.leaflet-container { font-family: 'DM Sans', sans-serif; }
.leaflet-popup-content-wrapper {
  border-radius: 16px !important; box-shadow: 0 8px 32px rgba(0,0,0,.18) !important;
  padding: 0 !important; overflow: hidden; border: none !important;
}
.leaflet-popup-content { margin: 0 !important; width: auto !important; }
.leaflet-popup-tip-container { display: none; }
.leaflet-control-zoom { border-radius: 12px !important; overflow: hidden; border: none !important; box-shadow: 0 2px 12px rgba(0,0,0,.15) !important; }
.leaflet-control-zoom a { width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important; color: #333 !important; }
.leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,.7) !important; border-radius: 8px 0 0 0 !important; }
.tonico-pin { display:flex;align-items:center;justify-content:center;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 12px rgba(0,0,0,.3);border:2.5px solid rgba(255,255,255,.9);cursor:pointer;transition:transform .15s,box-shadow .15s; }
.tonico-pin:hover { box-shadow: 0 4px 18px rgba(0,0,0,.4); }
.tonico-pin .inner { transform:rotate(45deg);font-size:18px;display:flex;align-items:center;justify-content:center; }
.tonico-pin.closed { filter: grayscale(.7) opacity(.65); }
.tonico-pin.selected { transform: rotate(-45deg) scale(1.3); box-shadow: 0 6px 22px rgba(0,0,0,.5); }
`

interface Props {
  places: Place[]
  selected: Place | null
  onSelect: (p: Place) => void
  mode: 'light' | 'dark'
}

export default function MapView({ places, selected, onSelect, mode }: Props) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Record<string, any>>({})
  const tileRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  const TILES = {
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  }

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (!document.getElementById('tonico-map-css')) {
      const style = document.createElement('style')
      style.id = 'tonico-map-css'
      style.textContent = LEAFLET_CSS
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const init = async () => {
      const L = (await import('leaflet')).default
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(containerRef.current!, {
        center: [-31.7690, -52.3370],
        zoom: 14,
        zoomControl: true,
      })

      tileRef.current = L.tileLayer(TILES[mode], { maxZoom: 19, attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a>' })
      tileRef.current.addTo(map)
      mapRef.current = map

      // Callback global para botão no popup
      ;(window as any).__tonicoSelect = (id: string) => {
        const p = places.find(x => x.id === id)
        if (p) onSelect(p)
      }

      places.forEach(p => {
        const icon = L.divIcon({
          className: '',
          html: `<div class="tonico-pin ${p.open ? 'open' : 'closed'}" style="width:44px;height:44px;background:${p.color};">
                   <div class="inner">${p.emoji}</div>
                 </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
          popupAnchor: [0, -50],
        })

        const popup = L.popup({ maxWidth: 240, minWidth: 220, closeButton: true })
          .setContent(`
            <div style="width:220px;font-family:'DM Sans',sans-serif;">
              ${p.photos[0] ? `<img src="${p.photos[0].url}" style="width:100%;height:90px;object-fit:cover;display:block;">` : `<div style="height:10px;background:${p.color}20;"></div>`}
              <div style="padding:12px 14px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                  <span style="width:7px;height:7px;border-radius:50%;background:${p.open ? '#1B7A3E' : '#D63A2A'};"></span>
                  <span style="font-size:10px;font-weight:800;color:${p.open ? '#1B7A3E' : '#D63A2A'};">${p.open ? 'ABERTO' : 'FECHADO'}</span>
                  ${p.plan !== 'basic' ? `<span style="margin-left:auto;font-size:9px;font-weight:800;color:${p.color};background:${p.color}18;padding:2px 7px;border-radius:20px;">${p.plan.toUpperCase()}</span>` : ''}
                </div>
                <div style="font-size:15px;font-weight:900;color:#1A0F00;line-height:1.2;margin-bottom:3px;">${p.emoji} ${p.name}</div>
                <div style="font-size:11px;color:#7A6050;margin-bottom:${p.hours ? '4px' : '8px'};">${p.nbh} · ${p.addr.length > 30 ? p.addr.slice(0,30)+'…' : p.addr}</div>
                ${p.hours ? `<div style="font-size:11px;color:${p.color};font-weight:700;margin-bottom:8px;">🕐 ${p.hours}</div>` : ''}
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #F0E8E0;">
                  <span style="font-size:12px;color:#E67C00;font-weight:700;">★ ${p.rating.toFixed(1)} <span style="color:#B09880;font-weight:400;">(${p.reviews})</span></span>
                  <button onclick="window.__tonicoSelect('${p.id}')" style="background:${p.color};border:none;border-radius:20px;padding:5px 14px;color:#fff;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Ver →</button>
                </div>
              </div>
            </div>`)

        const marker = L.marker([p.lat, p.lng], {
          icon,
          zIndexOffset: p.plan === 'premium' ? 200 : p.plan === 'pro' ? 100 : 0,
        }).bindPopup(popup)

        marker.on('click', () => { onSelect(p) })
        marker.addTo(map)
        markersRef.current[p.id] = marker
      })

      setReady(true)
    }

    init()

    return () => {
      delete (window as any).__tonicoSelect
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      markersRef.current = {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trocar tile ao mudar tema
  useEffect(() => {
    if (!mapRef.current || !ready) return
    import('leaflet').then(({ default: L }) => {
      if (tileRef.current) mapRef.current.removeLayer(tileRef.current)
      tileRef.current = L.tileLayer(TILES[mode], { maxZoom: 19, attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a>' })
      tileRef.current.addTo(mapRef.current)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready])

  // Volar para o marcador selecionado
  useEffect(() => {
    if (!mapRef.current || !ready || !selected) return
    mapRef.current.flyTo([selected.lat - 0.0018, selected.lng], 16, { duration: 0.7 })
    setTimeout(() => markersRef.current[selected.id]?.openPopup(), 750)
  }, [selected, ready])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: mode === 'dark' ? '#111' : '#e8e0d8' }} />
}
