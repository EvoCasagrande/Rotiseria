import { prisma } from '../../lib/prisma.js'
import { emptySettings, settingsBodySchema, type SettingsInput } from './settings.schema.js'

export class SettingsService {
  async get(): Promise<SettingsInput> {
    const row = await prisma.businessSettings.findUnique({ where: { id: 'business' } })
    return settingsBodySchema.parse({ ...emptySettings, ...(row?.data as object ?? {}) })
  }
  async update(data: SettingsInput): Promise<SettingsInput> {
    const current = await this.get()
    // Any change to a reviewed text requires a fresh review in a separate save.
    for (const key of ['terms', 'privacy', 'delivery', 'refunds', 'faq'] as const) {
      if (data[key] !== current[key]) data[`${key}Reviewed`] = false
    }
    await prisma.businessSettings.upsert({ where: { id: 'business' }, create: { id: 'business', data }, update: { data } })
    return data
  }
  async getPublic() {
    const data = await this.get()
    return { ...data, terms: data.termsReviewed ? data.terms : '', privacy: data.privacyReviewed ? data.privacy : '',
      delivery: data.deliveryReviewed ? data.delivery : '', refunds: data.refundsReviewed ? data.refunds : '', faq: data.faqReviewed ? data.faq : '' }
  }
}
