import { describe, expect, it } from 'vitest'
import { parseSavedCart, restoreCart } from '../client/src/cart'
import type { Product } from '../client/src/types'

const product: Product = { id: 'pizza', name: 'Pizza', description: null, price: '1200', active: true, categoryId: 'c', category: { id: 'c', name: 'Pizzas', active: true } }

describe('carrito guardado', () => {
  it('ignora datos invalidos y cantidades repetidas', () => {
    expect(parseSavedCart('{')).toEqual([])
    expect(parseSavedCart(JSON.stringify([{ productId: 'pizza', quantity: 2 }, { productId: 'pizza', quantity: 3 }, { productId: 'bad', quantity: -1 }]))).toEqual([{ productId: 'pizza', quantity: 2 }])
  })
  it('restaura solo productos disponibles con su precio actual', () => {
    expect(restoreCart([{ productId: 'pizza', quantity: 2 }, { productId: 'missing', quantity: 1 }], [product])).toEqual([{ product, quantity: 2 }])
  })
})
