import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'

import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'

import { Room } from '../models/room.model'
import { Shape } from '../models/shape.model'

export const saveShape = asyncHandler(async (req: AuthRequest, res: Response) => {
    const room = await Room.findOne({ code: req.params.code })
    if (!room) throw new ApiError(404, 'Room not found')
 
    const shape = await Shape.create({
        roomId:  room._id,
        userId:  (req.user as any)?._id ?? null,
        shapeId: req.body.shapeType,
        data:    req.body.data,
    })
 
    return res.status(201).json(new ApiResponse(201, 'Shape saved', shape))
})

export const updateShapePosition = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { dx, dy } = req.body as { dx: number; dy: number }

    const shape = await Shape.findById(req.params.shapeId)
    if (!shape || shape.isDeleted) throw new ApiError(404, 'Shape not found')

    if (shape.data) {
        if (shape.data.points?.length) {
            shape.data.points = shape.data.points.map((p: any) => ({
                x: (p.x ?? 0) + dx,
                y: (p.y ?? 0) + dy,
            })) as any
        }

        if (typeof shape.data.x === 'number') shape.data.x += dx
        if (typeof shape.data.y === 'number') shape.data.y += dy
    }

    shape.markModified('data')
    await shape.save()

    return res.json(new ApiResponse(200, 'Shape position updated', shape))
})