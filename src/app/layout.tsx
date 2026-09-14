import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import AskHldAssistant from '@/components/AskHldAssistant';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CAIS HLD Generator | Enterprise Credit Bureau Change Design System',
  description: 'Structured High-Level Design document generator for UK CAIS monthly file changes submitted to Experian, Equifax, and TransUnion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col transition-colors duration-200">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-28">
                {children}
              </main>
              <AskHldAssistant />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
