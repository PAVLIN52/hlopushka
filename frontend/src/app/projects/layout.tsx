'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { AppHeader } from '@/components/projects/app-header';
import { useSession } from '@/features/auth/use-session';

/** Layout защищённой части: шапка и переход на вход, если сессия истекла. */
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && user === null) router.replace('/login');
  }, [isPending, user, router]);

  return (
    <div className="min-h-screen bg-muted/40">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">{user ? children : null}</main>
    </div>
  );
}
