import { Request, Response, NextFunction } from "express";
import { ApiError } from '../utils/ApiError'
import { ZodError } from "zod";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ZodError) {
        const errors = err.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        return res.status(400).json({
            statusCode: 400,
            success: false,
            message: 'Validation failed',
            errors
        })
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            success: false,
            message: err.message,
            errors: err.errors
        })
    }

    console.error('Unhandled error:', err)
    return res.status(500).json({
        statusCode: 500,
        success: false,
        message: 'Internal server error',
        errors: [],
    })
}