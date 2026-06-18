import { z } from 'zod'

export const createRoomSchema = z.object({
    name: z.string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must be 50 characters or less')
    .trim(),
    isPublic: z.boolean().optional().default(true),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>