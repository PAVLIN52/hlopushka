'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { LoginDto, RegisterDto, UserDto } from '@hlopushka/shared';

import { ApiRequestError } from '@/lib/api-client';

import { authApi } from './api';

/** Ключ кеша текущей сессии. */
export const SESSION_KEY = ['session'] as const;

/**
 * Текущий пользователь: `UserDto`, если вошёл, `null`, если нет.
 * 401 — это не ошибка, а «не вошёл».
 */
export function useSession() {
  return useQuery<UserDto | null>({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      try {
        return (await authApi.me()).user;
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });
}

/** Вход: после успеха кладёт пользователя в кеш и ведёт к проектам. */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(SESSION_KEY, user);
      router.replace('/projects');
    },
  });
}

/** Регистрация: сразу входит в систему и ведёт к проектам. */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(SESSION_KEY, user);
      router.replace('/projects');
    },
  });
}

/** Выход: отзывает сессию на сервере, очищает весь кеш и ведёт на вход. */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
}
