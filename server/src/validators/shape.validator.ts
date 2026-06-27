import { z } from 'zod'

export const createShapeSchema = z.object({
    shapeType: z.enum(['pen', 'rectangle', 'circle', 'arrow', 'line', 'text']),
    data: z.object({
        points:      z.array(z.object({ x: z.number(), y: z.number() })).optional(),
        x:           z.number().optional(),
        y:           z.number().optional(),
        width:       z.number().optional(),
        height:      z.number().optional(),
        text:        z.string().optional(),
        strokeColor: z.string().optional(),
        strokeWidth: z.number().positive().optional(),
        fillColor:   z.string().optional(),
    })
})

export const moveShapeSchema = z.object({
    dx: z.number(),
    dy: z.number(),
})

export type CreateShapeInput = z.infer<typeof createShapeSchema>
export type MoveShapeInput   = z.infer<typeof moveShapeSchema>