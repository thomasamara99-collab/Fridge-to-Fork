import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fridge to Fork",
  description:
    "A meal discovery app matched to your macros, fridge, hunger, and schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
