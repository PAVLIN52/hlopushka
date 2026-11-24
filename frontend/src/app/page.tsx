import { redirect } from 'next/navigation';

/** Корень сайта ведёт к проектам; без сессии middleware отправит на вход. */
export default function HomePage() {
  redirect('/projects');
}
