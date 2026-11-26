import { z } from 'zod'

const text = z.string().trim().max(12000)
const short = z.string().trim().max(500)
const url = z.union([z.literal(''), z.url({ protocol: /^https?$/ }).max(2048)])
const email = z.union([z.literal(''), z.email().max(254)])
export const settingsBodySchema = z.object({
  businessName: short, legalName: short, taxId: short, address: short,
  hours: text, phone: short, email, whatsapp: z.string().regex(/^(?:\d{8,15})?$/),
  instagram: url, facebook: url, mapsUrl: url, paymentMethods: text,
  terms: text, privacy: text, delivery: text, refunds: text, faq: text,
  termsReviewed: z.boolean(), privacyReviewed: z.boolean(), deliveryReviewed: z.boolean(),
  refundsReviewed: z.boolean(), faqReviewed: z.boolean(),
}).strict().superRefine((data, ctx) => {
  for (const key of ['terms', 'privacy', 'delivery', 'refunds', 'faq'] as const) {
    if (data[`${key}Reviewed`] && !data[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Completa el contenido antes de publicarlo' })
  }
})
export const updateSettingsSchema = z.object({ body: settingsBodySchema })
export type SettingsInput = z.infer<typeof settingsBodySchema>
export const emptySettings: SettingsInput = {
  businessName: '', legalName: '', taxId: '', address: '', hours: '', phone: '', email: '', whatsapp: '',
  instagram: '', facebook: '', mapsUrl: '', paymentMethods: '', terms: '', privacy: '', delivery: '', refunds: '', faq: '',
  termsReviewed: false, privacyReviewed: false, deliveryReviewed: false, refundsReviewed: false, faqReviewed: false,
}
