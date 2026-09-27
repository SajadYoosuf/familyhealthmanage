import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Health',
  description: 'Store and view your family medical records',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';
  return (
    <html lang="en">
      <body>
        {children}
        {isDev && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var script=document.createElement('script');script.src='//cdn.jsdelivr.net/npm/eruda';script.onload=function(){eruda.init()};document.body.appendChild(script);})()`,
            }}
          />
        )}
      </body>
    </html>
  );
}
