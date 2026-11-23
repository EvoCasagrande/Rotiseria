import { describe, expect, it } from 'vitest'
import { createProductSchema, updateProductSchema } from '../src/modules/products/products.schema.js'

describe('imagen del producto', () => {
  const body = { name: 'Pizza', price: 100, categoryId: 'c' }
  it('admite URL web y permite borrar la imagen', () => {
    expect(createProductSchema.safeParse({ body: { ...body, imageUrl: 'https://example.com/pizza.jpg' } }).success).toBe(true)
    expect(updateProductSchema.safeParse({ params: { id: 'p' }, body: { imageUrl: null } }).success).toBe(true)
  })
  it('rechaza protocolos distintos a HTTP o HTTPS', () => {
    expect(createProductSchema.safeParse({ body: { ...body, imageUrl: 'javascript:alert(1)' } }).success).toBe(false)
  })
})
