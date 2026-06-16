export class ApiError extends Error {
    public readonly statusCode: number
    public readonly errors: string[]
    public readonly success: boolean = false

    constructor(statusCode: number, message: string, errors: string[] = []) {
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.name = 'ApiError'
        Error.captureStackTrace(this, this.constructor)
    }

    static badRequest(message = 'Bad request', errors: string[] = []) {
        return new ApiError(400, message, errors)
    }

    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message)
    }

    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message)
    }

    static notFound(message = 'Not found') {
        return new ApiError(404, message)
    }

    static internal(message = "Internal Server Error") {
        return new ApiError(500, message)
    }
}