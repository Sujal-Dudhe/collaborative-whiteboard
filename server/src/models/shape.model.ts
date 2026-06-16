import { Schema, model } from 'mongoose'

const shapeSchema = new Schema({
    roomId: {
        type: Schema.Types.ObjectId, 
        ref: 'Room',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    shapeId: {
        type: String,
        required: true,
        enum: ['pen', 'rectangle', 'circle', 'arrow', 'line', 'text']
    },
    data: {
        points: [{ x: Number, y: Number }],
        x:      Number,
        y:      Number,
        width:  Number,
        height: Number,
        text:   String,
        strokeColor: { 
            type: String,
            default: '#000000'
        },
        strokeWidth: {
            type: Number,
            default: 2
        },
        fillColor: {
            type: String,
            default: 'transparent'
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
})

shapeSchema.index({ roomId: 1, isDeleted: 1, createdAt: 1})

export const Shape = model('Shape', shapeSchema)