import { Role } from '@hlopushka/shared';

import { ErrorCodes, NotFoundException, ValidationException } from '@/core/exceptions';

import { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/users.service';

import { ProjectMember } from './entities/project-member.entity';
import { IMembersTransaction, MemberDetails, ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

const PROJECT_ID = 'project-1';
const JOINED_AT = new Date('2026-11-20T10:00:00.000Z');

/** Хранилище участников в памяти вместо БД: те же операции, что у `ProjectsRepository`. */
class FakeMembersRepository {
  public readonly roles = new Map<string, Role>();
  public readonly unassigned: string[] = [];
  public transactions = 0;

  public async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    const role = this.roles.get(userId);
    return role ? new ProjectMember(projectId, userId, role, JOINED_AT) : null;
  }

  public async addMember(projectId: string, userId: string, role: Role): Promise<MemberDetails> {
    this.roles.set(userId, role);
    return this.details(userId);
  }

  public async changeMembers<T>(projectId: string, work: (members: IMembersTransaction) => Promise<T>): Promise<T> {
    this.transactions += 1;
    return work({
      findMember: (userId) => this.findMember(projectId, userId),
      countProducers: async () => [...this.roles.values()].filter((role) => role === Role.PRODUCER).length,
      updateRole: async (userId, role) => {
        this.roles.set(userId, role);
        return this.details(userId);
      },
      removeMember: async (userId) => {
        this.roles.delete(userId);
        this.unassigned.push(userId);
      },
    });
  }

  private details(userId: string): MemberDetails {
    const role = this.roles.get(userId) as Role;
    return {
      member: new ProjectMember(PROJECT_ID, userId, role, JOINED_AT),
      user: { id: userId, name: userId, email: `${userId}@x.ru` },
    };
  }
}

/** Пользователи, зарегистрированные «в системе». */
class FakeUsersService {
  constructor(private readonly emails: Record<string, string>) {}

  public async getByEmail(email: string): Promise<User> {
    const id = this.emails[email];
    if (!id) throw new NotFoundException('Пользователь не найден', email, ErrorCodes.USER_NOT_FOUND);
    return new User(id, id, email, JOINED_AT);
  }
}

describe('ProjectsService — участники (FR-008…FR-010)', () => {
  let repo: FakeMembersRepository;
  let service: ProjectsService;

  beforeEach(() => {
    repo = new FakeMembersRepository();
    repo.roles.set('anya', Role.PRODUCER);
    const users = new FakeUsersService({ 'borya@x.ru': 'borya', 'anya@x.ru': 'anya' });
    service = new ProjectsService(repo as unknown as ProjectsRepository, users as unknown as UsersService);
  });

  describe('addMember', () => {
    it('добавляет зарегистрированного пользователя с выбранной ролью', async () => {
      const added = await service.addMember(PROJECT_ID, { email: 'borya@x.ru', role: Role.EDITOR });

      expect(added.member).toMatchObject({ userId: 'borya', role: Role.EDITOR });
      expect(repo.roles.get('borya')).toBe(Role.EDITOR);
    });

    it('незарегистрированный email → USER_NOT_FOUND', async () => {
      await expect(service.addMember(PROJECT_ID, { email: 'nobody@x.ru', role: Role.EDITOR })).rejects.toMatchObject({
        code: ErrorCodes.USER_NOT_FOUND,
      });
    });

    it('уже участник → MEMBER_ALREADY_EXISTS, роль не меняется', async () => {
      const act = service.addMember(PROJECT_ID, { email: 'anya@x.ru', role: Role.CLIENT });

      await expect(act).rejects.toBeInstanceOf(ValidationException);
      await expect(act).rejects.toMatchObject({ code: ErrorCodes.MEMBER_ALREADY_EXISTS });
      expect(repo.roles.get('anya')).toBe(Role.PRODUCER);
    });
  });

  describe('changeMemberRole', () => {
    it('меняет роль в транзакции', async () => {
      repo.roles.set('borya', Role.EDITOR);

      const changed = await service.changeMemberRole(PROJECT_ID, 'borya', Role.COLORIST);

      expect(changed.member.role).toBe(Role.COLORIST);
      expect(repo.transactions).toBe(1);
    });

    it('последний продюсер не может сменить роль → LAST_PRODUCER', async () => {
      await expect(service.changeMemberRole(PROJECT_ID, 'anya', Role.EDITOR)).rejects.toMatchObject({
        code: ErrorCodes.LAST_PRODUCER,
      });
      expect(repo.roles.get('anya')).toBe(Role.PRODUCER);
    });

    it('продюсер может сменить роль, если есть второй продюсер', async () => {
      repo.roles.set('borya', Role.PRODUCER);

      await service.changeMemberRole(PROJECT_ID, 'anya', Role.EDITOR);

      expect(repo.roles.get('anya')).toBe(Role.EDITOR);
    });

    it('единственный продюсер может «сменить» роль на ту же', async () => {
      await expect(service.changeMemberRole(PROJECT_ID, 'anya', Role.PRODUCER)).resolves.toBeDefined();
    });

    it('не участник → MEMBER_NOT_FOUND', async () => {
      await expect(service.changeMemberRole(PROJECT_ID, 'ghost', Role.EDITOR)).rejects.toMatchObject({
        code: ErrorCodes.MEMBER_NOT_FOUND,
      });
    });
  });

  describe('removeMember', () => {
    it('удаляет участника и снимает его с задач', async () => {
      repo.roles.set('borya', Role.EDITOR);

      await service.removeMember(PROJECT_ID, 'borya');

      expect(repo.roles.has('borya')).toBe(false);
      expect(repo.unassigned).toEqual(['borya']);
    });

    it('последнего продюсера удалить нельзя → LAST_PRODUCER', async () => {
      await expect(service.removeMember(PROJECT_ID, 'anya')).rejects.toMatchObject({ code: ErrorCodes.LAST_PRODUCER });
      expect(repo.roles.has('anya')).toBe(true);
    });

    it('не участник → MEMBER_NOT_FOUND', async () => {
      await expect(service.removeMember(PROJECT_ID, 'ghost')).rejects.toMatchObject({ code: ErrorCodes.MEMBER_NOT_FOUND });
    });
  });
});
