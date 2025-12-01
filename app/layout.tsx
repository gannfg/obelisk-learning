import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { UserSync } from "@/components/user-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web3 Coding Academy",
  description:
    "Learn Web3, blockchain, and modern web development with expert-led courses and hands-on projects.",
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
                const theme = localStorage.getItem('theme') || 'light';
                const root = document.documentElement;
                // Remove all theme classes first
                root.classList.remove('dark', 'blue');
                // Add the appropriate theme class
                if (theme === 'dark') {
                  root.classList.add('dark');
                } else if (theme === 'blue') {
                  root.classList.add('blue');
                }
                // light theme doesn't need a class
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <UserSync />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-14 sm:pt-16 pb-20 md:pb-0 safe-area-inset-bottom">{children}</main>
            <Footer />
            <MobileNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
