import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { apiPath, readError } from '../api'
import type { CartItem, Category, CheckoutForm, Order, OrderType, Product } from '../types'
import { formatPrice } from '../utils'
import { parseSavedCart, restoreCart } from '../cart'
import { StoreFooter, useBusinessSettings } from '../components/StoreFooter'
import type { SavedItem } from '../cart'

const CART_KEY = 'rotiseria.cart.v1'
const ATTEMPT_KEY = 'rotiseria.order-attempt.v1'
function readSavedCart(): SavedItem[] {
  try {
    return parseSavedCart(localStorage.getItem(CART_KEY))
  } catch { return [] }
}

export function PublicMenuPage() {
  const { settings } = useBusinessSettings()
  const [activeView, setActiveView] = useState<'menu' | 'cart' | 'confirmation'>('menu')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartReady, setCartReady] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const [touched, setTouched] = useState({ customerName: false, customerPhone: false, address: false })
  const savedCart = useRef<SavedItem[] | null>(readSavedCart())
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
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const confirmationRef = useRef<HTMLElement | null>(null)
  const cartRef = useRef<HTMLDialogElement | null>(null)
  const attemptRef = useRef<{ fingerprint: string; requestId: string } | null>(null)

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0),
    [cart],
  )

  const cartItemsCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )

  const productsByCategory = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    return categories.filter((category) => !categoryFilter || category.id === categoryFilter).map((category) => ({
      category,
      products: products.filter((product) => product.categoryId === category.id && (!term || `${product.name} ${product.description ?? ''}`.toLocaleLowerCase().includes(term))),
    })).filter(({ products: items }) => items.length > 0)
  }, [categories, products, search, categoryFilter])

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
      const stored = savedCart.current
      if (stored) {
        savedCart.current = null
        const restored = restoreCart(stored, productsData.products)
        setCart(restored)
        if (restored.length < stored.length) setCartNotice('Algunos productos guardados ya no estan disponibles y se quitaron del carrito. Revisa los precios actuales.')
        else if (restored.length) setCartNotice('Recuperamos tu carrito con los precios actuales. Revisalo antes de confirmar.')
      }
      setCartReady(true)
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
    if (!cartReady) return
    try {
      if (cart.length) localStorage.setItem(CART_KEY, JSON.stringify(cart.map(({ product, quantity }) => ({ productId: product.id, quantity }))))
      else localStorage.removeItem(CART_KEY)
    } catch { /* The cart remains usable in memory when storage is unavailable. */ }
  }, [cart, cartReady])

  useEffect(() => {
    if (activeView !== 'menu' || !hasVisibleProducts) return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.menu-category'))
    const sync = () => {
      const current = sections.filter((section) => section.getBoundingClientRect().top <= 160).at(-1) ?? sections[0]
      if (current) setActiveCategory(current.id.replace('category-', ''))
    }
    const observer = new IntersectionObserver(sync, { rootMargin: '-120px 0px -65% 0px', threshold: 0 })
    sections.forEach((section) => observer.observe(section))
    window.addEventListener('scrollend', sync)
    sync()
    return () => { observer.disconnect(); window.removeEventListener('scrollend', sync) }
  }, [activeView, productsByCategory, hasVisibleProducts])

  useEffect(() => {
    if (activeView === 'cart') cartRef.current?.showModal()
  }, [activeView])

  useEffect(() => {
    if (!confirmedOrder) {
      return
    }

    confirmationRef.current?.focus()
  }, [confirmedOrder])

  const addToCart = (product: Product) => {
    setConfirmedOrder(null)
    setAnnouncement(`${product.name} agregado al pedido`)
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
          item.product.id === product.id ? { ...item, quantity: Math.min(999, item.quantity + 1) } : item,
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

  const nameError = touched.customerName && checkout.customerName.trim().length < 2
  const phoneError = touched.customerPhone && checkout.customerPhone.trim().length < 6
  const addressError = touched.address && checkout.orderType === 'DELIVERY' && !checkout.address.trim()

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
          expectedUnitPrice: String(item.product.price),
        })),
      }

      if (!window.crypto?.subtle || !window.crypto.randomUUID) throw new Error('No se pudo asegurar el envio. Abri la tienda mediante una conexion segura.')
      const bytes = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))
      const fingerprint = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
      let previous = attemptRef.current
      try {
        const stored: unknown = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) ?? 'null')
        if (stored && typeof stored === 'object' && 'fingerprint' in stored && 'requestId' in stored && typeof stored.fingerprint === 'string' && typeof stored.requestId === 'string') previous = { fingerprint: stored.fingerprint, requestId: stored.requestId }
      } catch { /* Continue with the in-memory attempt. */ }
      const attempt = previous?.fingerprint === fingerprint ? previous : { fingerprint, requestId: window.crypto.randomUUID() }
      attemptRef.current = attempt
      try { sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt)) } catch { /* The in-memory attempt still protects retries in this tab. */ }

      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, requestId: attempt.requestId }),
      })

      if (!response.ok) {
        const errorMessage = await readError(response)
        if (response.status === 409 || response.status === 400) {
          try {
            const latest = await fetch(apiPath('/api/products?active=true'))
            if (latest.ok) {
              const latestData = (await latest.json()) as { products: Product[] }
              setCart(restoreCart(cart.map(({ product, quantity }) => ({ productId: product.id, quantity })), latestData.products))
            }
          } catch { /* Keep the current cart if the menu cannot be refreshed. */ }
        }
        throw new Error(errorMessage)
      }

      const data = (await response.json()) as { order: Order }
      attemptRef.current = null
      try { sessionStorage.removeItem(ATTEMPT_KEY) } catch { /* Storage may be unavailable. */ }
      setConfirmedOrder(data.order)
      setCart([])
      setActiveView('confirmation')
      setCheckout({
        customerName: '',
        customerPhone: '',
        orderType: 'PICKUP',
        address: '',
        notes: '',
      })
      setTouched({ customerName: false, customerPhone: false, address: false })
      setCartNotice('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="public-shell">
      <nav className="store-nav" aria-label="Navegacion principal">
        <a className="store-brand" href="/">rotiseria<span>cocina de barrio</span></a>
        <div className="store-nav-actions">
          <a href="#menu" onClick={() => setActiveView('menu')}>Ver menu</a>
          <button className="cart-button" onClick={() => setActiveView('cart')} type="button">
            Mi pedido <strong>{cartItemsCount}</strong>
          </button>
        </div>
      </nav>
      {activeView !== 'confirmation' && <header className="public-header">
        <div>
          <h1>Comida rica,<br />para compartir.</h1>
          <p>Comida para disfrutar todos los dias.</p>
          <a className="hero-link" href="#menu" onClick={() => setActiveView('menu')}>Explorar el menu <span aria-hidden="true">&#8599;</span></a>
        </div>

      </header>}

      <a className="regret-entry" href="/arrepentimiento">Boton de arrepentimiento</a>
      {message && activeView !== 'cart' && <p className="form-message" role="alert">{message}</p>}
      {cartNotice && activeView === 'menu' && <p className="cart-notice" role="status">{cartNotice}</p>}

      {activeView === 'confirmation' && confirmedOrder && (
        <section className="confirmation-panel" ref={confirmationRef} tabIndex={-1} aria-live="polite">
          <div>
            <h1>Pedido recibido</h1>
            <p>Gracias, {confirmedOrder.customerName}. Tu pedido fue registrado.</p>
            <p className="confirmation-id">Numero de pedido: <strong>{confirmedOrder.id}</strong></p>
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
            <div className="confirmation-total"><span>Total</span><strong>{formatPrice(confirmedOrder.total)}</strong></div>
            <button type="button" onClick={() => { setConfirmedOrder(null); setActiveView('menu') }}>Volver al menu</button>
          </div>
        </section>
      )}

      {activeView !== 'confirmation' && (
      <div className="public-layout single">
        <section className="menu-panel" id="menu" aria-label="Menu">
          <div className="section-heading">
            <div><h2>Hay algo rico para vos.</h2><p>Explora el menu y arma tu pedido.</p></div>
            <button
              className="secondary compact"
              disabled={loading}
              onClick={() => void loadMenu()}
              type="button"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          <div className="menu-tools">
            <label>Buscar en el menu<input type="search" placeholder="Buscar producto" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <label>Categoria<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas las categorias</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          </div>
          {hasVisibleProducts && <nav className="category-nav" aria-label="Categorias del menu">
            {productsByCategory.map(({ category }) => <a className={activeCategory === category.id ? 'target-current' : undefined} aria-current={activeCategory === category.id ? 'true' : undefined} href={`#category-${category.id}`} key={category.id}>{category.name}</a>)}
          </nav>}
          {loading && products.length === 0 ? (
            <div className="menu-skeleton" role="status"><span className="sr-only">Cargando menu</span>{[1, 2, 3, 4].map((item) => <div key={item} aria-hidden="true"><i /><i /><i /></div>)}</div>
          ) : message && !hasVisibleProducts ? null : !hasVisibleProducts ? (
            <div className="menu-empty"><h3>{search || categoryFilter ? 'No encontramos productos' : 'El menu todavia esta vacio'}</h3><p>{search || categoryFilter ? 'Proba otra busqueda o consulta todas las categorias.' : 'Volvene a pasar pronto para conocer las opciones disponibles.'}</p>{(search || categoryFilter) && <button className="secondary compact" type="button" onClick={() => { setSearch(''); setCategoryFilter('') }}>Limpiar filtros</button>}</div>
          ) : (
            productsByCategory.map(({ category, products: categoryProducts }) => (
              <section className="menu-category" id={`category-${category.id}`} tabIndex={-1} key={category.id}>
                <h3>{category.name}</h3>

                {categoryProducts.length === 0 ? (
                  <p className="muted-text">Sin productos disponibles.</p>
                ) : (
                  <div className="menu-grid">
                    {categoryProducts.map((product) => (
                      <article className={product.imageUrl ? 'menu-item has-photo' : 'menu-item'} key={product.id}>
                        {product.imageUrl && <img className="product-photo" src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} />}
                        <div>
                          <h4>{product.name}</h4>
                          {product.description && <p>{product.description}</p>}
                          {product.ingredients && <p className="food-details"><strong>Ingredientes:</strong> {product.ingredients}</p>}
                          {product.allergens && <p className="food-details"><strong>Alergenos:</strong> {product.allergens}</p>}
                          {!product.allergens && <p className="food-details">Alergenos no informados. Consulta antes de pedir.</p>}
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
                            aria-label={`Agregar ${product.name} al pedido`}
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
      )}
      {activeView === 'cart' && (
        <dialog className="cart-screen" ref={cartRef} aria-label="Tu pedido" onCancel={() => setActiveView('menu')}>
          <div className="cart-screen-header">
            <div>
              
              <h2>Tu pedido</h2>
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

          {message && <p className="form-message" role="alert">{message}</p>}
          {cartNotice && <p className="cart-notice" role="status">{cartNotice}</p>}
          <div className="cart-summary">
            <span>{cartItemsCount} {cartItemsCount === 1 ? 'producto' : 'productos'}</span>
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
                      aria-label={`Quitar una unidad de ${item.product.name}`}
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="secondary"
                      aria-label={`Agregar una unidad de ${item.product.name}`}
                      disabled={item.quantity >= 999}
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
            <span>Subtotal de productos</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          {cart.length > 0 && <form className="checkout-form" onSubmit={createOrder}>
            <section className="checkout-section">
              <h3>Datos del cliente</h3>
              <label htmlFor="checkout-name">
                Nombre (obligatorio)
                <input
                  id="checkout-name"
                  autoComplete="name"
                  required minLength={2} maxLength={50}
                  aria-invalid={nameError || undefined}
                  aria-describedby={nameError ? 'name-error' : undefined}
                  onBlur={() => setTouched((current) => ({ ...current, customerName: true }))}
                  onChange={(event) => updateCheckoutField('customerName', event.target.value)}
                  value={checkout.customerName}
                />
                {nameError && <span id="name-error" className="field-error">Ingresa al menos 2 caracteres.</span>}
              </label>

              <label htmlFor="checkout-phone">
                Telefono (obligatorio)
                <input
                  id="checkout-phone"
                  autoComplete="tel"
                  required minLength={6} maxLength={30}
                  inputMode="tel"
                  aria-invalid={phoneError || undefined}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                  onBlur={() => setTouched((current) => ({ ...current, customerPhone: true }))}
                  onChange={(event) => updateCheckoutField('customerPhone', event.target.value)}
                  value={checkout.customerPhone}
                />
                {phoneError && <span id="phone-error" className="field-error">Ingresa al menos 6 caracteres.</span>}
              </label>
            </section>

            <section className="checkout-section">
              <h3>Entrega</h3>
              <fieldset className="delivery-options"><legend>Tipo de pedido</legend>
                {(['PICKUP', 'DELIVERY'] as OrderType[]).map((type) => <label key={type}><input type="radio" name="orderType" checked={checkout.orderType === type} onChange={() => updateCheckoutField('orderType', type)} />{type === 'PICKUP' ? 'Retiro' : 'Envio'}</label>)}
              </fieldset>
              {checkout.orderType === 'DELIVERY' && <p className="delivery-note">El costo de envio no esta informado en el sistema. Consulta con la rotiseria.</p>}

              {checkout.orderType === 'DELIVERY' && (
                <label htmlFor="checkout-address">
                  Direccion (obligatoria)
                  <input
                    id="checkout-address"
                    autoComplete="street-address"
                    required
                    aria-invalid={addressError || undefined}
                    aria-describedby={addressError ? 'address-error' : undefined}
                    onBlur={() => setTouched((current) => ({ ...current, address: true }))}
                    onChange={(event) => updateCheckoutField('address', event.target.value)}
                    value={checkout.address}
                  />
                  {addressError && <span id="address-error" className="field-error">Ingresa la direccion de entrega.</span>}
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
              {submitting ? 'Enviando...' : `Confirmar pedido - ${formatPrice(cartTotal)} en productos`}
            </button>
          </form>}
        </dialog>
      )}
      <StoreFooter settings={settings} hasFloatingCart={activeView === 'menu' && cartItemsCount > 0} />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      {activeView === 'menu' && cartItemsCount > 0 && <button className="mobile-cart" type="button" onClick={() => setActiveView('cart')}><span>Ver pedido ({cartItemsCount})</span><strong>{formatPrice(cartTotal)}</strong></button>}
    </main>
  )
}

