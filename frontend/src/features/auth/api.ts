import type { AuthResponse, LoginDto, RegisterDto } from '@hlopushka/shared';

import { api } from '@/lib/api-client';

/** Запросы авторизации (contracts/rest-api.md → Auth). */
export const authApi = {
  me: () => api.get<AuthResponse>('/auth/me'),
  login: (dto: LoginDto) => api.post<AuthResponse>('/auth/login', dto),
  register: (dto: RegisterDto) => api.post<AuthResponse>('/auth/register', dto),
  logout: () => api.post<void>('/auth/logout'),
};
