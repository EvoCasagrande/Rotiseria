import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Admin = {
  id: string
  name: string
  email: string
  active: boolean
}

type AuthResponse = {
  status: string
  token: string
  admin: Admin
}

type ApiError = {
  message?: string
}

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

type OrderItem = {
  id: string
  quantity: number
  unitPrice: string
  product: {
    id: string
    name: string
  }
}

type Order = {
  id: string
  customerName: string
  customerPhone: string
  address: string | null
  notes: string | null
  orderType: 'DELIVERY' | 'PICKUP'
  status: OrderStatus
  total: string
  createdAt: string
  items: OrderItem[]
}

type Category = {
  id: string
  name: string
  active: boolean
  _count?: {
    products: number
  }
}

type Product = {
  id: string
  name: string
  description: string | null
  price: string
  active: boolean
  categoryId: string
  category: {
    id: string
    name: string
    active: boolean
  }
}

type ProductForm = {
  name: string
  description: string
  price: string
  categoryId: string
}

type AdminSection = 'orders' | 'categories' | 'products'

const TOKEN_KEY = 'rotiseria.jwt'

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiError
    return data.message ?? 'Ocurrio un error inesperado'
  } catch {
    return 'Ocurrio un error inesperado'
  }
}

function App() {
  const [email, setEmail] = useState('admin@rotiseria.com')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSection>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [newProduct, setNewProduct] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  })
  const [editingProductId, setEditingProductId] = useState('')
  const [editingProduct, setEditingProduct] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  })
  const [loading, setLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [ordersMessage, setOrdersMessage] = useState('')
  const [categoriesMessage, setCategoriesMessage] = useState('')
  const [productsMessage, setProductsMessage] = useState('')

  const isLoggedIn = Boolean(token && admin)

  const loadSession = async (currentToken = token) => {
    if (!currentToken) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as { admin: Admin }
      setAdmin(data.admin)
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY)
      setToken('')
      setAdmin(null)
      setMessage(error instanceof Error ? error.message : 'Sesion invalida')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async (currentToken = token) => {
    if (!currentToken) {
      return
    }

    setOrdersLoading(true)
    setOrdersMessage('')

    try {
      const response = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as { orders: Order[] }
      setOrders(data.orders)
    } catch (error) {
      setOrdersMessage(error instanceof Error ? error.message : 'No se pudieron cargar pedidos')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesMessage('')

    try {
      const response = await fetch('/api/categories')

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as { categories: Category[] }
      setCategories(data.categories)
    } catch (error) {
      setCategoriesMessage(error instanceof Error ? error.message : 'No se pudieron cargar categorias')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadProducts = async () => {
    setProductsLoading(true)
    setProductsMessage('')

    try {
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as { products: Product[] }
      setProducts(data.products)
    } catch (error) {
      setProductsMessage(error instanceof Error ? error.message : 'No se pudieron cargar productos')
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    void loadSession()
    // Runs only on first render to restore a saved token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (token && admin) {
      void loadOrders()
    }
    // Loads orders after a restored session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, token])

  useEffect(() => {
    if (admin && activeSection === 'categories') {
      void loadCategories()
    }
  }, [activeSection, admin])

  useEffect(() => {
    if (admin && activeSection === 'products') {
      void loadProducts()
      void loadCategories()
    }
  }, [activeSection, admin])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as AuthResponse

      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setAdmin(data.admin)
      setPassword('')
      await loadOrders(data.token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setAdmin(null)
    setOrders([])
    setCategories([])
    setProducts([])
    setPassword('')
    setMessage('')
    setOrdersMessage('')
    setCategoriesMessage('')
    setProductsMessage('')
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrdersMessage('')

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data = (await response.json()) as { order: Order }
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === data.order.id ? data.order : order)),
      )
    } catch (error) {
      setOrdersMessage(error instanceof Error ? error.message : 'No se pudo actualizar el pedido')
    }
  }

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = newCategoryName.trim()
    if (!name) {
      setCategoriesMessage('Ingresa un nombre de categoria')
      return
    }

    setCategoriesLoading(true)
    setCategoriesMessage('')

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      setNewCategoryName('')
      await loadCategories()
    } catch (error) {
      setCategoriesMessage(error instanceof Error ? error.message : 'No se pudo crear la categoria')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const startEditingCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
    setCategoriesMessage('')
  }

  const cancelEditingCategory = () => {
    setEditingCategoryId('')
    setEditingCategoryName('')
  }

  const updateCategory = async (categoryId: string) => {
    const name = editingCategoryName.trim()
    if (!name) {
      setCategoriesMessage('Ingresa un nombre de categoria')
      return
    }

    setCategoriesLoading(true)
    setCategoriesMessage('')

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      cancelEditingCategory()
      await loadCategories()
    } catch (error) {
      setCategoriesMessage(error instanceof Error ? error.message : 'No se pudo actualizar la categoria')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const deactivateCategory = async (categoryId: string) => {
    setCategoriesLoading(true)
    setCategoriesMessage('')

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      await loadCategories()
    } catch (error) {
      setCategoriesMessage(error instanceof Error ? error.message : 'No se pudo desactivar la categoria')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const updateNewProductField = (field: keyof ProductForm, value: string) => {
    setNewProduct((currentProduct) => ({
      ...currentProduct,
      [field]: value,
    }))
  }

  const updateEditingProductField = (field: keyof ProductForm, value: string) => {
    setEditingProduct((currentProduct) => ({
      ...currentProduct,
      [field]: value,
    }))
  }

  const buildProductPayload = (form: ProductForm) => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      categoryId: form.categoryId,
    }

    if (!payload.name || !payload.categoryId || Number.isNaN(payload.price)) {
      throw new Error('Completa nombre, precio y categoria')
    }

    return payload
  }

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProductsLoading(true)
    setProductsMessage('')

    try {
      const payload = buildProductPayload(newProduct)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      setNewProduct({ name: '', description: '', price: '', categoryId: '' })
      await loadProducts()
    } catch (error) {
      setProductsMessage(error instanceof Error ? error.message : 'No se pudo crear el producto')
    } finally {
      setProductsLoading(false)
    }
  }

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id)
    setEditingProduct({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      categoryId: product.categoryId,
    })
    setProductsMessage('')
  }

  const cancelEditingProduct = () => {
    setEditingProductId('')
    setEditingProduct({ name: '', description: '', price: '', categoryId: '' })
  }

  const updateProduct = async (productId: string) => {
    setProductsLoading(true)
    setProductsMessage('')

    try {
      const payload = buildProductPayload(editingProduct)

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      cancelEditingProduct()
      await loadProducts()
    } catch (error) {
      setProductsMessage(error instanceof Error ? error.message : 'No se pudo actualizar el producto')
    } finally {
      setProductsLoading(false)
    }
  }

  const deactivateProduct = async (productId: string) => {
    setProductsLoading(true)
    setProductsMessage('')

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      await loadProducts()
    } catch (error) {
      setProductsMessage(error instanceof Error ? error.message : 'No se pudo desactivar el producto')
    } finally {
      setProductsLoading(false)
    }
  }

  if (admin) {
    return (
      <main className="admin-shell">
        <header className="admin-topbar">
          <div className="admin-brand">
            <span className="brand-mark">R</span>
            <div>
              <strong>Rotiseria</strong>
              <span>Panel interno</span>
            </div>
          </div>

          <nav className="admin-nav" aria-label="Secciones del panel">
            <button
              className={activeSection === 'orders' ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveSection('orders')}
              type="button"
            >
              Pedidos
            </button>
            <button
              className={activeSection === 'categories' ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveSection('categories')}
              type="button"
            >
              Categorias
            </button>
            <button
              className={activeSection === 'products' ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveSection('products')}
              type="button"
            >
              Productos
            </button>
          </nav>

          <div className="admin-user">
            <div>
              <strong>{admin.name}</strong>
              <span>{admin.email}</span>
            </div>
            <button className="secondary compact" onClick={handleLogout} type="button">
              Salir
            </button>
          </div>
        </header>

        <section className="admin-content">
          {activeSection === 'orders' && (
            <div className="dashboard">
              <header className="dashboard-header">
                <div>
                  <p className="eyebrow dark">Administracion</p>
                  <h1>Pedidos</h1>
                  <p>Revisa pedidos recibidos y actualiza su estado de preparacion.</p>
                </div>

                <div className="header-actions">
                  <button disabled={loading} onClick={() => void loadSession()} type="button">
                    {loading ? 'Validando...' : 'Validar sesion'}
                  </button>
                  <button disabled={ordersLoading} onClick={() => void loadOrders()} type="button">
                    {ordersLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
              </header>

              {message && <p className="form-message">{message}</p>}
              {ordersMessage && <p className="form-message">{ordersMessage}</p>}

              <div className="orders-toolbar">
                <span>{orders.length} pedidos</span>
              </div>

              <section className="orders-list" aria-label="Lista de pedidos">
                {orders.length === 0 && !ordersLoading ? (
                  <p className="empty-state">Todavia no hay pedidos para mostrar.</p>
                ) : (
                  orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-main">
                        <div>
                          <div className="order-title-row">
                            <h2>{order.customerName}</h2>
                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="order-meta">
                            {order.customerPhone} -{' '}
                            {order.orderType === 'DELIVERY' ? 'Envio' : 'Retiro'} -{' '}
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                          {order.address && <p className="order-note">Direccion: {order.address}</p>}
                          {order.notes && <p className="order-note">Notas: {order.notes}</p>}
                        </div>

                        <div className="order-total">
                          <span>Total</span>
                          <strong>${Number(order.total).toLocaleString('es-AR')}</strong>
                        </div>
                      </div>

                      <ul className="items-list">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <span>
                              {item.quantity} x {item.product.name}
                            </span>
                            <strong>${Number(item.unitPrice).toLocaleString('es-AR')}</strong>
                          </li>
                        ))}
                      </ul>

                      <label className="status-control">
                        Estado
                        <select
                          onChange={(event) =>
                            void updateOrderStatus(order.id, event.target.value as OrderStatus)
                          }
                          value={order.status}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))
                )}
              </section>
            </div>
          )}

          {activeSection === 'categories' && (
            <div className="dashboard">
              <header className="dashboard-header">
                <div>
                  <p className="eyebrow dark">Menu</p>
                  <h1>Categorias</h1>
                  <p>Administra los grupos visibles del menu y su disponibilidad.</p>
                </div>

                <div className="header-actions single">
                  <button disabled={categoriesLoading} onClick={() => void loadCategories()} type="button">
                    {categoriesLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
              </header>

              {categoriesMessage && <p className="form-message">{categoriesMessage}</p>}

              <form className="inline-form" onSubmit={createCategory}>
                <label>
                  Nueva categoria
                  <input
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Ej: Pizzas"
                    value={newCategoryName}
                  />
                </label>
                <button disabled={categoriesLoading} type="submit">
                  Crear
                </button>
              </form>

              <section className="table-panel" aria-label="Lista de categorias">
                <div className="table-header category-row">
                  <span>Nombre</span>
                  <span>Productos</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>

                {categories.length === 0 && !categoriesLoading ? (
                  <p className="empty-state">Todavia no hay categorias para mostrar.</p>
                ) : (
                  categories.map((category) => (
                    <article className="table-row category-row" key={category.id}>
                      <div>
                        {editingCategoryId === category.id ? (
                          <input
                            onChange={(event) => setEditingCategoryName(event.target.value)}
                            value={editingCategoryName}
                          />
                        ) : (
                          <strong>{category.name}</strong>
                        )}
                      </div>

                      <span>{category._count?.products ?? 0}</span>

                      <span
                        className={category.active ? 'status-badge status-ready' : 'status-badge status-cancelled'}
                      >
                        {category.active ? 'ACTIVA' : 'INACTIVA'}
                      </span>

                      <div className="row-actions">
                        {editingCategoryId === category.id ? (
                          <>
                            <button
                              disabled={categoriesLoading}
                              onClick={() => void updateCategory(category.id)}
                              type="button"
                            >
                              Guardar
                            </button>
                            <button className="secondary" onClick={cancelEditingCategory} type="button">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="secondary"
                              onClick={() => startEditingCategory(category)}
                              type="button"
                            >
                              Editar
                            </button>
                            <button
                              className="danger"
                              disabled={categoriesLoading || !category.active}
                              onClick={() => void deactivateCategory(category.id)}
                              type="button"
                            >
                              Desactivar
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </div>
          )}

          {activeSection === 'products' && (
            <div className="dashboard">
              <header className="dashboard-header">
                <div>
                  <p className="eyebrow dark">Menu</p>
                  <h1>Productos</h1>
                  <p>Administra productos, precios, descripciones y categorias.</p>
                </div>

                <div className="header-actions single">
                  <button disabled={productsLoading} onClick={() => void loadProducts()} type="button">
                    {productsLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
              </header>

              {productsMessage && <p className="form-message">{productsMessage}</p>}

              <form className="product-form" onSubmit={createProduct}>
                <label>
                  Nombre
                  <input
                    onChange={(event) => updateNewProductField('name', event.target.value)}
                    placeholder="Ej: Pizza muzzarella"
                    value={newProduct.name}
                  />
                </label>

                <label>
                  Descripcion
                  <input
                    onChange={(event) => updateNewProductField('description', event.target.value)}
                    placeholder="Opcional"
                    value={newProduct.description}
                  />
                </label>

                <label>
                  Precio
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateNewProductField('price', event.target.value)}
                    placeholder="8000"
                    type="number"
                    value={newProduct.price}
                  />
                </label>

                <label>
                  Categoria
                  <select
                    onChange={(event) => updateNewProductField('categoryId', event.target.value)}
                    value={newProduct.categoryId}
                  >
                    <option value="">Seleccionar</option>
                    {categories
                      .filter((category) => category.active)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>

                <button disabled={productsLoading} type="submit">
                  Crear
                </button>
              </form>

              <section className="table-panel" aria-label="Lista de productos">
                <div className="table-header product-row">
                  <span>Producto</span>
                  <span>Categoria</span>
                  <span>Precio</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>

                {products.length === 0 && !productsLoading ? (
                  <p className="empty-state">Todavia no hay productos para mostrar.</p>
                ) : (
                  products.map((product) => (
                    <article className="table-row product-row" key={product.id}>
                      <div className="product-name-cell">
                        {editingProductId === product.id ? (
                          <>
                            <input
                              onChange={(event) => updateEditingProductField('name', event.target.value)}
                              value={editingProduct.name}
                            />
                            <input
                              onChange={(event) =>
                                updateEditingProductField('description', event.target.value)
                              }
                              placeholder="Descripcion"
                              value={editingProduct.description}
                            />
                          </>
                        ) : (
                          <>
                            <strong>{product.name}</strong>
                            {product.description && <span>{product.description}</span>}
                          </>
                        )}
                      </div>

                      <div>
                        {editingProductId === product.id ? (
                          <select
                            onChange={(event) =>
                              updateEditingProductField('categoryId', event.target.value)
                            }
                            value={editingProduct.categoryId}
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{product.category.name}</span>
                        )}
                      </div>

                      <div>
                        {editingProductId === product.id ? (
                          <input
                            inputMode="decimal"
                            onChange={(event) => updateEditingProductField('price', event.target.value)}
                            type="number"
                            value={editingProduct.price}
                          />
                        ) : (
                          <strong>${Number(product.price).toLocaleString('es-AR')}</strong>
                        )}
                      </div>

                      <span
                        className={product.active ? 'status-badge status-ready' : 'status-badge status-cancelled'}
                      >
                        {product.active ? 'ACTIVO' : 'INACTIVO'}
                      </span>

                      <div className="row-actions">
                        {editingProductId === product.id ? (
                          <>
                            <button
                              disabled={productsLoading}
                              onClick={() => void updateProduct(product.id)}
                              type="button"
                            >
                              Guardar
                            </button>
                            <button className="secondary" onClick={cancelEditingProduct} type="button">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="secondary"
                              onClick={() => startEditingProduct(product)}
                              type="button"
                            >
                              Editar
                            </button>
                            <button
                              className="danger"
                              disabled={productsLoading || !product.active}
                              onClick={() => void deactivateProduct(product.id)}
                              type="button"
                            >
                              Desactivar
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </div>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="login-shell">
      <section className="brand-panel" aria-label="Resumen del panel">
        <div>
          <p className="eyebrow">Rotiseria</p>
          <h1>Panel interno</h1>
          <p className="summary">
            Acceso administrativo para revisar pedidos, productos y categorias del menu.
          </p>
        </div>

        <div className="status-strip">
          <span className={isLoggedIn ? 'status-dot online' : 'status-dot'} />
          <span>{isLoggedIn ? 'Sesion activa' : 'Esperando login'}</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-header">
            <h2>Ingresar</h2>
            <p>Usa el usuario admin creado con el seed.</p>
          </div>

          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {message && <p className="form-message">{message}</p>}

          <button disabled={loading} type="submit">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
