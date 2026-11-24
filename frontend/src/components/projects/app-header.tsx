'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { useLogout, useSession } from '@/features/auth/use-session';

/** Шапка приложения: название, имя пользователя и кнопка «Выйти». */
export function AppHeader() {
  const { data: user } = useSession();
  const logout = useLogout();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/projects" className="flex items-center gap-2 font-semibold">
          <span aria-hidden>🎬</span> Хлопушка
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Выйти
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
