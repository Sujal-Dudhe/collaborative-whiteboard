import type { Shape } from '../types/whiteboard'

export const findHitShape = (shapes: Shape[], px: number, py: number): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i]
        const x = s.data.x ?? 0
        const y = s.data.y ?? 0
        const w = s.data.width ?? 0
        const h = s.data.height ?? 0

        if (s.shapeId === 'pen') {
            const pts = s.data.points || []
            for (let j = 0; j < pts.length - 1; j++) {
                const p1 = pts[j]
                const p2 = pts[j + 1]
                const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2
                if (l2 === 0) continue
                let t = ((px - p1.x) * (p2.x - p1.x) + (py - p1.y) * (p2.y - p1.y)) / l2
                t = Math.max(0, Math.min(1, t))
                const dist = Math.hypot(px - (p1.x + t * (p2.x - p1.x)), py - (p1.y + t * (p2.y - p1.y)))
                if (dist < 8) return s
            }
        } else if (s.shapeId === 'rectangle') {
            const minX = Math.min(x, x + w)
            const maxX = Math.max(x, x + w)
            const minY = Math.min(y, y + h)
            const maxY = Math.max(y, y + h)
            const pad = 6
            if (px >= minX - pad && px <= maxX + pad && py >= minY - pad && py <= maxY + pad) return s
        } else if (s.shapeId === 'circle') {
            const cx = x + w / 2
            const cy = y + h / 2
            const rx = Math.abs(w / 2)
            const ry = Math.abs(h / 2)
            if (rx > 0 && ry > 0) {
                const dx = px - cx
                const dy = py - cy
                const val = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)
                if (s.data.fillColor && s.data.fillColor !== 'transparent') {
                    if (val <= 1.05) return s
                } else {
                    if (Math.abs(val - 1) <= 0.15) return s
                }
            }
        } else if (s.shapeId === 'line' || s.shapeId === 'arrow') {
            const x2 = x + w
            const y2 = y + h
            const l2 = (x2 - x) ** 2 + (y2 - y) ** 2
            let dist
            if (l2 === 0) {
                dist = Math.hypot(px - x, py - y)
            } else {
                let t = ((px - x) * (x2 - x) + (py - y) * (y2 - y)) / l2
                t = Math.max(0, Math.min(1, t))
                dist = Math.hypot(px - (x + t * (x2 - x)), py - (y + t * (y2 - y)))
            }
            if (dist < 8) return s
        } else if (s.shapeId === 'text') {
            const size = (s.data.strokeWidth || 2) * 6 + 12
            const tw = (s.data.text || '').length * size * 0.6
            const th = size
            if (px >= x && px <= x + tw && py >= y && py <= y + th) return s
        }
    }
    return null
}
