import './globals.css';
import Nav from './Nav';

export const metadata = { title: 'TheBlip', description: 'Make better money decisions before you swipe.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
