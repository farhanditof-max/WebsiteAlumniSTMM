import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Dashboard Alumni MMTC Yogyakarta - Portal Karir & Jejaring',
  description: 'Platform karir, portofolio kreatif, dan jejaring resmi alumni STMM "MMTC" Yogyakarta.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
