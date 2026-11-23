import type { CartItem, Product } from './types'

export type SavedItem = { productId: string; quantity: number }

export function parseSavedCart(raw: string | null): SavedItem[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(value)) return []
    const seen = new Set<string>()
    return value.filter((item): item is SavedItem => {
      if (!item || typeof item.productId !== 'string' || !item.productId || seen.has(item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 999) return false
      seen.add(item.productId)
      return true
    })
  } catch { return [] }
}

export function restoreCart(saved: SavedItem[], products: Product[]): CartItem[] {
  const available = new Map(products.map((product) => [product.id, product]))
  return saved.flatMap(({ productId, quantity }) => {
    const product = available.get(productId)
    return product ? [{ product, quantity }] : []
  })
}
