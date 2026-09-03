import { Providers } from "./provider";
import "./globals.css";
// ...other imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* ...your other providers... */}
          {children}
        </Providers>
      </body>
    </html>
  );
}