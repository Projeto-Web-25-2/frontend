import { api } from './api';
import { AddressPayload, AddressResponse, AddressUpdatePayload } from './types';

const USERS_BASE = '/users';
const addressPath = (userId: string) => `${USERS_BASE}/${userId}/addresses`;

export const addressService = {
  create(userId: string, payload: AddressPayload, accessToken: string) {
    return api<AddressResponse>(addressPath(userId), {
      method: 'POST',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  list(userId: string, accessToken: string) {
    return api<AddressResponse[]>(addressPath(userId), {
      authToken: accessToken,
    });
  },

  getById(userId: string, addressId: string, accessToken: string) {
    return api<AddressResponse>(`${addressPath(userId)}/${addressId}`, {
      authToken: accessToken,
    });
  },

  update(userId: string, addressId: string, payload: AddressUpdatePayload, accessToken: string) {
    return api<AddressResponse>(`${addressPath(userId)}/${addressId}`, {
      method: 'PATCH',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  delete(userId: string, addressId: string, accessToken: string) {
    return api<void>(`${addressPath(userId)}/${addressId}`, {
      method: 'DELETE',
      authToken: accessToken,
    });
  },
};
