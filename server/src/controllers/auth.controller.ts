import { Request, Response } from "express";
import jwt from 'jsonwebtoken'

import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const createToken = (userId: string) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

    export const oauthCallback = asyncHandler(async (req: Request, res: Response) => {
        const user = req.user as any
        if (!user) throw new ApiError(401, 'OAuth authentication failed')

        const token = createToken(user._id.toString())

        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
    })

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  res.json(new ApiResponse(200, 'User fetched', {
    id:     user._id,
    name:   user.name,
    email:  user.email,
    avatar: user.avatar,
  }))
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  req.logout(() => {})
  res.json(new ApiResponse(200, 'Logged out successfully', null))
})