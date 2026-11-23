import {
  AccessDeniedException,
  ConflictException,
  CustomException,
  NotFoundException,
  UnauthorizedException,
  ValidationException,
} from './index';

describe('Иерархия исключений (принцип III)', () => {
  it('CustomException хранит сообщение, значение и код', () => {
    const error = new CustomException('Что-то пошло не так', { id: 42 }, 'SOME_CODE');

    expect(error.message).toBe('Что-то пошло не так');
    expect(error.value).toEqual({ id: 42 });
    expect(error.code).toBe('SOME_CODE');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CustomException');
    expect(error.stack).toBeDefined();
  });

  it.each([
    ['NotFoundException', NotFoundException],
    ['ValidationException', ValidationException],
    ['AccessDeniedException', AccessDeniedException],
    ['ConflictException', ConflictException],
    ['UnauthorizedException', UnauthorizedException],
  ])('%s — наследник CustomException и Error', (name, ExceptionClass) => {
    const error = new ExceptionClass('сообщение', 'значение', 'CODE');

    expect(error).toBeInstanceOf(ExceptionClass);
    expect(error).toBeInstanceOf(CustomException);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
    expect(error.code).toBe('CODE');
    expect(error.value).toBe('значение');
  });

  it('значение по умолчанию — undefined', () => {
    expect(new NotFoundException('нет', undefined, 'X').value).toBeUndefined();
  });
});
