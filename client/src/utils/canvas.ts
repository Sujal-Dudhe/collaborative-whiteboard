import type { Shape } from '../types/whiteboard'

export const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape | Partial<Shape>) => {
    ctx.beginPath()
    ctx.strokeStyle = shape.data?.strokeColor || '#000000'
    ctx.lineWidth = shape.data?.strokeWidth || 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = shape.data?.fillColor || 'transparent'

    const x = shape.data?.x ?? 0
    const y = shape.data?.y ?? 0
    const w = shape.data?.width ?? 0
    const h = shape.data?.height ?? 0

    switch (shape.shapeId) {
        case 'pen': {
            const points = shape.data?.points || []
            if (points.length > 0) {
                ctx.moveTo(points[0].x, points[0].y)
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y)
                }
                ctx.stroke()
            }
            break
        }
        case 'rectangle': {
            ctx.rect(x, y, w, h)
            if (shape.data?.fillColor && shape.data?.fillColor !== 'transparent') {
                ctx.fill()
            }
            ctx.stroke()
            break
        }
        case 'circle': {
            const cx = x + w / 2
            const cy = y + h / 2
            const rx = Math.abs(w / 2)
            const ry = Math.abs(h / 2)
            if (rx > 0 && ry > 0) {
                ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI)
            }
            if (shape.data?.fillColor && shape.data?.fillColor !== 'transparent') {
                ctx.fill()
            }
            ctx.stroke()
            break
        }
        case 'line': {
            ctx.moveTo(x, y)
            ctx.lineTo(x + w, y + h)
            ctx.stroke()
            break
        }
        case 'arrow': {
            const x2 = x + w
            const y2 = y + h
            ctx.moveTo(x, y)
            ctx.lineTo(x2, y2)
            ctx.stroke()

            const angle = Math.atan2(y2 - y, x2 - x)
            const headLen = 10 + (shape.data?.strokeWidth || 2) * 1.5
            ctx.beginPath()
            ctx.fillStyle = shape.data?.strokeColor || '#000000'
            ctx.moveTo(x2, y2)
            ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
            ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
            ctx.fill()
            break
        }
        case 'text': {
            const size = (shape.data?.strokeWidth || 2) * 6 + 12
            ctx.font = `${size}px Inter, sans-serif`
            ctx.textBaseline = 'top'
            ctx.fillStyle = shape.data?.strokeColor || '#000000'
            ctx.fillText(shape.data?.text || '', x, y)
            break
        }
    }
}

export const drawSelectionBoundingBox = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    let x = shape.data.x ?? 0
    let y = shape.data.y ?? 0
    let w = shape.data.width ?? 0
    let h = shape.data.height ?? 0

    if (shape.shapeId === 'pen') {
        const pts = shape.data.points || []
        if (pts.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
            pts.forEach(p => {
                if (p.x < minX) minX = p.x
                if (p.x > maxX) maxX = p.x
                if (p.y < minY) minY = p.y
                if (p.y > maxY) maxY = p.y
            })
            x = minX
            y = minY
            w = maxX - minX
            h = maxY - minY
        }
    } else if (shape.shapeId === 'text') {
        const size = (shape.data.strokeWidth || 2) * 6 + 12
        w = (shape.data.text || '').length * size * 0.6
        h = size
    }

    ctx.save()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8)
    ctx.restore()
}
