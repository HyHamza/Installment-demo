import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/Layout";
import { ProfileProviderWrapper } from "@/components/ProfileProviderWrapper";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Installment Management",
  description: "Simple app to manage daily installments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <ProfileProviderWrapper>
            <Layout>
            {children}
            </Layout>
        </ProfileProviderWrapper>
      </body>
    </html>
  );
}
