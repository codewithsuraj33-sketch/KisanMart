import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import NavbarGate from "@/components/navbar-gate";
import Footer from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { CompareProvider } from "@/components/compare-provider";
import { ToastProvider } from "@/components/ui/toast";
import TopProgress from "@/components/ui/top-progress";

// Display font — modern Indian-startup feel (headings, hero, logo)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body font — clean, highly readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KisanMart — Fresh Seeds & Farm Essentials",
  description:
    "India's trusted agri store. Quality-tested seeds, fertilizers, pesticides and tools for Indian farmers — direct from trusted manufacturers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-body">
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <TopProgress />
                <NavbarGate>
                  <Navbar />
                </NavbarGate>
                {children}
                <NavbarGate>
                  <Footer />
                </NavbarGate>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
