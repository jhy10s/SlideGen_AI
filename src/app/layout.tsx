import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Playfair_Display, Open_Sans } from "next/font/google";
import "./globals.css";
import "../styles/slides.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NetworkStatus from "@/components/NetworkStatus";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"] });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Slide Generator SaaS - AI-Powered Presentations",
  description: "Create stunning presentations with AI. Generate slides, customize themes, and export to PowerPoint.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <NetworkStatus />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
