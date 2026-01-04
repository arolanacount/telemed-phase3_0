import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedAssistant - Healthcare Platform',
  description: 'Secure telemedicine platform for healthcare professionals and patients.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'MedAssistant - Healthcare Platform',
    description: 'Secure telemedicine platform for healthcare professionals and patients.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'MedAssistant - Healthcare Platform',
    description: 'Secure telemedicine platform for healthcare professionals and patients.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
