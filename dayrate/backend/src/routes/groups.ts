import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { createGroup, joinGroup, listGroups, getGroupDetail } from '../controllers/groups'

const router = Router()

router.use(authenticate)

router.post('/', createGroup)
router.post('/join', joinGroup)
router.get('/', listGroups)
router.get('/:id', getGroupDetail)

export default router
