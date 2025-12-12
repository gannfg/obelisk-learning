import type { Metadata } from "next";
import "./globals.css";
import "react-easy-crop/react-easy-crop.css";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { UserSync } from "@/components/user-sync";

export const metadata: Metadata = {
  title: "Superteam Study | Web3 Coding Academy",
  description:
    "Learn Web3, blockchain, and modern web development with expert-led classes and hands-on projects.",
  icons: {
    icon: "/favicon_tab.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'dark') {
                  root.classList.add('dark');
                } else {
                  root.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <UserSync />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-14 sm:pt-16 pb-16 md:pb-0">{children}</main>
            <MobileNav />
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
