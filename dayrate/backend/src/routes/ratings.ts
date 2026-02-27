import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { saveRating, listRatings, getStats } from '../controllers/ratings'

const router = Router()

router.use(authenticate)

router.post('/', saveRating)
router.get('/', listRatings)
router.get('/stats', getStats)

export default router
