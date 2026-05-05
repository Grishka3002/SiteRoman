import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Роман Шумилов",
  description: "Ведущий свадебных, корпоративных и деловых событий",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-black">{children}</body>
    </html>
  );
}
