'use client';

import { useState, type FormEvent } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { FormField } from '@/components/auth/form-field';
import { toFieldErrors } from '@/features/auth/field-errors';
import { useRegister } from '@/features/auth/use-session';

/** То же правило, что на сервере (FR-003): от 8 символов, есть буква и цифра. */
const PASSWORD_RULE = /^(?=.*\p{L})(?=.*\d).{8,}$/u;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Страница регистрации (US1, сценарии 1, 4). */
export default function RegisterPage() {
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState(false);

  const { fields, common } = register.error ? toFieldErrors(register.error) : { fields: {}, common: null };
  const localErrors = touched
    ? {
        name: form.name.trim() ? undefined : 'Введите имя',
        email: EMAIL_RULE.test(form.email.trim()) ? undefined : 'Некорректный email',
        password: PASSWORD_RULE.test(form.password)
          ? undefined
          : 'Пароль должен быть не короче 8 символов и содержать букву и цифру',
      }
    : { name: undefined, email: undefined, password: undefined };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!form.name.trim() || !EMAIL_RULE.test(form.email.trim()) || !PASSWORD_RULE.test(form.password)) return;
    register.mutate(form);
  };

  return (
    <AuthCard
      title="Регистрация"
      description="Создайте аккаунт, чтобы вести проекты и задачи"
      submitLabel="Создать аккаунт"
      pending={register.isPending}
      error={common}
      footer={{ text: 'Уже есть аккаунт?', linkLabel: 'Войти', href: '/login' }}
      onSubmit={onSubmit}
    >
      <FormField id="name" label="Имя" autoComplete="name" value={form.name} onChange={set('name')} error={localErrors.name ?? fields.name} />
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={set('email')}
        error={localErrors.email ?? fields.email}
      />
      <FormField
        id="password"
        label="Пароль"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={set('password')}
        error={localErrors.password ?? fields.password}
        hint="Не короче 8 символов, хотя бы одна буква и одна цифра"
      />
    </AuthCard>
  );
}
