export interface Point {
    x: number
    y: number
}

export interface ShapeData {
    points?: Point[]
    x?: number
    y?: number
    width?: number
    height?: number
    text?: string
    strokeColor?: string
    strokeWidth?: number
    fillColor?: string
}

export interface Shape {
    _id: string
    roomId: string
    userId: string | null
    shapeId: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text'
    data: ShapeData
    isDeleted: boolean
}

export interface OnlineUser {
    socketId: string
    displayName: string
    userId: string | null
}
