'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/features/auth/use-session';

/** Общий layout страниц входа и регистрации; вошедшего пользователя уводит к проектам. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { data: user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/projects');
  }, [user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div className="text-center">
        <p className="text-3xl" aria-hidden>
          🎬
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Хлопушка</h1>
        <p className="text-sm text-muted-foreground">Трекер задач для видеопродакшна</p>
      </div>
      {children}
    </main>
  );
}
