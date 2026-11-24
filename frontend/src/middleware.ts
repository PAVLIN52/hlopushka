import { NextResponse, type NextRequest } from 'next/server';

/**
 * Защита маршрутов (FR-005): без cookie сессии защищённые страницы недоступны —
 * переадресация на /login. Действительность токена проверяет бэкенд; если сессия
 * истекла, клиент получит 401 и тоже уйдёт на вход.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('access_token') || request.cookies.has('refresh_token');
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/projects/:path*'],
};
