/**
 * Демо-данные для локальной разработки и показа: `npm run seed -w backend`.
 * Создаёт трёх пользователей из quickstart.md (Аня — продюсер, Боря — монтажёр,
 * Вика — заказчик). Проекты и задачи добавятся в задаче T097.
 *
 * Пароль у всех демо-пользователей одинаковый: DEMO_PASSWORD ниже.
 * Только для локальной базы — не используйте эти данные нигде ещё.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const DEMO_PASSWORD = 'Klapper2026';

const DEMO_USERS = [
  { name: 'Аня', email: 'anya@hlopushka.test' },
  { name: 'Боря', email: 'borya@hlopushka.test' },
  { name: 'Вика', email: 'vika@hlopushka.test' },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
    for (const user of DEMO_USERS) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { ...user, passwordHash },
      });
    }
    console.log(`Демо-пользователи готовы: ${DEMO_USERS.map((u) => u.email).join(', ')}`);
  } finally {
    // Принцип IV: соединение закрывается даже при ошибке.
    await prisma.$disconnect();
  }
}

void main();
