import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [recentlyAddedProductId, setRecentlyAddedProductId] = useState('')
  const confirmationRef = useRef<HTMLElement | null>(null)

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

  useEffect(() => {
    if (!confirmedOrder) {
      return
    }

    window.setTimeout(() => {
      confirmationRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }, [confirmedOrder])

  const addToCart = (product: Product) => {
    setConfirmedOrder(null)
    setRecentlyAddedProductId(product.id)
    window.setTimeout(() => {
      setRecentlyAddedProductId((currentProductId) =>
        currentProductId === product.id ? '' : currentProductId,
      )
    }, 1000)

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
          <h1>Algo rico te espera.</h1>
          <p>Elegi tus favoritos y hacenos tu pedido en unos minutos.</p>
        </div>

      </header>

      {message && <p className="form-message">{message}</p>}

      {confirmedOrder && (
        <section className="confirmation-panel" ref={confirmationRef} aria-live="polite">
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
            <div><h2>Nuestro menu</h2><p>Encontra algo para disfrutar hoy.</p></div>
            <button
              className="secondary compact"
              disabled={loading}
              onClick={() => void loadMenu()}
              type="button"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {hasVisibleProducts && <nav className="category-nav" aria-label="Categorias del menu">
            {productsByCategory.filter(({ products: items }) => items.length > 0).map(({ category }) => <a href={`#category-${category.id}`} key={category.id}>{category.name}</a>)}
          </nav>}
          {productsByCategory.length === 0 && !loading ? (
            <p className="empty-state">Todavia no hay productos disponibles.</p>
          ) : !hasVisibleProducts && !loading ? (
            <p className="empty-state">Todavia no hay productos disponibles.</p>
          ) : (
            productsByCategory.map(({ category, products: categoryProducts }) => (
              <section className="menu-category" id={`category-${category.id}`} key={category.id}>
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
                          <button
                            className={
                              recentlyAddedProductId === product.id
                                ? 'compact added-feedback'
                                : 'compact'
                            }
                            onClick={() => addToCart(product)}
                            type="button"
                          >
                            {recentlyAddedProductId === product.id ? 'Agregado' : 'Agregar'}
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
            <button
              aria-label="Volver al menu"
              className="back-button"
              onClick={() => setActiveView('menu')}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M15 18 9 12l6-6" />
              </svg>
            </button>
          </div>

          <div className="cart-summary">
            <span>{cartItemsCount} productos</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty"><p>Tu carrito esta vacio.</p><button className="secondary" onClick={() => setActiveView('menu')} type="button">Explorar el menu</button></div>
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
            <section className="checkout-section">
              <h3>Datos del cliente</h3>
              <label>
                Nombre
                <input
                  autoComplete="name"
                  onChange={(event) => updateCheckoutField('customerName', event.target.value)}
                  value={checkout.customerName}
                />
              </label>

              <label>
                Telefono
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={(event) => updateCheckoutField('customerPhone', event.target.value)}
                  value={checkout.customerPhone}
                />
              </label>
            </section>

            <section className="checkout-section">
              <h3>Entrega</h3>
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
                    autoComplete="street-address"
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
            </section>

            <button disabled={submitting || cart.length === 0} type="submit">
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </form>
        </section>
      )}
    </main>
  )
}
