import './globals.css';

export const metadata = {
  title: '토실토실 레시피',
  description: '우리집 레시피 모음 🐷',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '토실토실 레시피',
  },
  icons: {
    icon: [
      { url: '/icon-512.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport = {
  themeColor: '#fdfaf5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="토실토실 레시피" />
      </head>
      <body>{children}</body>
    </html>
  );
}