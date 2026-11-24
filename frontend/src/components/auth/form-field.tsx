import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
}

/** Поле формы: подпись, ввод, подсказка или ошибка под ним. */
export function FormField({ id, label, error, hint, ...inputProps }: FormFieldProps) {
  const describedBy = error || hint ? `${id}-description` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      {(error || hint) && (
        <p id={describedBy} className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
