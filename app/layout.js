import './globals.css';

export const metadata = {
  title: '토실토실 레시피',
  description: '우리집 레시피 모음',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="theme-color" content="#fdfaf5" />
      </head>
      <body>{children}</body>
    </html>
  );
}