import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/app/components/Navbar';
import ClientSessionProvider from '@/app/components/ClientSessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ERP System',
  description: 'A Next.js-based ERP system with authentication',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientSessionProvider>
          <Navbar />
          <main className="container mx-auto p-4">{children}</main>
        </ClientSessionProvider>
      </body>
    </html>
  );
}