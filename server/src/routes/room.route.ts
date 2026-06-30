import { Router } from 'express'

import { protect } from '../middlewares/auth.middleware'
import { optionalAuth } from '../middlewares/optionalAuth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { createRoomSchema } from '../validators/room.validator'

import { createRoom, getRoom, getMyRooms, getRoomShapes, deleteRoom, clearRoom } from '../controllers/room.controller' 

const router = Router()

router.post('/', protect, validate(createRoomSchema), createRoom)
router.get('/my-rooms', protect, getMyRooms)
router.get('/:code', optionalAuth, getRoom)
router.get('/:code/shapes', optionalAuth, getRoomShapes)
router.delete('/:code', protect, deleteRoom)
router.delete('/:code/clear', protect, clearRoom)

export default router