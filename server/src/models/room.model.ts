import { Schema, model } from 'mongoose'

const roomSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    ownerId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }, 
    isPublic: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

export const Room = model('Room', roomSchema)