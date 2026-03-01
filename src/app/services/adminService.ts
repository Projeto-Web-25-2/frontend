import { api } from './api';
import type { AdminSummary, OrderResponse } from './types';

const ADMIN_BASE_PATH = '/admin';

export const adminService = {
  getSummary(accessToken: string) {
    return api<AdminSummary>(`${ADMIN_BASE_PATH}/summary`, {
      authToken: accessToken,
    });
  },
  getRecentOrders(accessToken: string, limit = 30) {
    const params = new URLSearchParams();
    if (limit) {
      params.set('limit', limit.toString());
    }

    const query = params.toString();
    const path = `${ADMIN_BASE_PATH}/recent-orders${query ? `?${query}` : ''}`;

    return api<OrderResponse[]>(path, {
      authToken: accessToken,
    });
  },
};
