import type { Metadata } from "next";
import { Lexend, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden",
        },
      }}
    >
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className={`${lexend.variable} ${jakarta.variable} font-display antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

