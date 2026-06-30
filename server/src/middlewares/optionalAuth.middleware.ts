import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { User } from '../models/user.model'
import { AuthRequest } from './auth.middleware'

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) return next() // proceed as guest

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string}
        const user = await User.findById(decoded.id).select('-__v')
        if (user) req.user = user
    } catch (error) {
        // Don't block the request
    }

    next()
}