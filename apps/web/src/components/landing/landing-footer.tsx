import Link from 'next/link';
import { Code2 } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Code2 className="h-4 w-4" />
          <span className="text-sm font-medium">CodeMentor</span>
        </div>

        <nav className="flex items-center space-x-6 text-sm text-muted-foreground">
          <Link href="/features" className="hover:text-foreground transition-colors">
            Funcionalidades
          </Link>
          <Link href="/how-it-works" className="hover:text-foreground transition-colors">
            Como Funciona
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Entrar
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CodeMentor
        </p>
      </div>
    </footer>
  );
}
