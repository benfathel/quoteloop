import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-page-bg border-t border-dark-border">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="text-lg font-bold text-txt-primary tracking-tight">
            QuoteLoop
          </Link>
          <div className="flex items-center gap-8">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Login", href: "/login" },
              { label: "Register", href: "/register" },
            ].map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-txt-secondary hover:text-txt-primary transition-colors duration-200"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-txt-secondary hover:text-txt-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-8 pt-6 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-txt-secondary">
            &copy; 2026 QuoteLoop. Made for tradespeople.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-txt-secondary hover:text-txt-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-txt-secondary hover:text-txt-primary transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
