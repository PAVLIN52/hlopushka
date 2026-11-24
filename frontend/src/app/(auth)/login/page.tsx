'use client';

import { useState, type FormEvent } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { FormField } from '@/components/auth/form-field';
import { toFieldErrors } from '@/features/auth/field-errors';
import { useLogin } from '@/features/auth/use-session';

/** Страница входа (US1, сценарии 2–3). */
export default function LoginPage() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const { fields, common } = login.error ? toFieldErrors(login.error) : { fields: {}, common: null };
  const localErrors = {
    email: touched && !email.trim() ? 'Введите email' : undefined,
    password: touched && !password ? 'Введите пароль' : undefined,
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!email.trim() || !password) return;
    login.mutate({ email, password });
  };

  return (
    <AuthCard
      title="Вход"
      description="Войдите, чтобы открыть свои проекты"
      submitLabel="Войти"
      pending={login.isPending}
      error={common}
      footer={{ text: 'Нет аккаунта?', linkLabel: 'Зарегистрироваться', href: '/register' }}
      onSubmit={onSubmit}
    >
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={localErrors.email ?? fields.email}
      />
      <FormField
        id="password"
        label="Пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={localErrors.password ?? fields.password}
      />
    </AuthCard>
  );
}
