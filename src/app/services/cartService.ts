import { api } from './api';
import { CartItemPayload, CartItemUpdatePayload, CartResponse } from './types';

const USERS_BASE = '/users';
const cartPath = (userId: string) => `${USERS_BASE}/${userId}/cart`;

export const cartService = {
  get(userId: string, accessToken: string) {
    return api<CartResponse>(cartPath(userId), {
      authToken: accessToken,
    });
  },

  addItem(userId: string, payload: CartItemPayload, accessToken: string) {
    return api<CartResponse>(`${cartPath(userId)}/items`, {
      method: 'POST',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  updateItem(userId: string, itemId: number, payload: CartItemUpdatePayload, accessToken: string) {
    return api<CartResponse>(`${cartPath(userId)}/items/${itemId}`, {
      method: 'PATCH',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  deleteItem(userId: string, itemId: number, accessToken: string) {
    return api<void>(`${cartPath(userId)}/items/${itemId}`, {
      method: 'DELETE',
      authToken: accessToken,
    });
  },

  clear(userId: string, accessToken: string) {
    return api<CartResponse>(`${cartPath(userId)}/items`, {
      method: 'DELETE',
      authToken: accessToken,
    });
  },
};
