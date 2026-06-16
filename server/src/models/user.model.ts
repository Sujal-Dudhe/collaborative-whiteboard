import { Schema, model } from 'mongoose'

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    avatar: {
        type: String
    },
    provider: {
        type: String,
        required: true,
        enum: ['google', 'github']
    },
    providerId: {
        type: String,
        required: true
    },
}, {
    timestamps: true
})

userSchema.index({ provider: 1, providerId: 1 }, { unique: true })

export const User = model('User', userSchema)
export type IUser = typeof User.prototype;