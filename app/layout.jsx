import "./globals.css";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export const metadata = {
  title: "SocialLens AI — Comment Analysis",
  description:
    "AI-powered social media comment analysis: summary, topics, sentiment, and keywords.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              <span className="brand-mark">◐</span>
              SocialLens AI
            </Link>
            <div className="header-right">
              <nav className="site-nav" aria-label="Main">
                <Link href="/history">History</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/billing">Billing</Link>
              </nav>
              <AuthButtons />
            </div>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="container">
            <span>SocialLens AI · Understand your audience instantly</span>
            <nav aria-label="Footer">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
