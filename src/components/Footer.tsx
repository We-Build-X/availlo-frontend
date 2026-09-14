const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border/50">
          <p className="text-sm text-muted-foreground tracking-tight">
            &copy; {year} <span className="font-medium text-foreground/80">Availlo</span>
            <span className="hidden sm:inline mx-2 text-border">&mdash;</span>
            <span className="block sm:inline text-xs">Find your space</span>
          </p>
          <nav className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="/explore" className="hover:text-foreground transition-colors">Explore</a>
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
          </nav>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground/50">
            Built for students, by students.
          </p>
          <a
            href="/admin/dashboard"
            className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
