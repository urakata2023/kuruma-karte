'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { TouringRecord } from '@/lib/types'

/**
 * ツーリング記録の lat/lng を地図上にピン表示する。
 * Leaflet + OpenStreetMap（完全無料）。
 */
export function TouringMap({ records }: { records: TouringRecord[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  // 緯度経度が入っている記録だけ（useMemoでメモ化、毎レンダリングで再生成しない）
  const valid = useMemo(
    () =>
      records.filter(
        (r): r is TouringRecord & { latitude: number; longitude: number } =>
          r.latitude != null && r.longitude != null
      ),
    [records]
  )

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!containerRef.current || valid.length === 0) return

      const L = (await import('leaflet')).default

      if (cancelled || !containerRef.current) return

      // 既存マップがあれば破棄
      if (
        mapRef.current &&
        typeof (mapRef.current as { remove?: () => void }).remove === 'function'
      ) {
        ;(mapRef.current as { remove: () => void }).remove()
      }

      // 平均座標を中心に
      const avgLat =
        valid.reduce((sum, r) => sum + r.latitude, 0) / valid.length
      const avgLng =
        valid.reduce((sum, r) => sum + r.longitude, 0) / valid.length

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([avgLat, avgLng], 7)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // カスタム絵文字アイコン（Next.js bundleでのicon path問題回避）
      const pinIcon = L.divIcon({
        html: `
          <div style="
            display:flex; align-items:center; justify-content:center;
            width:36px; height:36px;
            background: #18181b; border: 2px solid #fafafa;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">
            <span style="transform: rotate(45deg); font-size:18px;">🚗</span>
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      // ピンを追加
      valid.forEach((r) => {
        const popupHtml = `
          <div style="min-width: 180px; font-family: sans-serif;">
            <strong>${escapeHtml(r.title)}</strong><br>
            <span style="color:#71717a; font-size: 12px;">
              ${escapeHtml(r.touring_date)}${r.place_name ? ' · ' + escapeHtml(r.place_name) : ''}
            </span>
            ${r.photo_url ? `<br><img src="${r.photo_url}" style="margin-top: 6px; max-width: 100%; max-height: 100px; object-fit: cover; border-radius: 4px;" />` : ''}
            ${r.memo ? `<br><span style="font-size: 12px;">${escapeHtml(r.memo)}</span>` : ''}
          </div>
        `
        L.marker([r.latitude, r.longitude], { icon: pinIcon })
          .addTo(map)
          .bindPopup(popupHtml)
      })

      // 複数ピンなら全部見える範囲に
      if (valid.length > 1) {
        const bounds = L.latLngBounds(
          valid.map((r) => [r.latitude, r.longitude] as [number, number])
        )
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
      }

      mapRef.current = map
    })()

    return () => {
      cancelled = true
      if (
        mapRef.current &&
        typeof (mapRef.current as { remove?: () => void }).remove === 'function'
      ) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [valid])

  if (valid.length === 0) return null

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black">
      <div
        ref={containerRef}
        className="aspect-[4/3] w-full overflow-hidden rounded-lg"
        style={{ minHeight: 280 }}
      />
      <p className="mt-2 text-center text-xs text-zinc-500">
        {valid.length}件の場所をマップで表示中 · タップで詳細
      </p>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
