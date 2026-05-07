const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">
          © {year} Availlo
        </p>
        <a
          href="/admin/dashboard"
          className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          Admin
        </a>
      </div>
    </footer>
  );
};

export default Footer;
