import { api } from './api';
import {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  SignupPayload,
  UpdateUserPayload,
  UserResponse,
} from './types';

const USERS_BASE = '/users';

export const authService = {
  login(payload: LoginPayload) {
    return api<LoginResponse>(`${USERS_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  refreshToken(refreshToken: string) {
    return api<RefreshTokenResponse>(`${USERS_BASE}/refresh_token`, {
      method: 'GET',
      authToken: refreshToken,
    });
  },

  logout(accessToken: string) {
    return api<{ message: string }>(`${USERS_BASE}/logout`, {
      method: 'GET',
      authToken: accessToken,
    });
  },

  getProfile(accessToken: string) {
    return api<UserResponse>(`${USERS_BASE}/me`, {
      authToken: accessToken,
    });
  },

  signup(payload: SignupPayload) {
    return api<UserResponse>(`${USERS_BASE}/signup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUser(userId: string, payload: UpdateUserPayload, accessToken: string) {
    return api<UserResponse>(`${USERS_BASE}/${userId}`, {
      method: 'PATCH',
      authToken: accessToken,
      body: JSON.stringify(payload),
    });
  },

  listUsers(accessToken: string) {
    return api<UserResponse[]>(USERS_BASE, {
      authToken: accessToken,
    });
  },

  getUserById(userId: string, accessToken: string) {
    return api<UserResponse>(`${USERS_BASE}/${userId}`, {
      authToken: accessToken,
    });
  },

  deleteUser(userId: string, accessToken: string) {
    return api<void>(`${USERS_BASE}/${userId}`, {
      method: 'DELETE',
      authToken: accessToken,
    });
  },
};
