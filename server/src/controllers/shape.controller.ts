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