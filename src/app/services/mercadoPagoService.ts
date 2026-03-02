import { api } from './api';
import type { MercadoPagoCheckoutRequest, MercadoPagoCheckoutResponse } from './types';

const MERCADO_PAGO_BASE = '/mercado-pago';

export const mercadoPagoService = {
  createCheckout(payload: MercadoPagoCheckoutRequest, accessToken: string) {
    return api<MercadoPagoCheckoutResponse>(`${MERCADO_PAGO_BASE}/create-checkout`, {
      method: 'POST',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },
};
