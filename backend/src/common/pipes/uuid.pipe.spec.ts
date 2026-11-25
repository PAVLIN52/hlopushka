import { ErrorCodes, NotFoundException } from '@/core/exceptions';

import { UuidPipe } from './uuid.pipe';

describe('UuidPipe', () => {
  const pipe = new UuidPipe('Участник не найден', ErrorCodes.MEMBER_NOT_FOUND);

  it('пропускает UUID без изменений', () => {
    expect(pipe.transform('11111111-1111-4111-8111-111111111111')).toBe('11111111-1111-4111-8111-111111111111');
  });

  it.each(['not-a-uuid', '', '11111111-1111-4111-8111-11111111111'])('«%s» → NotFoundException с кодом сущности', (value) => {
    const act = (): string => pipe.transform(value);

    expect(act).toThrow(NotFoundException);
    expect(act).toThrow(expect.objectContaining({ code: ErrorCodes.MEMBER_NOT_FOUND, message: 'Участник не найден', value }));
  });
});
