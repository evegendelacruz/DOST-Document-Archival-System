import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOST - Department of Science and Technology",
  description: "Provincial Science and Technology Office in Misamis Oriental",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
