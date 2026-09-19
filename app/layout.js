import './globals.css';
import Shell from './Shell';

export const metadata = { title: 'TheBlip', description: 'Make better money decisions before you swipe.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
