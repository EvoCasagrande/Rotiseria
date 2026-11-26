import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptySettings, settingsBodySchema } from '../src/modules/settings/settings.schema.js'
const db = vi.hoisted(() => ({ businessSettings: { findUnique: vi.fn(), upsert: vi.fn() } }))
vi.mock('../src/lib/prisma.js', () => ({ prisma: db }))
import { SettingsService } from '../src/modules/settings/settings.service.js'
const service = new SettingsService()
beforeEach(() => { vi.resetAllMocks(); db.businessSettings.findUnique.mockResolvedValue(null); db.businessSettings.upsert.mockResolvedValue({}) })
describe('configuracion comercial', () => {
  it('rechaza enlaces no web, WhatsApp invalido y textos vacios marcados como publicados', () => {
    expect(settingsBodySchema.safeParse({ ...emptySettings, instagram: 'javascript:alert(1)' }).success).toBe(false)
    expect(settingsBodySchema.safeParse({ ...emptySettings, whatsapp: '+54 11' }).success).toBe(false)
    expect(settingsBodySchema.safeParse({ ...emptySettings, termsReviewed: true }).success).toBe(false)
  })
  it('no expone textos pendientes en la API publica', async () => {
    db.businessSettings.findUnique.mockResolvedValue({ data: { ...emptySettings, terms: 'Borrador', privacy: 'Publicada', privacyReviewed: true } })
    expect(await service.getPublic()).toMatchObject({ terms: '', privacy: 'Publicada' })
  })
  it('exige revisar nuevamente cuando se cambia un texto publicado', async () => {
    db.businessSettings.findUnique.mockResolvedValue({ data: { ...emptySettings, terms: 'Anterior', termsReviewed: true } })
    const result = await service.update({ ...emptySettings, terms: 'Nuevo', termsReviewed: true })
    expect(result.termsReviewed).toBe(false)
    expect(db.businessSettings.upsert.mock.calls[0][0].update.data.termsReviewed).toBe(false)
  })
  it('permite publicar un texto guardado tras una revision posterior', async () => {
    db.businessSettings.findUnique.mockResolvedValue({ data: { ...emptySettings, terms: 'Texto' } })
    expect((await service.update({ ...emptySettings, terms: 'Texto', termsReviewed: true })).termsReviewed).toBe(true)
  })
})
