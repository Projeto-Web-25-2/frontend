import { api } from './api';
import { OrderCreatePayload, OrderResponse, OrderUpdatePayload } from './types';

const USERS_BASE = '/users';
const ordersPath = (userId: string) => `${USERS_BASE}/${userId}/orders`;

export const orderService = {
  create(userId: string, payload: OrderCreatePayload, accessToken: string) {
    return api<OrderResponse>(ordersPath(userId), {
      method: 'POST',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  list(userId: string, accessToken: string) {
    return api<OrderResponse[]>(ordersPath(userId), {
      authToken: accessToken,
    });
  },

  getById(userId: string, orderId: number, accessToken: string) {
    return api<OrderResponse>(`${ordersPath(userId)}/${orderId}`, {
      authToken: accessToken,
    });
  },

  update(userId: string, orderId: number, payload: OrderUpdatePayload, accessToken: string) {
    return api<OrderResponse>(`${ordersPath(userId)}/${orderId}`, {
      method: 'PATCH',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  delete(userId: string, orderId: number, accessToken: string) {
    return api<void>(`${ordersPath(userId)}/${orderId}`, {
      method: 'DELETE',
      authToken: accessToken,
    });
  },
};
