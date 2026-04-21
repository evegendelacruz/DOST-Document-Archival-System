import type { Metadata } from "next";
import "./globals.css";
import LoadingProvider from "./components/LoadingProvider";

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
      <body>
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
