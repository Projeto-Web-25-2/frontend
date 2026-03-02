import { api } from './api';
import type {
  ShippingCalculateRequestDTO,
  ShippingQuoteDTO,
  ViaCepAddressDTO,
} from './types';

const SHIPPING_BASE = '/shipping';

const normalizeCep = (cep: string) => cep.replace(/\D/g, '');

export const shippingService = {
  getAddressByCep(cep: string, accessToken: string) {
    const sanitizedCep = normalizeCep(cep);
    return api<ViaCepAddressDTO>(`${SHIPPING_BASE}/address/${sanitizedCep}`, {
      authToken: accessToken,
    });
  },

  getQuotes(payload: ShippingCalculateRequestDTO, accessToken: string) {
    return api<ShippingQuoteDTO[]>(`${SHIPPING_BASE}/quotes`, {
      method: 'POST',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },
};
