'use client';

import { useSession } from '@/features/auth/use-session';

/** Список проектов. Пока заглушка: сами проекты появятся в US2. */
export default function ProjectsPage() {
  const { data: user } = useSession();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Мои проекты</h1>
      <p className="text-muted-foreground">
        {user?.name}, проектов пока нет. Создание проектов появится на следующем шаге.
      </p>
    </div>
  );
}
