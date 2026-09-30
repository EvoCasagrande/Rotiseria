import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { apiPath, readError } from '../api'
import type { CartItem, Category, CheckoutForm, Order, OrderType, Product } from '../types'
import { formatPrice } from '../utils'

export function PublicMenuPage() {
  const [activeView, setActiveView] = useState<'menu' | 'cart'>('menu')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [checkout, setCheckout] = useState<CheckoutForm>({
    customerName: '',
    customerPhone: '',
    orderType: 'PICKUP',
    address: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0),
    [cart],
  )

  const cartItemsCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )

  const productsByCategory = useMemo(() => {
    return categories.map((category) => ({
      category,
      products: products.filter((product) => product.categoryId === category.id),
    }))
  }, [categories, products])

  const hasVisibleProducts = productsByCategory.some(
    ({ products: categoryProducts }) => categoryProducts.length > 0,
  )

  const loadMenu = async () => {
    setLoading(true)
    setMessage('')

    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch(apiPath('/api/categories?active=true')),
        fetch(apiPath('/api/products?active=true')),
      ])

      if (!categoriesResponse.ok) {
        throw new Error(await readError(categoriesResponse))
      }

      if (!productsResponse.ok) {
        throw new Error(await readError(productsResponse))
      }

      const categoriesData = (await categoriesResponse.json()) as { categories: Category[] }
      const productsData = (await productsResponse.json()) as { products: Product[] }
      setCategories(categoriesData.categories)
      setProducts(productsData.products)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMenu()
  }, [])

  const addToCart = (product: Product) => {
    setConfirmedOrder(null)
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id)

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [...currentCart, { product, quantity: 1 }]
    })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((currentCart) => {
      if (quantity <= 0) {
        return currentCart.filter((item) => item.product.id !== productId)
      }

      return currentCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      )
    })
  }

  const updateCheckoutField = (field: keyof CheckoutForm, value: string) => {
    setCheckout((currentCheckout) => ({
      ...currentCheckout,
      [field]: value,
    }))
  }

  const createOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setConfirmedOrder(null)

    try {
      if (cart.length === 0) {
        throw new Error('Agrega al menos un producto al carrito')
      }

      const payload = {
        customerName: checkout.customerName.trim(),
        customerPhone: checkout.customerPhone.trim(),
        orderType: checkout.orderType,
        address: checkout.orderType === 'DELIVERY' ? checkout.address.trim() : undefined,
        notes: checkout.notes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }

      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as { order: Order }
      setConfirmedOrder(data.order)
      setCart([])
      setActiveView('menu')
      setCheckout({
        customerName: '',
        customerPhone: '',
        orderType: 'PICKUP',
        address: '',
        notes: '',
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="public-shell">
      <header className="public-header">
        <div>
          <p className="eyebrow dark">Rotiseria</p>
          <h1>Menu del dia</h1>
          <p>Elegi tus productos, revisa el carrito y envia el pedido.</p>
        </div>

        <div className="public-actions">
          <button className="cart-button" onClick={() => setActiveView('cart')} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M6.2 6h15.1l-1.8 8.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.4 3.8H2.8" />
              <circle cx="9.5" cy="20" r="1.4" />
              <circle cx="17.5" cy="20" r="1.4" />
            </svg>
            <span>Carrito</span>
            {cartItemsCount > 0 && <strong>{cartItemsCount}</strong>}
          </button>

          <a className="admin-link" href="/admin">
            Panel admin
          </a>
        </div>
      </header>

      {message && <p className="form-message">{message}</p>}

      {confirmedOrder && (
        <section className="confirmation-panel" aria-live="polite">
          <div>
            <p className="eyebrow dark">Pedido recibido</p>
            <h2>Gracias, {confirmedOrder.customerName}</h2>
            <p>
              Tu pedido quedo registrado como{' '}
              {confirmedOrder.orderType === 'DELIVERY' ? 'envio' : 'retiro'}.
            </p>
            <ul className="confirmation-items">
              {confirmedOrder.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.quantity} x {item.product.name}
                  </span>
                  <strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <strong>{formatPrice(confirmedOrder.total)}</strong>
        </section>
      )}

      {activeView === 'menu' ? (
      <div className="public-layout single">
        <section className="menu-panel" aria-label="Menu">
          <div className="section-heading">
            <h2>Productos</h2>
            <button
              className="secondary compact"
              disabled={loading}
              onClick={() => void loadMenu()}
              type="button"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {productsByCategory.length === 0 && !loading ? (
            <p className="empty-state">Todavia no hay productos disponibles.</p>
          ) : !hasVisibleProducts && !loading ? (
            <p className="empty-state">Todavia no hay productos disponibles.</p>
          ) : (
            productsByCategory.map(({ category, products: categoryProducts }) => (
              <section className="menu-category" key={category.id}>
                <h3>{category.name}</h3>

                {categoryProducts.length === 0 ? (
                  <p className="muted-text">Sin productos disponibles.</p>
                ) : (
                  <div className="menu-grid">
                    {categoryProducts.map((product) => (
                      <article className="menu-item" key={product.id}>
                        <div>
                          <h4>{product.name}</h4>
                          {product.description && <p>{product.description}</p>}
                        </div>

                        <div className="menu-item-footer">
                          <strong>{formatPrice(product.price)}</strong>
                          <button className="compact" onClick={() => addToCart(product)} type="button">
                            Agregar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </section>
      </div>
      ) : (
        <section className="cart-screen" aria-label="Carrito">
          <div className="cart-screen-header">
            <div>
              <p className="eyebrow dark">Pedido</p>
              <h2>Carrito</h2>
            </div>
            <button className="secondary compact" onClick={() => setActiveView('menu')} type="button">
              Volver al menu
            </button>
          </div>

          {cart.length === 0 ? (
            <p className="empty-state">Tu carrito esta vacio.</p>
          ) : (
            <ul className="cart-list">
              {cart.map((item) => (
                <li key={item.product.id}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{formatPrice(item.product.price)}</span>
                  </div>

                  <div className="quantity-control">
                    <button
                      className="secondary"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="secondary"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          <form className="checkout-form" onSubmit={createOrder}>
            <label>
              Nombre
              <input
                onChange={(event) => updateCheckoutField('customerName', event.target.value)}
                value={checkout.customerName}
              />
            </label>

            <label>
              Telefono
              <input
                inputMode="tel"
                onChange={(event) => updateCheckoutField('customerPhone', event.target.value)}
                value={checkout.customerPhone}
              />
            </label>

            <label>
              Tipo de pedido
              <select
                onChange={(event) => updateCheckoutField('orderType', event.target.value as OrderType)}
                value={checkout.orderType}
              >
                <option value="PICKUP">Retiro</option>
                <option value="DELIVERY">Envio</option>
              </select>
            </label>

            {checkout.orderType === 'DELIVERY' && (
              <label>
                Direccion
                <input
                  onChange={(event) => updateCheckoutField('address', event.target.value)}
                  value={checkout.address}
                />
              </label>
            )}

            <label>
              Observaciones
              <textarea
                maxLength={200}
                onChange={(event) => updateCheckoutField('notes', event.target.value)}
                value={checkout.notes}
              />
            </label>

            <button disabled={submitting || cart.length === 0} type="submit">
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </form>
        </section>
      )}
    </main>
  )
}
