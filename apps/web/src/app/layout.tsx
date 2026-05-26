import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'HANDLER',
  description: 'Personal command center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              backgroundColor: '#1A1D23',
              border: '1px solid #2A2D35',
              color: '#E8EAF0',
            },
          }}
        />
      </body>
    </html>
  );
}
