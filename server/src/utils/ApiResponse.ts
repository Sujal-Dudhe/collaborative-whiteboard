export class ApiResponse<T = unknown> {
    public readonly statusCode: number
    public readonly success: boolean
    public readonly message: string
    public readonly data: T

    constructor(statusCode: number, message: string, data: T) {
        this.statusCode = statusCode
        this.success = statusCode >= 200 && statusCode < 300
        this.message = message
        this.data = data
    }
}