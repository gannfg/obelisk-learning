import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Superteam Study
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <span className="font-medium text-foreground">Superteam Indonesia</span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="font-medium text-foreground">Obelisk Protocol</span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-2">
            © {year} Superteam Study. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

