import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة معادلات الهندسة',
  description: 'منصة تعليمية متكاملة لطلبة معادلات هندسة',
  keywords: 'معادلات هندسة, تعليم, كتب هندسية, مصر',
  openGraph: {
    title: 'منصة معادلات الهندسة',
    description: 'منصة تعليمية متكاملة لطلبة معادلات هندسة',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo bg-gray-950 text-gray-100 min-h-screen">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-cairo)',
              direction: 'rtl',
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
