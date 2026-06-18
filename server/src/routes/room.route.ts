import { Router } from 'express'

import { protect } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { createRoomSchema } from '../validators/room.validator'

import { createRoom, getRoom, getRoomShapes, deleteRoom, clearRoom } from '../controllers/room.controller' 

const router = Router()

router.post('/', protect, validate(createRoomSchema), createRoom)
router.get('/:code', getRoom)
router.get('/:code/shapes', protect, getRoomShapes)
router.delete('/:code', protect, deleteRoom)
router.delete('/:code/clear', protect, clearRoom)

export default router