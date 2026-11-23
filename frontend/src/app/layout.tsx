import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { Providers } from './providers';
import './globals.css';

const inter = Inter({ variable: '--font-sans', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Хлопушка',
  description: 'Канбан-трекер задач для видеопродакшна',
};

/** Корневой layout: русский язык, шрифт с кириллицей, клиентские провайдеры. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
