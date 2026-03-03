const API_URL = "https://figures-astrology-podcast-rachel.trycloudflare.com/api/v1";

// Types based on API documentation
export interface User {
  uid: string;
  full_name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'user';
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    email: string;
    uid: string;
  };
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  category: string;
  image?: string;
  product_type: 'physical_book' | 'ebook' | 'kit' | 'magazine';
  isbn?: string;
  author?: string;
  publisher?: string;
  pub_year?: number;
  edition?: string;
  num_pages?: number;
  weight?: number;
  dimensions?: string;
  language?: string;
  format?: 'pdf' | 'epub' | 'mobi';
  size?: number;
  file_path?: string;
  discount_percent?: number;
}

export interface Address {
  uid: string;
  user_uid: string;
  street: string;
  street_number: number;
  neighborhood: string;
  city: string;
  state_code: string;
  zip_code: string;
  country: string;
  complement?: string;
  reference?: string;
  address_type: string;
  primary: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_uid: string;
  status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  address_uid: string;
  note?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
}

export interface Cart {
  id: number;
  user_uid: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export interface ShippingProduct {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

export interface ShippingQuote {
  id?: string;
  name?: string;
  price?: number;
  final_price?: number;
  custom_price?: number;
  company?: any;
  delivery_time?: any;
}

export interface ViaCepAddress {
  postal_code: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface AdminSummary {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
}

export interface MercadoPagoCheckout {
  preferenceId: string;
  initPoint: string;
}

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API Service
export const api = {
  // Auth / Users
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async signup(data: { full_name: string; email: string; cpf: string; password: string }): Promise<User> {
    const response = await fetch(`${API_URL}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Signup failed');
    return response.json();
  },

  async getMe(): Promise<User> {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_URL}/users/logout`, {
      headers: getAuthHeader(),
    });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async updateUser(userId: string, data: { full_name?: string; email?: string; password?: string }): Promise<User> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get users');
    return response.json();
  },

  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get products');
    return response.json();
  },

  async getProduct(productId: number): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get product');
    return response.json();
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_URL}/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  async updateProduct(productId: number, data: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  async deleteProduct(productId: number): Promise<void> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },

  // Addresses
  async getAddresses(userId: string): Promise<Address[]> {
    const response = await fetch(`${API_URL}/users/${userId}/addresses/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get addresses');
    return response.json();
  },

  async getAddress(userId: string, addressId: string): Promise<Address> {
    const response = await fetch(`${API_URL}/users/${userId}/addresses/${addressId}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get address');
    return response.json();
  },

  async createAddress(userId: string, data: Omit<Address, 'uid' | 'user_uid'>): Promise<Address> {
    const response = await fetch(`${API_URL}/users/${userId}/addresses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create address');
    return response.json();
  },

  async updateAddress(userId: string, addressId: string, data: Partial<Address>): Promise<Address> {
    const response = await fetch(`${API_URL}/users/${userId}/addresses/${addressId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update address');
    return response.json();
  },

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${userId}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete address');
  },

  // Orders
  async getOrders(userId: string): Promise<Order[]> {
    const response = await fetch(`${API_URL}/users/${userId}/orders/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get orders');
    return response.json();
  },

  async getOrder(userId: string, orderId: number): Promise<Order> {
    const response = await fetch(`${API_URL}/users/${userId}/orders/${orderId}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get order');
    return response.json();
  },

  async createOrder(
    userId: string,
    data: {
      address_uid: string;
      items: { product_id: number; quantity: number }[];
      shipping: number;
      discount?: number;
      note?: string;
    }
  ): Promise<Order> {
    const response = await fetch(`${API_URL}/users/${userId}/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  },

  async updateOrder(
    userId: string,
    orderId: number,
    data: { status?: string; shipping?: number; discount?: number; note?: string }
  ): Promise<Order> {
    const response = await fetch(`${API_URL}/users/${userId}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update order');
    return response.json();
  },

  async deleteOrder(userId: string, orderId: number): Promise<void> {
    const response = await fetch(`${API_URL}/users/${userId}/orders/${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete order');
  },

  // Cart
  async getCart(userId: string): Promise<Cart> {
    const response = await fetch(`${API_URL}/users/${userId}/cart/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get cart');
    return response.json();
  },

  async addToCart(userId: string, productId: number, quantity: number): Promise<Cart> {
    const response = await fetch(`${API_URL}/users/${userId}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return response.json();
  },

  async updateCartItem(userId: string, itemId: number, quantity: number): Promise<Cart> {
    const response = await fetch(`${API_URL}/users/${userId}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    return response.json();
  },

  async removeCartItem(userId: string, itemId: number): Promise<void> {
    const response = await fetch(`${API_URL}/users/${userId}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to remove cart item');
  },

  async clearCart(userId: string): Promise<Cart> {
    const response = await fetch(`${API_URL}/users/${userId}/cart/items`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to clear cart');
    return response.json();
  },

  // Shipping
  async getAddressByCep(cep: string): Promise<ViaCepAddress> {
    const response = await fetch(`${API_URL}/shipping/address/${cep}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get address');
    return response.json();
  },

  async calculateShipping(data: {
    origin_postal_code: string;
    destination_postal_code: string;
    products: ShippingProduct[];
  }): Promise<ShippingQuote[]> {
    const response = await fetch(`${API_URL}/shipping/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to calculate shipping');
    return response.json();
  },

  // Admin
  async getAdminSummary(): Promise<AdminSummary> {
    const response = await fetch(`${API_URL}/admin/summary`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get admin summary');
    return response.json();
  },

  async getRecentOrders(limit: number = 30): Promise<Order[]> {
    const response = await fetch(`${API_URL}/admin/recent-orders?limit=${limit}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get recent orders');
    return response.json();
  },

  // Mercado Pago
  async createCheckout(testeId: string, userEmail?: string): Promise<MercadoPagoCheckout> {
    const response = await fetch(`${API_URL}/mercado-pago/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ testeId, userEmail }),
    });
    if (!response.ok) throw new Error('Failed to create checkout');
    return response.json();
  },
};
