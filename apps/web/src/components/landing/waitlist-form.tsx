'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { joinWaitlist } from '@/app/(landing)/actions';

interface WaitlistFormProps {
  source: 'homepage' | 'features' | 'how_it_works';
  className?: string;
}

export function WaitlistForm({ source, className }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await joinWaitlist(email, source);
      setResult(res);
      if (res.success) setEmail('');
    });
  }

  if (result?.success) {
    return (
      <div className={cn('flex items-center gap-2 text-sm font-medium text-green-600', className)}>
        <CheckCircle2 className="h-5 w-5" />
        <span>Você está na lista! Entraremos em contato.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      <div className="flex flex-1 flex-col gap-1">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite seu email"
          required
          aria-invalid={!!result?.error}
          aria-describedby={result?.error ? 'waitlist-email-error' : undefined}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {result?.error && (
          <p id="waitlist-email-error" className="text-xs text-destructive">
            {result.error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending || !email.trim()} className="shrink-0">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar na Lista'
        )}
      </Button>
    </form>
  );
}
