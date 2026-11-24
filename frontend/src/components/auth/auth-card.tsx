import Link from 'next/link';
import type { FormEvent, ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  footer: { text: string; linkLabel: string; href: string };
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

/** Карточка формы входа или регистрации. */
export function AuthCard({ title, description, submitLabel, pending, error, footer, onSubmit, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {children}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Подождите…' : submitLabel}
          </Button>
          <p className="text-sm text-muted-foreground">
            {footer.text}{' '}
            <Link href={footer.href} className="font-medium text-foreground underline underline-offset-4">
              {footer.linkLabel}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
