export type Admin = {
  id: string
  name: string
  email: string
  active: boolean
}

export type AuthResponse = {
  status: string
  token: string
  admin: Admin
}

export type ApiError = {
  message?: string
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
export type OrderType = 'DELIVERY' | 'PICKUP'

export type OrderItem = {
  id: string
  quantity: number
  unitPrice: string
  product: {
    id: string
    name: string
  }
}

export type Order = {
  id: string
  customerName: string
  customerPhone: string
  address: string | null
  notes: string | null
  orderType: OrderType
  status: OrderStatus
  total: string
  createdAt: string
  items: OrderItem[]
}

export type Category = {
  id: string
  name: string
  active: boolean
  _count?: {
    products: number
  }
}

export type Product = {
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

export type ProductForm = {
  name: string
  description: string
  price: string
  categoryId: string
}

export type OrderFilters = {
  search: string
  status: '' | OrderStatus
  orderType: '' | OrderType
}

export type CheckoutForm = {
  customerName: string
  customerPhone: string
  orderType: OrderType
  address: string
  notes: string
}

export type CartItem = {
  product: Product
  quantity: number
}

export type AdminSection = 'orders' | 'categories' | 'products'
