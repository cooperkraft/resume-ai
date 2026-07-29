import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Resume AI
        </Link>
        <nav className="flex items-center gap-6 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Analyze
          </Link>
          <Link href="/history" className="transition-colors hover:text-foreground">
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
