export type BusinessSettings = {
  businessName: string; legalName: string; taxId: string; address: string; hours: string; phone: string; email: string; whatsapp: string
  instagram: string; facebook: string; mapsUrl: string; paymentMethods: string
  terms: string; privacy: string; delivery: string; refunds: string; faq: string
  termsReviewed: boolean; privacyReviewed: boolean; deliveryReviewed: boolean; refundsReviewed: boolean; faqReviewed: boolean
}
export const emptyBusinessSettings: BusinessSettings = {
  businessName: '', legalName: '', taxId: '', address: '', hours: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '', mapsUrl: '', paymentMethods: '',
  terms: '', privacy: '', delivery: '', refunds: '', faq: '', termsReviewed: false, privacyReviewed: false, deliveryReviewed: false, refundsReviewed: false, faqReviewed: false,
}
export const infoPages = [
  { key: 'terms', path: '/terminos', title: 'Terminos y condiciones' },
  { key: 'privacy', path: '/privacidad', title: 'Politica de privacidad' },
  { key: 'delivery', path: '/envios-y-retiros', title: 'Envios y retiros' },
  { key: 'refunds', path: '/cancelaciones-y-reembolsos', title: 'Cancelaciones y reembolsos' },
  { key: 'faq', path: '/preguntas-frecuentes', title: 'Preguntas frecuentes' },
] as const
