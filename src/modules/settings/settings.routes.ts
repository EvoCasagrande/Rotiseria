import { Router } from 'express'
import { requireAuth } from '../../middlewares/requireAuth.js'
import { validate } from '../../middlewares/validate.js'
import { updateSettingsSchema, type SettingsInput } from './settings.schema.js'
import { SettingsService } from './settings.service.js'
const router = Router()
const service = new SettingsService()
router.get('/', async (_req, res) => { res.json({ settings: await service.getPublic() }) })
router.get('/admin', requireAuth, async (_req, res) => { res.json({ settings: await service.get() }) })
router.put('/', requireAuth, validate(updateSettingsSchema), async (_req, res) => {
  const { body } = res.locals.validated as { body: SettingsInput }
  res.json({ settings: await service.update(body) })
})
export default router
