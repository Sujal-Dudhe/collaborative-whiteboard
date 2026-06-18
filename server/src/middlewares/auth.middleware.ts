import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/ApiError'

import { User } from '../models/user.model'

export interface AuthRequest extends Request {
    user?: any
}

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) throw new ApiError(401, 'No token provided')

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {id: string}
    const user = await User.findById(decodedToken.id).select('-__v')
    
    if (!user) throw new ApiError(401, 'User not found') 
    
    req.user = user
    next()
})