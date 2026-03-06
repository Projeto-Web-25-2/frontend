export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    email: string;
    uid: string;
    role?: 'admin' | 'user' | 'publisher';
  };
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  cpf: string;
  password: string;
}

export interface UserResponse {
  uid: string;
  full_name: string;
  email: string;
  cpf: string;
  role?: 'admin' | 'user' | 'publisher';
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  password?: string;
}

export interface AddressPayload {
  street: string;
  street_number: number;
  neighborhood: string;
  city: string;
  state_code: string;
  zip_code: string;
  country?: string;
  complement?: string | null;
  reference?: string | null;
  address_type: string;
  primary: boolean;
}

export interface AddressResponse extends AddressPayload {
  uid: string;
  user_uid: string;
}

export type AddressUpdatePayload = Partial<Omit<AddressPayload, 'primary' | 'address_type'>> & {
  address_type?: string;
  primary?: boolean;
};

export interface ViaCepAddressDTO {
  postal_code: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ShippingProductDTO {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

export interface ShippingCalculateRequestDTO {
  origin_postal_code: string;
  destination_postal_code: string;
  products: ShippingProductDTO[];
}

export interface ShippingCompanyDTO {
  id?: string;
  name?: string;
  picture?: string;
}

export interface ShippingDeliveryTimeDTO {
  days?: number;
  min?: number;
  max?: number;
  unit?: string;
  estimated_at?: string;
  forecast?: string;
  date?: string;
  hours?: number;
  minutes?: number;
  cycle?: string;
  delivery_range?: {
    min?: number;
    max?: number;
  };
  [key: string]: unknown;
}

export interface ShippingQuoteDTO {
  id?: string;
  name?: string;
  price?: number;
  final_price?: number;
  custom_price?: number;
  company?: ShippingCompanyDTO;
  delivery_time?: ShippingDeliveryTimeDTO | string | number | null;
  currency?: string;
  [key: string]: unknown;
}

export type ProductType = 'physical_book' | 'ebook' | 'kit' | 'magazine';
export type EbookFormat = 'pdf' | 'epub' | 'mobi';

export interface ProductPayload {
  title: string;
  description: string;
  price: number;
  stock: number;
  active?: boolean;
  product_type: ProductType;
  isbn?: string;
  author?: string;
  publisher?: string;
  pub_year?: number;
  edition?: string;
  num_pages?: number;
  weight?: number;
  dimensions?: string;
  language?: string;
  format?: EbookFormat;
  size?: number;
  file_path?: string;
  discount_percent?: number;
  category: string;
  image?: string;
  image_url?: string;
  cover_url?: string;
  tags?: string[];
  featured?: boolean;
  original_price?: number;
}

export interface ProductResponse extends ProductPayload {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface OrderCreatePayload {
  address_uid: string;
  items: OrderItemPayload[];
  shipping: number;
  discount?: number;
  note?: string | null;
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderResponse {
  id: number;
  order_number: string;
  customer_uid: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  address_uid: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemResponse[];
}

export interface OrderUpdatePayload {
  status?: OrderStatus;
  shipping?: number;
  discount?: number;
  note?: string | null;
}

export interface CartItemPayload {
  product_id: number;
  quantity: number;
}

export interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
}

export interface CartResponse {
  id: number;
  user_uid: string;
  created_at: string;
  updated_at: string;
  items: CartItemResponse[];
}

export interface CartItemUpdatePayload {
  quantity: number;
}

export interface AdminSummary {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
}

export interface MercadoPagoCheckoutRequest {
  testeId: string;
  userEmail?: string;
}

export interface MercadoPagoCheckoutResponse {
  preferenceId: string;
  initPoint: string;
}

