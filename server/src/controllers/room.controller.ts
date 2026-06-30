import { Response } from "express";
import { nanoid } from "nanoid";

import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";

import { Room } from "../models/room.model";
import { Shape } from "../models/shape.model";

export const createRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, isPublic } = req.body
    const code = nanoid(9)

    const room = await Room.create({
        name, 
        code,
        isPublic,
        ownerId: (req.user as any)._id,
    })

    return res.status(201).json(new ApiResponse(201, 'Room created successfully', room))
})

export const getRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
    const room = await Room.findOne({ code: req.params.code }).populate('ownerId', 'name avatar')

    if(!room) throw new ApiError(404, 'Room not found')

    // private room - Only owner can view it
    if (!room.isPublic) {
        const userId = (req.user as any)?._id?.toString()
        const ownerIdStr = (room.ownerId as any)?._id?.toString() || room.ownerId?.toString()
        if (!userId || ownerIdStr !== userId) {
            throw new ApiError(403, 'The room is private')
        }
    }

    return res.status(200).json(new ApiResponse(200, 'Room fetched successfully', room))
})

export const getRoomShapes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const room = await Room.findOne({ code: req.params.code })
    if(!room) throw new ApiError(404, 'Room not found')

    // private room - Only owner can view shapes
    if (!room.isPublic) {
        const userId = (req.user as any)?._id?.toString()
        const ownerIdStr = (room.ownerId as any)?._id?.toString() || room.ownerId?.toString()
        if (!userId || ownerIdStr !== userId) {
            throw new ApiError(403, 'The room is private')
        }
    }

    const shapes = await Shape.find({ roomId: room._id, isDeleted: false }).sort({ createdAt: 1 }).lean()

    return res.status(200).json(new ApiResponse(200, 'Room shapes fetched successfully', { shapes, total: shapes.length }))
})

export const deleteRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
    const room = await Room.findOne({ code: req.params.code })

    if(!room) throw new ApiError(404, 'Room not found')

    const userId = (req.user as any)._id.toString()
    if(room.ownerId.toString() !== userId) {
        throw new ApiError(403, 'You are not authorized to delete this room')
    }

    await Shape.deleteMany({ roomId: room._id })
    await room.deleteOne()

    return res.status(200).json(new ApiResponse(200, 'Room deleted successfully', null))
})

export const clearRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
    const room = await Room.findOne({ code: req.params.code })
    if(!room) throw new ApiError(404, 'Room not found')

    const userId = (req.user as any)._id.toString()
    if(room.ownerId.toString() !== userId) {
        throw new ApiError(403, 'You are not authorized to clear this room')
    }

    const result = await Shape.updateMany({ roomId: room._id }, { $set: { isDeleted: true } })

    res.json(new ApiResponse(200, 'Canvas cleared', { shapesCleared: result.modifiedCount }))
})