import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "St. Mary's Hospital | Voice Triage System",
  description: "Advanced AI Voice Triage and Patient Management Dashboard",
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
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${lexend.variable} font-display antialiased`}>
        <ClerkProvider
          appearance={{
            elements: {
              footer: "hidden",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

