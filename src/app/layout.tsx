import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import GlobalMessaging from '@/components/layout/GlobalMessaging';

export const metadata: Metadata = {
  title: 'Dashboard Alumni MMTC Yogyakarta - Portal Karir & Jejaring',
  description: 'Platform karir, portofolio kreatif, dan jejaring resmi alumni STMM "MMTC" Yogyakarta.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
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
          <GlobalMessaging />
        </AuthProvider>
      </body>
    </html>
  );
}
