import { api } from './api';
import { ProductPayload, ProductResponse } from './types';

const PRODUCTS_BASE = '/products';

export const productService = {
  create(payload: ProductPayload, accessToken: string) {
    return api<ProductResponse>(PRODUCTS_BASE, {
      method: 'POST',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  list(accessToken: string) {
    return api<ProductResponse[]>(PRODUCTS_BASE, {
      authToken: accessToken,
    });
  },

  getById(productId: number, accessToken: string) {
    return api<ProductResponse>(`${PRODUCTS_BASE}/${productId}`, {
      authToken: accessToken,
    });
  },

  update(productId: number, payload: Partial<ProductPayload>, accessToken: string) {
    return api<ProductResponse>(`${PRODUCTS_BASE}/${productId}`, {
      method: 'PATCH',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  delete(productId: number, accessToken: string) {
    return api<void>(`${PRODUCTS_BASE}/${productId}`, {
      method: 'DELETE',
      authToken: accessToken,
    });
  },
};
