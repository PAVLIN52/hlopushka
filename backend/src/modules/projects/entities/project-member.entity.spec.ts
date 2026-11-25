import { Role } from '@hlopushka/shared';

import { ErrorCodes, ValidationException } from '@/core/exceptions';

import { ProjectMember } from './project-member.entity';

const JOINED_AT = new Date('2026-11-20T10:00:00.000Z');

const member = (role: Role): ProjectMember => new ProjectMember('project-1', 'user-1', role, JOINED_AT);

describe('ProjectMember', () => {
  describe('ensureCanStopBeingProducer (FR-010)', () => {
    it('последний продюсер не может перестать быть продюсером → LAST_PRODUCER', () => {
      const act = (): void => member(Role.PRODUCER).ensureCanStopBeingProducer(1);

      expect(act).toThrow(ValidationException);
      expect(act).toThrow(expect.objectContaining({ code: ErrorCodes.LAST_PRODUCER, value: { userId: 'user-1' } }));
    });

    it('продюсер может перестать им быть, если есть другой продюсер', () => {
      expect(() => member(Role.PRODUCER).ensureCanStopBeingProducer(2)).not.toThrow();
    });

    it.each([Role.EDITOR, Role.COLORIST, Role.CLIENT])('для роли %s проверка не нужна', (role) => {
      expect(() => member(role).ensureCanStopBeingProducer(1)).not.toThrow();
    });
  });

  it('toDto отдаёт только публичные поля пользователя', () => {
    const user = { id: 'user-1', name: 'Боря', email: 'borya@x.ru', passwordHash: 'secret' };

    expect(member(Role.EDITOR).toDto(user)).toEqual({
      user: { id: 'user-1', name: 'Боря', email: 'borya@x.ru' },
      role: Role.EDITOR,
      joinedAt: '2026-11-20T10:00:00.000Z',
    });
  });
});
